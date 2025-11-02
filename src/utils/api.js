// Stock Analysis Dashboard - API Utilities
// Using proxy server to avoid CSP issues

// Determine API base URL based on environment
// In development: proxy runs on port 3001
// In production: proxy runs on same domain or Vercel/Render
const getApiBaseUrl = () => {
  // Check if we're on GitHub Pages (*.github.io)
  const isGitHubPages = window.location.hostname.includes('github.io');
  
  // Explicitly check for development mode
  const isDevelopment = process.env.NODE_ENV !== 'production' || 
                        window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    // Development: proxy runs on port 3001
    const devUrl = 'http://localhost:3001';
    console.log(`[API] Development mode - using proxy: ${devUrl}`);
    return devUrl;
  }
  
  // Production: force proxy URL from environment variable
  // GitHub Pages and production MUST use REACT_APP_PROXY_URL
  const proxyUrl = process.env.REACT_APP_PROXY_URL;
  
  if (!proxyUrl) {
    console.warn(`[API] WARNING: REACT_APP_PROXY_URL not set in production!`);
    console.warn(`[API] GitHub Pages (${window.location.hostname}) requires REACT_APP_PROXY_URL to be set.`);
    console.warn(`[API] Falling back to window.location.origin: ${window.location.origin}`);
    console.warn(`[API] This may cause CORS errors - ensure proxy is deployed and REACT_APP_PROXY_URL is configured.`);
    return window.location.origin;
  }
  
  console.log(`[API] Production mode (${isGitHubPages ? 'GitHub Pages' : 'production'}) - using proxy: ${proxyUrl}`);
  return proxyUrl;
};

const API_BASE_URL = getApiBaseUrl();
console.log(`[API] ⚙️ BASE_URL configured at runtime: ${API_BASE_URL}`);
console.log(`[API] Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[API] Hostname: ${window.location.hostname}`);
console.log(`[API] REACT_APP_PROXY_URL: ${process.env.REACT_APP_PROXY_URL || 'NOT SET'}`);

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

  const url = `${API_BASE_URL}/api/yf/quote?symbol=${encodeURIComponent(symbol)}`;
  console.log(`[API] Fetching quote via proxy: ${url}`);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });
  } catch (fetchError) {
    console.error(`[API] Fetch error for ${symbol}:`, fetchError);
    throw new Error(`Network error: Unable to reach proxy server. Make sure the proxy is running on ${API_BASE_URL}`);
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // Server already normalizes the data, so just return it
  if (!data || !data.price) {
    throw new Error(`No data available for ${symbol}`);
  }

  setCache(cacheKey, data);
  return data;
}

// Fetch historical data
export async function fetchHistoricalData(symbol, interval = 'daily') {
  const cacheKey = `history_${symbol}_${interval}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  // Map interval to Yahoo Finance format
  const intervalMap = {
    daily: { range: '3mo', interval: '1d' },
    weekly: { range: '1y', interval: '1wk' },
    monthly: { range: '2y', interval: '1mo' }
  };
  
  const { range, interval: yfInterval } = intervalMap[interval] || intervalMap.daily;
  const url = `${API_BASE_URL}/api/yf/history?symbol=${encodeURIComponent(symbol)}&range=${range}&interval=${yfInterval}`;
  console.log(`[API] Fetching history via proxy: ${url}`);

  let response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      mode: 'cors',
    });
  } catch (fetchError) {
    console.error(`[API] Fetch error for ${symbol} (${interval}):`, fetchError);
    throw new Error(`Network error: Unable to reach proxy server. Make sure the proxy is running on ${API_BASE_URL}`);
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data || !data.data || data.data.length === 0) {
    throw new Error('No historical data available');
  }

  // Server already normalizes the data format
  const result = {
    symbol: data.symbol,
    interval: interval,
    data: data.data
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
    summary: 'News feed integration coming soon with Yahoo Finance.',
    source: 'Yahoo Finance',
    date: new Date().toISOString(),
    url: 'https://finance.yahoo.com'
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
