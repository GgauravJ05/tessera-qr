"""
Stage 3: train a scannability model and check whether it is actually better
than the two-threshold rule the app already ships.

The point of this script is not to produce a good-looking number. It is to
answer three questions honestly:

  1. Does a model beat the shipped heuristic, judged at the heuristic's own
     false-alarm rate rather than at whatever operating point flatters it?
  2. Does it learn anything beyond contrast, or has it just rediscovered the
     3:1 threshold in a more expensive form?
  3. Is the winner small enough and fast enough to ship into a 764 KB app that
     has to keep working offline?

A model that fails any of those should not be deployed, and this prints enough
to tell.
"""

import json
import sys
from pathlib import Path

import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent / "artifacts"


def dataset_path():
    """`--data <path>`, defaulting to the dataset generate.mjs writes."""
    argv = sys.argv[1:]
    if "--data" in argv:
        return Path(argv[argv.index("--data") + 1]).resolve()
    return ROOT / "data" / "scans.jsonl"

SEED = 20260908

# The threshold the app ships today, from src/lib/contrast.ts.
CONTRAST_FAIL_BELOW = 3.0

# Features the shipped heuristic could in principle be computed from. The
# ablation trains on only these, to separate "the model learned something new"
# from "the model relearned contrast".
CONTRAST_ONLY = {
    "contrast_ratio",
    "contrast_log",
    "fg_luminance",
    "bg_luminance",
    "luminance_delta",
    "inverted",
}


def load(path):
    if not path.exists():
        sys.exit(f"No dataset at {path}. Run tools/scanlab/generate.mjs first.")
    rows = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    if len(rows) < 200:
        sys.exit(f"Only {len(rows)} rows; too few to conclude anything.")
    return rows


def build(rows, names):
    X = np.array([r["features"] for r in rows], dtype=np.float64)
    rung = np.array([r["labels"]["distanceRung"] for r in rows], dtype=np.float64)
    # Primary target: does this design decode at all under a mild camera?
    # This is the verdict the app's badge actually makes, so it is the one
    # that can be compared against the heuristic like for like.
    y = (rung >= 0).astype(int)
    ratio = X[:, names.index("contrast_ratio")]
    return X, y, rung, ratio


def rates(y_true, y_pred):
    """Recall on failures and the false-alarm rate, which is the tradeoff."""
    fail = y_true == 0
    ok = y_true == 1
    caught = float(np.sum(y_pred[fail] == 0) / max(fail.sum(), 1))
    false_alarm = float(np.sum(y_pred[ok] == 0) / max(ok.sum(), 1))
    return caught, false_alarm


def recall_at_fpr(y_true, score, target_fpr):
    """
    How many failures the model catches while raising no more false alarms
    than the heuristic does.

    Comparing at a matched false-alarm rate is the only fair way to do this.
    Any classifier can catch more failures by simply crying wolf more often,
    and a scannability warning that fires on good designs is worse than
    useless — users learn to ignore it.

    `score` is P(decodes), so a design is flagged when its score falls below
    the threshold. Sweeping every threshold at once with cumulative sums keeps
    this linear rather than quadratic in the test set.
    """
    fail = y_true == 0
    n_fail = max(int(fail.sum()), 1)
    n_ok = max(int((y_true == 1).sum()), 1)

    order = np.argsort(score, kind="stable")
    sorted_y = y_true[order]
    sorted_s = score[order]

    caught = np.cumsum(sorted_y == 0) / n_fail
    false_alarm = np.cumsum(sorted_y == 1) / n_ok

    allowed = false_alarm <= target_fpr + 1e-9
    if not allowed.any():
        return 0.0, None
    i = int(np.argmax(np.where(allowed, caught, -1.0)))
    return float(caught[i]), float(sorted_s[i])


def report(title, caught, false_alarm, auc=None):
    line = f"  {title:<32}{caught * 100:9.1f}%{false_alarm * 100:13.1f}%"
    print(line + (f"{auc:10.3f}" if auc is not None else f"{'—':>10}"))


