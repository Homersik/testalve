export function run(input) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('input must be an object');
  }
  const round8 = (x) => Math.round(x * 1e8) / 1e8;
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

  let amount = input.amount;
  if (amount === undefined) amount = 1;
  if (!isNum(amount) || amount < 0) {
    throw new RangeError('amount must be a finite number >= 0');
  }

  let rate;
  let solPriceUsd = null;
  let ethPriceUsd = null;
  let usdValue = null;

  if (input.rate !== undefined) {
    if (!isNum(input.rate) || input.rate <= 0) {
      throw new RangeError('rate (ethPerSol) must be a positive finite number');
    }
    rate = input.rate;
    if (isNum(input.solPriceUsd) && input.solPriceUsd > 0) {
      solPriceUsd = input.solPriceUsd;
      usdValue = round8(amount * solPriceUsd);
    }
  } else {
    if (!isNum(input.solPriceUsd) || input.solPriceUsd <= 0) {
      throw new RangeError('solPriceUsd must be a positive finite number when rate is absent');
    }
    if (!isNum(input.ethPriceUsd) || input.ethPriceUsd <= 0) {
      throw new RangeError('ethPriceUsd must be a positive finite number when rate is absent');
    }
    solPriceUsd = input.solPriceUsd;
    ethPriceUsd = input.ethPriceUsd;
    rate = solPriceUsd / ethPriceUsd;
    usdValue = round8(amount * solPriceUsd);
  }

  return {
    amount: amount,
    solPriceUsd: solPriceUsd,
    ethPriceUsd: ethPriceUsd,
    rate: round8(rate),
    eth: round8(amount * rate),
    usdValue: usdValue
  };
}
