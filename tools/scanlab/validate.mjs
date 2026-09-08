/**
 * Stage 5: builds a real-device validation sheet.
 *
 * Everything the model knows came from a simulation. This produces the
 * apparatus for checking that against actual phones, which is the only thing
 * that can decide whether the model deserves to become the default.
 *
 * The selection is the important part. Testing forty random designs would
 * mostly re-measure cases the two methods already agree on, and agreement
 * proves nothing about which one to trust. So the sheet is built around
 * disagreements: designs the model condemns and the heuristic passes, and
 * designs the model passes and the heuristic condemns. Whichever way those
 * scan is the answer.
 *
 *   node tools/scanlab/validate.mjs --count 40
 *   # print data/validation/sheet.html, scan every code, fill in results.csv
 *   node tools/scanlab/score.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { openLab } from './runner.mjs';

const OUT = 'data/validation';

function parseArgs(argv) {
  const args = { count: 40, data: 'data/scans.jsonl' };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    if (key === 'count') args.count = Number(argv[i + 1]);
    else if (key === 'data') args.data = argv[i + 1];
  }
  return args;
}

/**
 * Picks the designs worth printing.
 *
 * Four groups, in priority order. The first two are the disagreements that
 * actually settle the question; the controls exist so the sheet still says
 * something about overall accuracy rather than only about the edge cases.
 */
function select(rows, count) {
  const groups = {
    'model-catches': [], // model says no, heuristic says yes
    'model-clears': [], // model says yes, heuristic says no
    'both-pass': [],
    'both-fail': [],
  };

  for (const row of rows) {
    const modelFails = row.prediction < 0.5;
    const heuristicFails = row.heuristicRisk === 'fail';
    if (modelFails && !heuristicFails) groups['model-catches'].push(row);
    else if (!modelFails && heuristicFails) groups['model-clears'].push(row);
    else if (!modelFails) groups['both-pass'].push(row);
    else groups['both-fail'].push(row);
  }

  const quota = {
    'model-catches': Math.round(count * 0.35),
    'model-clears': Math.round(count * 0.25),
    'both-pass': Math.round(count * 0.2),
    'both-fail': Math.round(count * 0.2),
  };

  const picked = [];
  for (const [name, pool] of Object.entries(groups)) {
    // Spread across the pool rather than taking the first N, which would
    // otherwise all come from the same region of the sampler's stream.
    const step = Math.max(1, Math.floor(pool.length / Math.max(quota[name], 1)));
    for (let i = 0; i < pool.length && picked.length < count; i += step) {
      if (picked.filter((p) => p.group === name).length >= quota[name]) break;
      picked.push({ ...pool[i], group: name });
    }
  }
  return picked;
}

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const rows = readFileSync(args.data, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));

  const lab = await openLab();
  try {
    const scored = await lab.page.evaluate(
      async (batch) => {
        const model = await TesseraLib.loadScanModel();
        return batch.map((r) => {
          const bg = r.style.transparentBackground ? '#ffffff' : r.style.background;
          const heuristic = TesseraLib.assessScannability(
            r.style.foreground,
            bg,
            r.style.useGradient ? r.style.gradientTo : undefined,
          );
          return {
            prediction: TesseraLib.predictScanProbability(model, r.features),
            heuristicRisk: heuristic.risk,
          };
        });
      },
      rows.map((r) => ({ style: r.style, features: r.features })),
    );

    const enriched = rows.map((r, i) => ({ ...r, ...scored[i] }));
    const picked = select(enriched, args.count);

    // Render each at a fixed physical size. Print size is the whole point: a
    // code that decodes on a 27-inch monitor proves nothing about a flyer.
    const images = await lab.page.evaluate(
      async (designs) => {
        const out = [];
        for (const d of designs) {
          const qr = new QRCodeStyling(TesseraLib.toQrOptions(d.payload, d.style, 600));
          const blob = await qr.getRawData('png');
          out.push(
            await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            }),
          );
        }
        return out;
      },
      picked.map((p) => ({ payload: p.payload, style: p.style })),
    );

    mkdirSync(OUT, { recursive: true });

    const manifest = picked.map((p, i) => ({
      id: `T${String(i + 1).padStart(2, '0')}`,
      group: p.group,
      prediction: p.prediction,
      heuristicRisk: p.heuristicRisk,
      simulatedRung: p.labels.distanceRung,
      kind: p.kind,
      payload: p.payload,
      style: p.style,
    }));
    writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 2));

    const cards = manifest
      .map(
        (m, i) => `
      <figure>
        <img src="${images[i]}" alt="">
        <figcaption>${m.id}</figcaption>
      </figure>`,
      )
      .join('');

    // No predictions on the sheet. Knowing what the model expected while
    // holding the phone is how you talk yourself into a decode that did not
    // happen, so the sheet carries nothing but the codes and their ids.
    writeFileSync(
      `${OUT}/sheet.html`,
      `<!doctype html><meta charset="utf-8"><title>Tessera validation sheet</title>
<style>
  body { font: 12px system-ui, sans-serif; margin: 12mm; color: #111; }
  h1 { font-size: 14px; }
  p { max-width: 150mm; color: #444; }
  .grid { display: flex; flex-wrap: wrap; gap: 8mm; margin-top: 8mm; }
  figure { margin: 0; text-align: center; }
  img { width: 30mm; height: 30mm; display: block; }
  figcaption { margin-top: 1.5mm; font: 10px ui-monospace, monospace; }
  @media print { body { margin: 8mm; } }
</style>
<h1>Tessera scan validation — ${manifest.length} codes</h1>
<p>Print at 100% (no fit-to-page). Each code is 30&nbsp;mm. Scan every code with
each phone from about 20&nbsp;cm in normal indoor light, and record whether it
decoded in <code>results.csv</code>. Do not look up what was predicted first.</p>
<div class="grid">${cards}</div>`,
    );

    writeFileSync(
      `${OUT}/results.csv`,
      'id,phone,decoded\n' + manifest.map((m) => `${m.id},,`).join('\n') + '\n',
    );

    const counts = {};
    for (const m of manifest) counts[m.group] = (counts[m.group] ?? 0) + 1;

    console.log(`\nWrote ${manifest.length} codes to ${OUT}/\n`);
    for (const [group, n] of Object.entries(counts)) {
      console.log(`  ${group.padEnd(16)}${n}`);
    }
    console.log(`
  1. Open ${OUT}/sheet.html and print it at 100%.
  2. Scan every code with 2-3 phones, ~20 cm, normal indoor light.
  3. Record each attempt in ${OUT}/results.csv as id,phone,decoded (1 or 0).
  4. Run: node tools/scanlab/score.mjs
`);
  } finally {
    await lab.close();
  }
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
