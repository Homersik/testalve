export function run(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('input must be an object');
  }
  const { address, lamports, tokens, transactions, solPrice } = input;
  if (typeof address !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    throw new Error('invalid Solana address');
  }
  if (typeof lamports !== 'number' || !Number.isFinite(lamports) || lamports < 0 || !Number.isInteger(lamports)) {
    throw new Error('lamports must be a non-negative integer');
  }
  const round = (x, d) => { const f = Math.pow(10, d); return Math.round((x + Number.EPSILON) * f) / f; };
  const solBalance = round(lamports / 1e9, 9);
  const tokenList = Array.isArray(tokens) ? tokens : [];
  let totalTokenValueUsd = 0;
  const holdings = tokenList.map((t, i) => {
    if (t === null || typeof t !== 'object') throw new Error('invalid token at index ' + i);
    const decimals = Number.isInteger(t.decimals) ? t.decimals : 0;
    const rawAmount = typeof t.amount === 'number' ? t.amount : Number(t.amount);
    if (!Number.isFinite(rawAmount) || rawAmount < 0) throw new Error('invalid token amount at index ' + i);
    const uiAmount = round(rawAmount / Math.pow(10, decimals), Math.min(decimals, 9));
    const price = typeof t.usdPrice === 'number' && Number.isFinite(t.usdPrice) ? t.usdPrice : 0;
    const valueUsd = round(uiAmount * price, 2);
    totalTokenValueUsd += valueUsd;
    return { mint: typeof t.mint === 'string' ? t.mint : null, symbol: typeof t.symbol === 'string' ? t.symbol : null, uiAmount, valueUsd };
  });
  totalTokenValueUsd = round(totalTokenValueUsd, 2);
  const price = typeof solPrice === 'number' && Number.isFinite(solPrice) && solPrice >= 0 ? solPrice : null;
  const solValueUsd = price === null ? null : round(solBalance * price, 2);
  const totalPortfolioUsd = price === null ? null : round((solValueUsd || 0) + totalTokenValueUsd, 2);
  const txList = Array.isArray(transactions) ? transactions : [];
  let firstTs = null, lastTs = null;
  const typeCounts = {};
  for (const tx of txList) {
    if (tx === null || typeof tx !== 'object') continue;
    const ts = typeof tx.timestamp === 'number' && Number.isFinite(tx.timestamp) ? tx.timestamp : null;
    if (ts !== null) {
      if (firstTs === null || ts < firstTs) firstTs = ts;
      if (lastTs === null || ts > lastTs) lastTs = ts;
    }
    const type = typeof tx.type === 'string' ? tx.type : 'unknown';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }
  const txCount = txList.length;
  let activityLevel;
  if (txCount === 0) activityLevel = 'inactive';
  else if (txCount >= 100) activityLevel = 'very_active';
  else if (txCount >= 20) activityLevel = 'active';
  else activityLevel = 'low';
  let walletTier;
  if (solBalance >= 10000) walletTier = 'whale';
  else if (solBalance >= 1000) walletTier = 'large';
  else if (solBalance >= 100) walletTier = 'medium';
  else if (solBalance > 0) walletTier = 'small';
  else walletTier = 'empty';
  return { address, solBalance, solValueUsd, tokenCount: holdings.length, holdings, totalTokenValueUsd, totalPortfolioUsd, activity: { transactionCount: txCount, firstActivity: firstTs, lastActivity: lastTs, typeBreakdown: typeCounts, activityLevel }, walletTier };
}
