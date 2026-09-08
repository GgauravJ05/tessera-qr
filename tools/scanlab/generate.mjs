/**
 * Stage 2: builds the labelled dataset.
 *
 * Walks the design space with the sampler, puts every design through the
 * harness, and appends one JSON object per line. Resumable and seeded: killing
 * it and restarting continues the same sequence rather than redrawing a
 * different one, because a dataset assembled from two different random streams
 * is not the dataset its seed claims.
 *
 *   node tools/scanlab/generate.mjs --count 5000 --out data/scans.jsonl
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { openLab, runDesign, featureNames } from './runner.mjs';
import { mulberry32, sampleDesign } from './sampler.mjs';
import { DISTANCE_LADDER } from './ladder.mjs';

function parseArgs(argv) {
  const args = { count: 500, out: 'data/scans.jsonl', seed: 1 };
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    const value = argv[i + 1];
    if (key === 'count' || key === 'seed') args[key] = Number(value);
    else if (key === 'out') args.out = value;
  }
  return args;
}

/** Counts what is already on disk so a restart continues rather than repeats. */
function existingRows(path) {
  if (!existsSync(path)) return 0;
  const text = readFileSync(path, 'utf8');
  return text.split('\n').filter((line) => line.trim()).length;
}

function summarise(rows) {
  const rungs = rows.map((r) => r.labels.distanceRung);
  const failed = rungs.filter((r) => r < 0).length;
  const histogram = new Map();
  for (const r of rungs) histogram.set(r, (histogram.get(r) ?? 0) + 1);

  const inverted = rows.filter((r) => r.labels.invertPenalty > 0).length;
  const sorted = [...rungs].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  return { failed, histogram, inverted, median, total: rows.length };
}

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  const done = existingRows(args.out);

  if (done >= args.count) {
    console.log(`${args.out} already has ${done} rows; nothing to do.`);
    return;
  }
  mkdirSync(dirname(args.out), { recursive: true });

  const rng = mulberry32(args.seed);
  const binCounts = {};

  // Replay the draws already on disk so the stream continues where it stopped.
  // The sampler is deterministic, so this reproduces the same designs without
  // re-rendering any of them.
  for (let i = 0; i < done; i++) sampleDesign(rng, binCounts);
  if (done) console.log(`Resuming after ${done} existing rows.`);

  const lab = await openLab();
  const written = [];
  let skipped = 0;
  const startedAt = Date.now();

  // Deliberately sequential: one browser page, and the point is throughput
  // over an hour rather than latency on any single design.
  /* oxlint-disable no-await-in-loop */
  try {
    const names = await featureNames(lab.page);

    for (let i = done; i < args.count; i++) {
      const design = sampleDesign(rng, binCounts);
      let result;
      try {
        result = await runDesign(lab.page, {
          payload: design.payload,
          style: design.style,
          seed: args.seed * 1000003 + i,
        });
      } catch {
        // A payload that overflows the chosen correction level cannot be
        // encoded at all. That is a real part of the space, but it has no
        // symbol to measure, so it is counted and dropped rather than
        // recorded as a scannability failure.
        skipped++;
        continue;
      }

      const row = {
        i,
        seed: args.seed,
        kind: design.kind,
        payload: design.payload,
        style: design.style,
        geometry: result.geometry,
        features: result.features,
        labels: result.labels,
      };
      appendFileSync(args.out, `${JSON.stringify(row)}\n`);
      written.push(row);

      if (written.length % 25 === 0 || i === args.count - 1) {
        const elapsed = (Date.now() - startedAt) / 1000;
        const rate = written.length / elapsed;
        const remaining = Math.round((args.count - i - 1) / Math.max(rate, 0.001));
        process.stdout.write(
          `\r  ${i + 1}/${args.count}  ${rate.toFixed(1)}/s  ` +
            `${skipped} skipped  ~${Math.floor(remaining / 60)}m left   `,
        );
      }
    }
    /* oxlint-enable no-await-in-loop */

    console.log(`\n\nWrote ${written.length} rows to ${args.out}`);
    console.log(`Feature columns: ${names.length}`);

    if (written.length) {
      const s = summarise(written);
      console.log(`\nLabel distribution (distanceRung, 0-${DISTANCE_LADDER.length - 1})`);
      console.log('----------------------------------------------');
      const max = Math.max(...s.histogram.values());
      for (let rung = -1; rung < DISTANCE_LADDER.length; rung++) {
        const count = s.histogram.get(rung) ?? 0;
        if (!count) continue;
        const bar = '#'.repeat(Math.round((count / max) * 40));
        const label = rung < 0 ? 'never' : `d${rung}`;
        console.log(`  ${label.padEnd(6)}${String(count).padStart(5)}  ${bar}`);
      }
      console.log(
        `\n  median rung ${s.median}, ${s.failed} never decoded ` +
          `(${((s.failed / s.total) * 100).toFixed(1)}%), ` +
          `${s.inverted} penalised for inversion`,
      );
      console.log(`  ${skipped} designs skipped as unencodable\n`);
    }
  } finally {
    await lab.close();
  }
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
