// Technical indicators calculation utilities

/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array} data - Array of price values
 * @param {number} period - Number of periods
 * @returns {Array} Array of SMA values
 */
export const calculateSMA = (data, period) => {
  if (!data || data.length < period) {
    return [];
  }

  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }

  return sma;
};

/**
 * Calculate Exponential Moving Average (EMA)
 * @param {Array} data - Array of price values
 * @param {number} period - Number of periods
 * @returns {Array} Array of EMA values
 */
export const calculateEMA = (data, period) => {
  if (!data || data.length < period) {
    return [];
  }

  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA
  const firstSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  ema.push(firstSMA);

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }

  return ema;
};

/**
 * Calculate Relative Strength Index (RSI)
 * @param {Array} data - Array of closing prices
 * @param {number} period - Number of periods (default: 14)
 * @returns {Array} Array of RSI values (0-100)
 */
export const calculateRSI = (data, period = 14) => {
  if (!data || data.length < period + 1) {
    return [];
  }

  const changes = [];
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i] - data[i - 1]);
  }

  const gains = changes.map(c => c > 0 ? c : 0);
  const losses = changes.map(c => c < 0 ? Math.abs(c) : 0);

  const rsi = [];
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  // Calculate RSI for remaining periods
  for (let i = period; i < changes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
};

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * @param {Array} data - Array of closing prices
 * @param {number} fastPeriod - Fast EMA period (default: 12)
 * @param {number} slowPeriod - Slow EMA period (default: 26)
 * @param {number} signalPeriod - Signal line period (default: 9)
 * @returns {Object} Object with MACD line, signal line, and histogram
 */
export const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  if (!data || data.length < slowPeriod + signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  if (fastEMA.length === 0 || slowEMA.length === 0) {
    return { macd: [], signal: [], histogram: [] };
  }

  // Calculate MACD line (fast EMA - slow EMA)
  const macdLine = [];
  const minLength = Math.min(fastEMA.length, slowEMA.length);
  
  // Align EMAs (slow EMA starts later, so we need to align them)
  const fastStart = fastEMA.length - minLength;
  const slowStart = slowEMA.length - minLength;

  for (let i = 0; i < minLength; i++) {
    macdLine.push(fastEMA[fastStart + i] - slowEMA[slowStart + i]);
  }

  // Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Calculate histogram (MACD - Signal)
  const histogram = [];
  const signalStart = macdLine.length - signalLine.length;
  
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push(macdLine[signalStart + i] - signalLine[i]);
  }

  return {
    macd: macdLine.slice(-signalLine.length),
    signal: signalLine,
    histogram: histogram
  };
};

/**
 * Calculate Bollinger Bands
 * @param {Array} data - Array of closing prices
 * @param {number} period - Number of periods (default: 20)
 * @param {number} stdDev - Standard deviation multiplier (default: 2)
 * @returns {Object} Object with upper, middle (SMA), and lower bands
 */
export const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  if (!data || data.length < period) {
    return { upper: [], middle: [], lower: [] };
  }

  const sma = calculateSMA(data, period);
  const middle = sma;
  const upper = [];
  const lower = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i - period + 1];
    
    // Calculate standard deviation
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    upper.push(mean + (stdDev * standardDeviation));
    lower.push(mean - (stdDev * standardDeviation));
  }

  return { upper, middle, lower };
};

/**
 * Format indicator data for charting
 * @param {Array} historicalData - Historical price data
 * @param {string} indicator - Indicator name ('sma', 'ema', 'rsi', 'macd', 'bollinger')
 * @param {Object} options - Indicator-specific options
 * @returns {Array} Formatted data for charting
 */
export const formatIndicatorData = (historicalData, indicator, options = {}) => {
  if (!historicalData || !historicalData.data || historicalData.data.length === 0) {
    return [];
  }

  const closes = historicalData.data.map(d => d.close);
  const dates = historicalData.data.map(d => d.date);

  let result = [];

  switch (indicator.toLowerCase()) {
    case 'sma':
      const smaValues = calculateSMA(closes, options.period || 20);
      result = dates.slice((options.period || 20) - 1).map((date, i) => ({
        date,
        value: smaValues[i],
        indicator: 'SMA'
      }));
      break;

    case 'ema':
      const emaValues = calculateEMA(closes, options.period || 20);
      result = dates.slice((options.period || 20) - 1).map((date, i) => ({
        date,
        value: emaValues[i],
        indicator: 'EMA'
      }));
      break;

    case 'rsi':
      const rsiValues = calculateRSI(closes, options.period || 14);
      result = dates.slice(options.period || 14).map((date, i) => ({
        date,
        value: rsiValues[i],
        indicator: 'RSI'
      }));
      break;

    case 'macd':
      const macdData = calculateMACD(
        closes,
        options.fastPeriod || 12,
        options.slowPeriod || 26,
        options.signalPeriod || 9
      );
      const macdStart = macdData.macd.length - macdData.signal.length;
      result = dates.slice(macdStart).map((date, i) => ({
        date,
        macd: macdData.macd[macdStart + i],
        signal: macdData.signal[i],
        histogram: macdData.histogram[i],
        indicator: 'MACD'
      }));
      break;

    case 'bollinger':
      const bbData = calculateBollingerBands(closes, options.period || 20, options.stdDev || 2);
      result = dates.slice((options.period || 20) - 1).map((date, i) => ({
        date,
        upper: bbData.upper[i],
        middle: bbData.middle[i],
        lower: bbData.lower[i],
        indicator: 'Bollinger Bands'
      }));
      break;

    default:
      console.warn(`Unknown indicator: ${indicator}`);
  }

  return result;
};

