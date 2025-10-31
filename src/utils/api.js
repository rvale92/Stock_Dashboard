// API utility functions for stock data
// Supports multiple API providers: Alpha Vantage, Finnhub, and Yahoo Finance

// API Configuration
// Using public/demo API keys hardcoded for GitHub Pages deployment
// For production use, replace with environment variables
const API_CONFIG = {
  alphaVantage: {
    // Alpha Vantage demo key (extremely rate-limited)
    apiKey: 'demo',
    baseUrl: 'https://www.alphavantage.co/query'
  },
  finnhub: {
    // Finnhub sandbox demo key for public deployment
    apiKey: 'sandbox_c0ja2ad3ad1r2jrtm9q0',
    // Using sandbox endpoint for public deployment
    baseUrl: 'https://sandbox.finnhub.io/api/v1'
  },
  yahooFinance: {
    baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart'
  }
};

// Default API provider (can be changed)
// const DEFAULT_PROVIDER = 'alphaVantage';

// Cache configuration
const CACHE_CONFIG = {
  quote: { ttl: 60 * 1000 }, // 1 minute for quotes
  historical: { ttl: 5 * 60 * 1000 }, // 5 minutes for historical data
  profile: { ttl: 60 * 60 * 1000 }, // 1 hour for company profiles
  news: { ttl: 10 * 60 * 1000 } // 10 minutes for news
};

/**
 * Get cached data if available and not expired
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {object|null} Cached data or null
 */
const getCachedData = (key, ttl) => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 */
const setCachedData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error setting cache:', error);
    // If storage is full, clear old cache entries
    if (error.name === 'QuotaExceededError') {
      clearOldCache();
    }
  }
};

/**
 * Clear old cache entries to free up space
 */
const clearOldCache = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached);
          // Remove entries older than 24 hours
          if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(key);
          }
        }
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

/**
 * Fetch real-time stock quote using Alpha Vantage
 * @param {string} symbol - Stock symbol
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise} Stock quote data
 */
export const fetchStockQuote = async (symbol, useCache = true) => {
  if (!symbol) {
    throw new Error('Stock symbol is required');
  }

  const cacheKey = `cache_quote_${symbol}`;
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData(cacheKey, CACHE_CONFIG.quote.ttl);
    if (cached) {
      return cached;
    }
  }

  try {
    const { apiKey, baseUrl } = API_CONFIG.alphaVantage;
    const url = `${baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API error messages
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note'] || 'API limit reached');
    }
    
    // Parse Alpha Vantage response
    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      // Fallback to alternative API if Alpha Vantage fails
      return await fetchStockQuoteFinnhub(symbol);
    }
    
    const result = {
      symbol: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent']?.replace('%', '')),
      volume: parseInt(quote['06. volume']),
      high: parseFloat(quote['03. high']),
      low: parseFloat(quote['04. low']),
      open: parseFloat(quote['02. open']),
      previousClose: parseFloat(quote['08. previous close']),
      timestamp: quote['07. latest trading day']
    };
    
    // Cache the result
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching stock quote (Alpha Vantage):', error);
    // Fallback to Finnhub
    try {
      return await fetchStockQuoteFinnhub(symbol);
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
      throw new Error(`Failed to fetch stock quote: ${error.message}`);
    }
  }
};

/**
 * Fetch real-time stock quote using Finnhub (fallback provider)
 * @param {string} symbol - Stock symbol
 * @returns {Promise} Stock quote data
 */
const fetchStockQuoteFinnhub = async (symbol) => {
  const { apiKey, baseUrl } = API_CONFIG.finnhub;
  const url = `${baseUrl}/quote?symbol=${symbol}&token=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Finnhub API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.c === 0) {
    throw new Error('Invalid symbol or no data available');
  }
  
  return {
    symbol: symbol,
    price: data.c, // current price
    change: data.d, // change
    changePercent: data.dp, // percent change
    high: data.h, // high price of the day
    low: data.l, // low price of the day
    open: data.o, // open price of the day
    previousClose: data.pc, // previous close price
    timestamp: new Date(data.t * 1000).toISOString()
  };
};

/**
 * Fetch historical stock data
 * @param {string} symbol - Stock symbol
 * @param {string} interval - Time interval (1min, 5min, daily, weekly, monthly)
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise} Historical stock data
 */
