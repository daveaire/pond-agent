import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePortfolio } from '../src/portfolio.js';

test('rejected positive quote is never ranked actionable', () => {
  const report = { generatedAt: '2026-09-18T00:00:00Z', minimumNetUsd: 1, ponds: [
    { symbol: 'RAW', status: 'closed', live: { netUsd: null, quotedNetUsd: 25, quotePositive: true, simulated: false, simulationRejected: true } },
    { symbol: 'PASS', status: 'actionable', live: { netUsd: 2, quotePositive: true, simulated: true, eligible: true } },
  ] };
  const summary = summarizePortfolio(report);
  assert.deepEqual(summary.actionable.map(row => row.symbol), ['PASS']);
  assert.equal(summary.bestObserved[0].symbol, 'PASS');
  assert.equal(summary.bestObserved.length, 1);
  assert.equal(summary.counts.closed, 1);
  assert.deepEqual(summary.rejectedQuotes.map(row => row.symbol), ['RAW']);
  assert.equal(summary.rejectedQuotes[0].quotedNetUsd, 25);
  assert.equal(summary.counts.rejectedQuotes, 1);
});
