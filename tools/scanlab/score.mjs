/**
 * Stage 5: scores the real-device results against what was predicted.
 *
 * This is the script that decides whether the model becomes the default. It
 * compares both methods against what phones actually did, and it is written to
 * be able to return a negative answer — if the model loses here, it stays in
 * beta and that is the finding.
 *
 *   node tools/scanlab/score.mjs
 */
import { existsSync, readFileSync } from 'node:fs';

const DIR = 'data/validation';

function loadResults(path) {
  const lines = readFileSync(path, 'utf8').split('\n').slice(1);
  const byId = new Map();

  for (const line of lines) {
    const [id, phone, decoded] = line.split(',').map((v) => v?.trim());
    if (!id || decoded === undefined || decoded === '') continue;
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push({ phone: phone || 'unknown', decoded: decoded === '1' });
  }
  return byId;
}

function rates(cases, predictFails) {
  let caught = 0;
  let failures = 0;
  let falseAlarms = 0;
  let good = 0;

  for (const c of cases) {
    if (c.reallyFailed) {
      failures++;
      if (predictFails(c)) caught++;
    } else {
      good++;
      if (predictFails(c)) falseAlarms++;
    }
  }
  return {
    caught: failures ? (100 * caught) / failures : 0,
    falseAlarm: good ? (100 * falseAlarms) / good : 0,
    failures,
    good,
  };
}

const run = () => {
  if (!existsSync(`${DIR}/manifest.json`)) {
    console.error(`No ${DIR}/manifest.json. Run tools/scanlab/validate.mjs first.`);
    process.exitCode = 1;
    return;
  }

  const manifest = JSON.parse(readFileSync(`${DIR}/manifest.json`, 'utf8'));
  const results = loadResults(`${DIR}/results.csv`);

  const cases = [];
  for (const m of manifest) {
    const attempts = results.get(m.id);
    if (!attempts?.length) continue;
    const decodedOn = attempts.filter((a) => a.decoded).length;
    cases.push({
      ...m,
      attempts: attempts.length,
      decodedOn,
      // A code that fails on any tested phone is a code that fails. The
      // promise the app makes is that it will scan, not that it will scan on
      // the reviewer's handset.
      reallyFailed: decodedOn < attempts.length,
    });
  }

  if (!cases.length) {
    console.error(
      `\n${DIR}/results.csv has no filled-in rows yet.\n\n` +
        'Print sheet.html at 100%, scan each code with 2-3 phones, and record\n' +
        'one line per attempt as id,phone,decoded (1 or 0).\n',
    );
    process.exitCode = 1;
    return;
  }

  const phones = new Set(cases.flatMap((c) => results.get(c.id).map((a) => a.phone)));
  console.log(
    `\n${cases.length} of ${manifest.length} codes scored, ` +
      `${phones.size} phone(s): ${[...phones].join(', ')}\n`,
  );

  const model = rates(cases, (c) => c.prediction < 0.5);
  const heuristic = rates(cases, (c) => c.heuristicRisk === 'fail');

  const row = (label, r) =>
    `  ${label.padEnd(24)}${`${r.caught.toFixed(1)}%`.padStart(17)}${`${r.falseAlarm.toFixed(1)}%`.padStart(15)}`;

  console.log(
    `  ${''.padEnd(24)}${'failures caught'.padStart(17)}${'false alarms'.padStart(15)}`,
  );
  console.log('  ' + '-'.repeat(56));
  console.log(row('shipped heuristic', heuristic));
  console.log(row('model', model));
  console.log(
    `\n  ${model.failures} codes genuinely failed on at least one phone, ${model.good} scanned everywhere.`,
  );

  // Does the simulation describe reality? If designs the harness rated highly
  // fail in the hand, every number upstream of this is suspect.
  const decoded = cases.filter((c) => !c.reallyFailed);
  const failed = cases.filter((c) => c.reallyFailed);
  const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
  console.log(
    `\n  Simulated rung: ${mean(decoded.map((c) => c.simulatedRung)).toFixed(1)} for codes that scanned, ` +
      `${mean(failed.map((c) => c.simulatedRung)).toFixed(1)} for codes that did not.`,
  );

  console.log('\n  Where they disagreed');
  console.log('  ' + '-'.repeat(56));
  for (const group of ['model-catches', 'model-clears']) {
    const inGroup = cases.filter((c) => c.group === group);
    if (!inGroup.length) continue;
    const modelRight = inGroup.filter((c) =>
      group === 'model-catches' ? c.reallyFailed : !c.reallyFailed,
    ).length;
    const label =
      group === 'model-catches'
        ? 'model said fail, rule said ok'
        : 'model said ok, rule said fail';
    console.log(`  ${label.padEnd(34)}model right ${modelRight}/${inGroup.length}`);
  }

  const better =
    model.caught > heuristic.caught && model.falseAlarm <= heuristic.falseAlarm + 5;
  console.log(
    `\n  ${
      better
        ? 'The model beat the rule on real devices. It has earned the default.'
        : 'The model did not clearly beat the rule here. It stays in beta.'
    }\n`,
  );
};

run();