export const fetchHistoricalData = async (symbol, interval = 'daily', useCache = true) => {
  if (!symbol) {
    throw new Error('Stock symbol is required');
  }

  const cacheKey = `cache_historical_${symbol}_${interval}`;
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData(cacheKey, CACHE_CONFIG.historical.ttl);
    if (cached) {
      return cached;
    }
  }

  try {
    const { apiKey, baseUrl } = API_CONFIG.alphaVantage;
    
    // Map interval to Alpha Vantage function
    const functionMap = {
      'daily': 'TIME_SERIES_DAILY',
      'weekly': 'TIME_SERIES_WEEKLY',
      'monthly': 'TIME_SERIES_MONTHLY'
    };
    
    const functionName = functionMap[interval] || 'TIME_SERIES_DAILY';
    const url = `${baseUrl}?function=${functionName}&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note'] || 'API limit reached');
    }
    
    // Parse time series data
    const timeSeriesKey = Object.keys(data).find(key => key.includes('Time Series'));
    if (!timeSeriesKey) {
      throw new Error('No time series data found');
    }
    
    const timeSeries = data[timeSeriesKey];
    const dates = Object.keys(timeSeries).sort();
    
    const result = {
      symbol: symbol,
      interval: interval,
      data: dates.map(date => ({
        date: date,
        open: parseFloat(timeSeries[date]['1. open']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
        close: parseFloat(timeSeries[date]['4. close']),
        volume: parseInt(timeSeries[date]['5. volume'])
      }))
    };
    
    // Cache the result
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error(`Failed to fetch historical data: ${error.message}`);
  }
};

/**
 * Fetch stock news
 * @param {string} symbol - Stock symbol
 * @param {number} limit - Number of news articles to fetch
 * @returns {Promise} Stock news data
 */
export const fetchStockNews = async (symbol, limit = 10) => {
  if (!symbol) {
    throw new Error('Stock symbol is required');
  }

  try {
    const { apiKey, baseUrl } = API_CONFIG.finnhub;
    const url = `${baseUrl}/company-news?symbol=${symbol}&from=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}&token=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data.slice(0, limit).map(article => ({
      title: article.headline,
      summary: article.summary || '',
      source: article.source,
      date: new Date(article.datetime * 1000).toISOString(),
      url: article.url,
      image: article.image
    }));
  } catch (error) {
    console.error('Error fetching stock news:', error);
    // Return empty array instead of throwing to allow app to continue
    return [];
  }
};

/**
 * Fetch multiple stock quotes at once
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise} Array of stock quotes
 */
export const fetchMultipleQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) {
    return [];
  }

  try {
    // Fetch quotes sequentially to avoid rate limiting
    // In production, consider implementing rate limiting and caching
    const quotes = [];
    
    for (const symbol of symbols) {
      try {
        const quote = await fetchStockQuote(symbol);
        quotes.push(quote);
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to fetch quote for ${symbol}:`, error);
        quotes.push({ symbol, error: error.message });
      }
    }
    
    return quotes;
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
    throw error;
  }
};

/**
 * Fetch company overview/profile
 * @param {string} symbol - Stock symbol
 * @param {boolean} useCache - Whether to use cache (default: true)
 * @returns {Promise} Company profile data
 */
export const fetchCompanyProfile = async (symbol, useCache = true) => {
  const cacheKey = `cache_profile_${symbol}`;
  
  // Check cache first
  if (useCache) {
    const cached = getCachedData(cacheKey, CACHE_CONFIG.profile.ttl);
    if (cached) {
      return cached;
    }
  }

  try {
    const { apiKey, baseUrl } = API_CONFIG.alphaVantage;
    const url = `${baseUrl}?function=OVERVIEW&symbol=${symbol}&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data['Error Message'] || data['Note']) {
      throw new Error(data['Error Message'] || data['Note'] || 'API limit reached');
    }
    
    const result = {
      symbol: data.Symbol,
      name: data.Name,
      description: data.Description,
      marketCap: data.MarketCapitalization,
      peRatio: data.PERatio,
      dividendYield: data.DividendYield,
      beta: data.Beta,
      '52WeekHigh': data['52WeekHigh'],
      '52WeekLow': data['52WeekLow'],
      sector: data.Sector,
      industry: data.Industry
    };
    
    // Cache the result
    setCachedData(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    throw new Error(`Failed to fetch company profile: ${error.message}`);
  }
};
