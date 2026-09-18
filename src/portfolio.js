import fs from 'node:fs';

export function summarizePortfolio(report) {
  const ponds = Array.isArray(report?.ponds) ? report.ponds : [];
  const actionable = ponds.filter(pond => pond.status === 'actionable');
  const signals = ponds.filter(pond => pond.status === 'signal');
  const rejectedQuotes = ponds.filter(pond =>
    pond.live?.quotePositive === true
    && pond.live?.simulationRejected === true);
  const ranked = ponds
    .filter(pond => pond.live?.netUsd !== null && pond.live?.netUsd !== undefined
      && pond.live?.netUsd !== '' && Number.isFinite(Number(pond.live.netUsd)))
    .sort((a, b) => Number(b.live.netUsd) - Number(a.live.netUsd));
  return {
    generatedAt: report?.generatedAt ?? null,
    minimumNetUsd: report?.minimumNetUsd ?? null,
    transactionSubmissionEnabled: false,
    actionable: actionable.map(compactPond),
    signals: signals.map(compactPond),
    rejectedQuotes: rejectedQuotes.map(compactPond),
    bestObserved: ranked.slice(0, 10).map(compactPond),
    counts: {
      total: ponds.length,
      actionable: actionable.length,
      signals: signals.length,
      rejectedQuotes: rejectedQuotes.length,
      closed: ponds.filter(pond => pond.status === 'closed').length,
      unobserved: ponds.filter(pond => pond.status === 'unobserved').length,
      errors: ponds.filter(pond => pond.status === 'error').length,
    },
  };
}

export function compactPond(pond) {
  return {
    symbol: pond.symbol,
    route: pond.route,
    routeClass: pond.routeClass,
    status: pond.status,
    sizeUsd: pond.sizeUsd ?? null,
    netUsd: pond.live?.netUsd ?? null,
    quotedNetUsd: pond.live?.quotedNetUsd ?? null,
    eligible: Boolean(pond.live?.eligible),
    quotePositive: Boolean(pond.live?.quotePositive),
    simulated: Boolean(pond.live?.simulated),
    simulationRejected: Boolean(pond.live?.simulationRejected),
    bridge: pond.bridge ?? null,
    validation: pond.validation ?? null,
  };
}

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

export function findPond(report, symbol) {
  return (report?.ponds || []).find(pond => pond.symbol?.toLowerCase() === symbol.toLowerCase()) || null;
}
