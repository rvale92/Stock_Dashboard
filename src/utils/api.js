// Stock Analysis Dashboard - API Utilities
// Using Alpha Vantage API ONLY

const ALPHA_VANTAGE_KEY = 'LUFFBMJFOTCKM3AZ';
const BASE_URL = 'https://www.alphavantage.co/query';

// Simple cache to reduce API calls
const cache = {};
const CACHE_TTL = 60000; // 1 minute

function getCache(key) {
  const item = cache[key];
  if (item && Date.now() - item.time < CACHE_TTL) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  cache[key] = { data, time: Date.now() };
}

// Fetch stock quote
export async function fetchStockQuote(symbol) {
  const cacheKey = `quote_${symbol}`;
  const cached = getCache(cacheKey);
  if (cached) {
    console.log(`Using cached data for ${symbol}`);
    return cached;
  }

  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  console.log(`Fetching quote from Alpha Vantage: ${symbol}`);

  const response = await fetch(url);
  const data = await response.json();

  if (data['Error Message']) {
    throw new Error(`Invalid symbol: ${symbol}`);
  }

  if (data['Note']) {
    throw new Error('Rate limit reached. Please wait and try again.');
  }

  const quote = data['Global Quote'];
  if (!quote || Object.keys(quote).length === 0) {
    throw new Error(`No data available for ${symbol}`);
  }

  const result = {
    symbol: symbol,
    price: parseFloat(quote['05. price']) || 0,
    change: parseFloat(quote['09. change']) || 0,
    changePercent: parseFloat(quote['10. change percent']?.replace('%', '')) || 0,
    high: parseFloat(quote['03. high']) || 0,
    low: parseFloat(quote['04. low']) || 0,
    open: parseFloat(quote['02. open']) || 0,
    previousClose: parseFloat(quote['08. previous close']) || 0,
    volume: parseInt(quote['06. volume']) || 0
  };

  setCache(cacheKey, result);
  return result;
}

// Fetch historical data
export async function fetchHistoricalData(symbol, interval = 'daily') {
  const cacheKey = `history_${symbol}_${interval}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const functions = {
    daily: 'TIME_SERIES_DAILY',
    weekly: 'TIME_SERIES_WEEKLY',
    monthly: 'TIME_SERIES_MONTHLY'
  };

  const url = `${BASE_URL}?function=${functions[interval]}&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data['Error Message'] || data['Note']) {
    throw new Error('Unable to fetch historical data');
  }

  const timeSeriesKey = Object.keys(data).find(k => k.includes('Time Series'));
  if (!timeSeriesKey) {
    throw new Error('No historical data available');
  }

  const result = {
    symbol: symbol,
    interval: interval,
    data: Object.entries(data[timeSeriesKey])
      .slice(0, 100)
      .map(([date, values]) => ({
        date,
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'])
      }))
      .reverse()
  };

  setCache(cacheKey, result);
  return result;
}

// Fetch company profile (basic)
export async function fetchCompanyProfile(symbol) {
  return {
    symbol,
    name: symbol,
    exchange: 'US Market',
    currency: 'USD',
    country: 'USA'
  };
}

// Fetch news (placeholder)
export async function fetchNews(symbol) {
  return [{
    title: `${symbol} Market Information`,
    summary: 'Alpha Vantage demo mode does not include news feeds. Get your own free API key at https://www.alphavantage.co/support/#api-key for full features.',
    source: 'Demo Mode',
    date: new Date().toISOString(),
    url: 'https://www.alphavantage.co/support/#api-key'
  }];
}

// Fetch multiple quotes
export async function fetchMultipleQuotes(symbols) {
  const quotes = [];
  for (const symbol of symbols) {
    try {
      const quote = await fetchStockQuote(symbol);
      quotes.push(quote);
    } catch (error) {
      quotes.push({ symbol, error: error.message });
    }
  }
  return quotes;
}

// Fetch stock news (alias for compatibility)
export async function fetchStockNews(symbol, limit = 10) {
  const news = await fetchNews(symbol);
  return news.slice(0, limit);
}
