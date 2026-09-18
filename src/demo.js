import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, summarizePortfolio } from './portfolio.js';

const agentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(agentRoot, '../..');
const reportPath = process.env.POND_REPORT
  ? path.resolve(process.env.POND_REPORT)
  : path.join(repoRoot, 'reports/pond-portfolio-current.json');
const summary = summarizePortfolio(readJson(reportPath));

console.log('POND AGENT — READ-ONLY DECISION DEMO');
console.log(`Observation: ${summary.generatedAt}`);
console.log(`Gate: fully costed net >= $${summary.minimumNetUsd} and funded simulations pass`);
console.log(`Actionable: ${summary.counts.actionable}; signals: ${summary.counts.signals}; closed: ${summary.counts.closed}`);
console.log('');
for (const pond of [...summary.actionable, ...summary.signals, ...summary.bestObserved]
  .filter((pond, index, rows) => rows.findIndex(row => row.symbol === pond.symbol) === index)
  .slice(0, 8)) {
  const net = pond.netUsd === null ? 'unproven' : `$${Number(pond.netUsd).toFixed(4)}`;
  const raw = pond.quotedNetUsd === null ? '' : ` (raw quote $${Number(pond.quotedNetUsd).toFixed(4)})`;
  console.log(`${pond.symbol.padEnd(7)} ${pond.status.padEnd(10)} net ${net}${raw}`);
}
console.log('');
console.log('No signing or transaction submission capability is present.');
