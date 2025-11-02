// Safe series accessor utilities for chart data

/**
 * Get the last N items from a series, ensuring all required fields are finite numbers
 * @param {Array} series - Array of data points
 * @param {number} n - Number of items to return (default: 100)
 * @returns {Array} Filtered and sliced array
 */
export function getSeriesLastN(series, n = 100) {
  if (!Array.isArray(series)) return [];
  
  const clean = series.filter(p => {
    if (!p) return false;
    return Number.isFinite(p.open) && 
           Number.isFinite(p.high) && 
           Number.isFinite(p.low) && 
           Number.isFinite(p.close);
  });
  
  return clean.slice(-n); // DO NOT use series[-n] - use slice instead
}

/**
 * Safely get the last item from a series
 * @param {Array} series - Array of data points
 * @returns {Object|null} Last item or null
 */
export function getSeriesLast(series) {
  if (!Array.isArray(series) || series.length === 0) return null;
  return series[series.length - 1]; // Use positive index
}

/**
 * Safely get item at index (supports negative indices via slice)
 * @param {Array} series - Array of data points
 * @param {number} index - Index (negative for reverse access)
 * @returns {Object|null} Item or null
 */
export function getSeriesAt(series, index) {
  if (!Array.isArray(series) || series.length === 0) return null;
  
  // Convert negative index to positive
  const actualIndex = index < 0 ? series.length + index : index;
  
  if (actualIndex < 0 || actualIndex >= series.length) return null;
  return series[actualIndex];
}

/**
 * Validate and sanitize series data
 * @param {Array} series - Array of data points
 * @returns {Array} Sanitized array
 */
export function sanitizeSeries(series) {
  if (!Array.isArray(series)) return [];
  
  return series
    .map(p => {
      if (!p) return null;
      return {
        date: p.date,
        open: Number.isFinite(p.open) ? Number(p.open) : null,
        high: Number.isFinite(p.high) ? Number(p.high) : null,
        low: Number.isFinite(p.low) ? Number(p.low) : null,
        close: Number.isFinite(p.close) ? Number(p.close) : null,
        volume: Number.isFinite(p.volume) ? Number(p.volume) : 0
      };
    })
    .filter(p => p && p.date && p.close !== null);
}