def main():
    data = dataset_path()
    rows = load(data)

    # The column order is a contract, so it is read from the sidecar the
    # generator wrote rather than assumed.
    sidecar = Path(f"{data}.features.json")
    names_path = sidecar if sidecar.exists() else OUT / "feature_names.json"
    if not names_path.exists():
        sys.exit("Feature names unavailable; re-run generate.mjs.")
    names = json.loads(names_path.read_text())

    X, y, rung, ratio = build(rows, names)
    print(f"\n{len(rows)} designs, {X.shape[1]} features")
    print(f"{int((y == 0).sum())} never decoded ({(y == 0).mean() * 100:.1f}%)\n")

    X_tr, X_te, y_tr, y_te, ratio_tr, ratio_te = train_test_split(
        X, y, ratio, test_size=0.25, random_state=SEED, stratify=y
    )

    # ---- the incumbent -----------------------------------------------------
    heur_pred = (ratio_te >= CONTRAST_FAIL_BELOW).astype(int)
    heur_caught, heur_fpr = rates(y_te, heur_pred)

    print("Held-out test set\n")
    print(f"  {'':<32}{'failures':>10}{'false alarms':>14}{'AUC':>10}")
    print(f"  {'':<32}{'caught':>10}{'raised':>14}{'':>10}")
    print("  " + "-" * 66)
    report("shipped heuristic (ratio < 3)", heur_caught, heur_fpr)

    scaler = StandardScaler().fit(X_tr)
    Xs_tr, Xs_te = scaler.transform(X_tr), scaler.transform(X_te)

    models = {
        "logistic regression": (LogisticRegression(max_iter=2000, C=1.0, random_state=SEED), True),
        "gradient boosting": (
            HistGradientBoostingClassifier(max_iter=300, learning_rate=0.08, random_state=SEED),
            False,
        ),
        "MLP (24, 12)": (
            MLPClassifier(
                hidden_layer_sizes=(24, 12),
                max_iter=3000,
                alpha=1e-3,
                random_state=SEED,
            ),
            True,
        ),
    }

    results = {}
    for label, (model, scaled) in models.items():
        model.fit(Xs_tr if scaled else X_tr, y_tr)
        score = model.predict_proba(Xs_te if scaled else X_te)[:, 1]
        auc = roc_auc_score(y_te, score)
        caught, threshold = recall_at_fpr(y_te, score, heur_fpr)
        results[label] = {
            "auc": float(auc),
            "caught_at_matched_fpr": caught,
            "threshold": threshold,
            "model": model,
            "scaled": scaled,
        }
        report(label, caught, heur_fpr, auc)

    # ---- did it learn anything beyond contrast? ----------------------------
    idx = [i for i, n in enumerate(names) if n in CONTRAST_ONLY]
    scaler_c = StandardScaler().fit(X_tr[:, idx])
    ablate = MLPClassifier(
        hidden_layer_sizes=(24, 12), max_iter=3000, alpha=1e-3, random_state=SEED
    ).fit(scaler_c.transform(X_tr[:, idx]), y_tr)
    ab_score = ablate.predict_proba(scaler_c.transform(X_te[:, idx]))[:, 1]
    ab_auc = roc_auc_score(y_te, ab_score)
    ab_caught, _ = recall_at_fpr(y_te, ab_score, heur_fpr)

    print("  " + "-" * 66)
    report("MLP, contrast features only", ab_caught, heur_fpr, ab_auc)

    best_label = max(results, key=lambda k: results[k]["auc"])
    best = results[best_label]

    print(f"\n  Best: {best_label}")
    print(
        f"  Beyond contrast: AUC {ab_auc:.3f} -> {best['auc']:.3f} "
        f"(+{(best['auc'] - ab_auc) * 100:.1f} pts from the design features)"
    )
    print(
        f"  Versus the shipped rule: {heur_caught * 100:.1f}% -> "
        f"{best['caught_at_matched_fpr'] * 100:.1f}% of failures caught, "
        f"at the same {heur_fpr * 100:.1f}% false-alarm rate"
    )

    # ---- is the headline number stable, or one lucky split? ---------------
    from sklearn.inspection import permutation_importance
    from sklearn.model_selection import StratifiedKFold, cross_val_score
    from sklearn.pipeline import make_pipeline

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED)
    for label in ("gradient boosting", "MLP (24, 12)"):
        model, scaled = models[label]
        pipe = make_pipeline(StandardScaler(), model) if scaled else model
        scores = cross_val_score(pipe, X, y, cv=cv, scoring="roc_auc")
        print(f"  5-fold AUC, {label:<20} {scores.mean():.3f} +/- {scores.std():.3f}")

    # ---- would the badge's percentage mean anything? -----------------------
    # An AUC only says the ranking is good. If the app is going to show a
    # number, that number has to match reality: of the designs it calls 70%
    # likely, roughly 70% should decode.
    mlp = results["MLP (24, 12)"]["model"]
    proba = mlp.predict_proba(Xs_te)[:, 1]
    brier = float(np.mean((proba - y_te) ** 2))
    print(f"\n  Calibration (Brier score, lower is better): {brier:.3f}")
    print(f"  {'predicted':>12}{'actual':>10}{'n':>8}")
    for lo in np.arange(0.0, 1.0, 0.2):
        band = (proba >= lo) & (proba < lo + 0.2)
        if band.sum() >= 10:
            print(
                f"  {f'{lo:.0%}-{lo + 0.2:.0%}':>12}"
                f"{y_te[band].mean():>10.0%}{int(band.sum()):>8}"
            )

    # ---- what did it actually learn? --------------------------------------
    imp = permutation_importance(
        mlp, Xs_te, y_te, n_repeats=10, random_state=SEED, scoring="roc_auc"
    )
    order = np.argsort(imp.importances_mean)[::-1][:10]
    print("\n  What the model leans on (permutation importance, AUC drop)")
    for i in order:
        print(f"    {names[i]:<26}{imp.importances_mean[i]:.4f}")

    # ---- the size the accuracy costs --------------------------------------
    import pickle

    gbm_bytes = len(pickle.dumps(results["gradient boosting"]["model"]))
    print(
        f"\n  Gradient boosting is {gbm_bytes / 1024:.0f} KB pickled; the MLP is\n"
        f"  ~1,200 weights. See the export note below."
    )

    # ---- secondary: how far does it read? ---------------------------------
    decoded = rung >= 0
    if decoded.sum() > 100:
        from sklearn.ensemble import HistGradientBoostingRegressor

        Xd, rd = X[decoded], rung[decoded]
        Xd_tr, Xd_te, rd_tr, rd_te = train_test_split(
            Xd, rd, test_size=0.25, random_state=SEED
        )
        reg = HistGradientBoostingRegressor(max_iter=300, random_state=SEED).fit(Xd_tr, rd_tr)
        mae = float(np.mean(np.abs(reg.predict(Xd_te) - rd_te)))
        print(f"\n  Distance readout: mean error {mae:.2f} rungs on designs that decode")

    # ---- export ------------------------------------------------------------
    OUT.mkdir(parents=True, exist_ok=True)
    mlp = results["MLP (24, 12)"]["model"]
    # Six significant digits. The weights came out of a stochastic fit on
    # simulated data, so digits past that are noise being shipped to every
    # visitor as bytes.
    def trim(a):
        return np.round(np.asarray(a, dtype=np.float64), 6).tolist()

    weights = {
        "featureNames": names,
        "mean": trim(scaler.mean_),
        "scale": trim(scaler.scale_),
        "layers": [
            {"w": trim(c), "b": trim(b)}
            for c, b in zip(mlp.coefs_, mlp.intercepts_)
        ],
        "threshold": results["MLP (24, 12)"]["threshold"],
        "auc": results["MLP (24, 12)"]["auc"],
    }
    path = OUT / "model.json"
    path.write_text(json.dumps(weights))
    kb = path.stat().st_size / 1024
    print(f"\n  Exported MLP weights: {path.relative_to(ROOT)} ({kb:.1f} KB)")
    print(
        "  Shipping these directly rather than an ONNX runtime: a 3-layer net\n"
        "  does not justify multiple megabytes of WASM in a 764 KB app.\n"
    )

    (OUT / "metrics.json").write_text(
        json.dumps(
            {
                "n": len(rows),
                "heuristic": {"caught": heur_caught, "false_alarm": heur_fpr},
                "models": {
                    k: {"auc": v["auc"], "caught": v["caught_at_matched_fpr"]}
                    for k, v in results.items()
                },
                "ablation_contrast_only": {"auc": float(ab_auc), "caught": ab_caught},
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
