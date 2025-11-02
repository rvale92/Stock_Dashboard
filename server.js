// Express Proxy Server for Yahoo Finance API
// Fixes CSP issues by proxying requests through same origin

const express = require('express');
const cors = require('cors');
const path = require('path');
const yahooFinance = require('yahoo-finance2').default;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory cache for API responses
const cache = new Map(); // key -> { data, expiresAt }
const TTL_MS = 60_000; // serve cached data for 60 seconds

// Rolling window rate limiter (60 seconds, max 20 requests for Yahoo Finance)
const ROLLING_WINDOW_MS = 60_000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 20; // Yahoo Finance is more lenient
const requestTimestamps = []; // Timestamps of completed requests in rolling window

// FIFO queue for requests waiting to be processed
const requestQueue = [];
let isProcessingQueue = false;

// Clean up old timestamps outside the rolling window
function cleanupOldTimestamps() {
  const now = Date.now();
  const cutoff = now - ROLLING_WINDOW_MS;
  while (requestTimestamps.length > 0 && requestTimestamps[0] < cutoff) {
    requestTimestamps.shift();
  }
}

// Check if we can make a request now
function canMakeRequest() {
  cleanupOldTimestamps();
  return requestTimestamps.length < MAX_REQUESTS_PER_WINDOW;
}

// Get time until next request slot is available
function getTimeUntilNextSlot() {
  cleanupOldTimestamps();
  if (requestTimestamps.length < MAX_REQUESTS_PER_WINDOW) {
    return 0;
  }
  const oldest = requestTimestamps[0];
  const waitTime = oldest + ROLLING_WINDOW_MS - Date.now();
  return Math.max(0, waitTime);
}

// Record that a request was completed
function recordRequest() {
  requestTimestamps.push(Date.now());
  cleanupOldTimestamps();
}

// Process the queue
async function processQueue() {
  if (isProcessingQueue || requestQueue.length === 0) {
    return;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0) {
    // Check if we can make a request
    if (!canMakeRequest()) {
      const waitTime = getTimeUntilNextSlot();
      if (waitTime > 0) {
        console.log(`⚠️ Rate limit reached, delaying ${Math.ceil(waitTime / 1000)}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime + 100));
        continue;
      }
    }
    
    // Process next item in queue
    const { cacheKey, symbol, fetchFn, resolve, reject } = requestQueue.shift();
    
    try {
      const data = await fetchFn();
      
      // Cache fresh result
      cache.set(cacheKey, {
        data,
        expiresAt: Date.now() + TTL_MS
      });
      
      recordRequest();
      console.log(`✅ Completed request for ${symbol} (${requestTimestamps.length}/${MAX_REQUESTS_PER_WINDOW} in window)`);
      
      resolve(data);
    } catch (error) {
      // On error, try to serve stale cache
      const staleCache = cache.get(cacheKey);
      if (staleCache) {
        console.log(`📦 Serving stale cache due to error: ${symbol}`);
        resolve(staleCache.data);
      } else {
        reject(error);
      }
    }
  }
  
  isProcessingQueue = false;
}

// Fetch from Yahoo Finance with caching and queued rate limiting
async function fetchYahooQuote(cacheKey, symbol, fetchFn) {
  // Check fresh cache first
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`📦 Cache HIT for ${symbol}`);
    return cached.data;
  }

  // Check stale cache if available (prefer serving stale over queueing)
  if (cached) {
    console.log(`📦 Serving stale cache for ${symbol}`);
    return cached.data;
  }

  // If we can make a request immediately, do it
  if (canMakeRequest()) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`🌐 Fetching from Yahoo Finance: ${symbol}`);
        const data = await fetchFn();

        // Cache fresh result
        cache.set(cacheKey, {
          data,
          expiresAt: Date.now() + TTL_MS
        });
        
        recordRequest();
        console.log(`✅ Completed request for ${symbol} (${requestTimestamps.length}/${MAX_REQUESTS_PER_WINDOW} in window)`);
        
        resolve(data);
      } catch (error) {
        // On network error, try to serve stale cache
        const staleCache = cache.get(cacheKey);
        if (staleCache) {
          console.log(`📦 Serving stale cache due to network error: ${symbol}`);
          resolve(staleCache.data);
        } else {
          reject(error);
        }
      }
      
      // Process queue after this request
      setImmediate(() => processQueue());
    });
  }

  // Rate limit reached - queue the request
  console.log(`⚙️ Queued request for ${symbol}`);
  return new Promise((resolve, reject) => {
    requestQueue.push({ cacheKey, symbol, fetchFn, resolve, reject });
    // Trigger queue processing
    setImmediate(() => processQueue());
  });
}

// CORS Middleware - Apply before all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Additional middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Yahoo Finance quote endpoint
app.get('/api/yf/quote', async (req, res) => {
  try {
    const symbol = req.query.symbol?.toUpperCase().trim();
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Missing required parameter: symbol' 
      });
    }

    const cacheKey = `quote_${symbol}`;
    
    try {
      const data = await fetchYahooQuote(cacheKey, symbol, async () => {
        const quote = await yahooFinance.quote(symbol);
        
        // Debug: Log first 3 keys and important fields
        const keys = Object.keys(quote);
        console.log(`[DEBUG] Quote response keys (first 3): ${keys.slice(0, 3).join(', ')}`);
        console.log(`[DEBUG] Quote fields - price: ${quote.regularMarketPrice}, change: ${quote.regularMarketChange}, changePercent: ${quote.regularMarketChangePercent}`);
        
        if (!quote) {
          throw new Error(`Symbol not found: ${symbol}`);
        }
        
        if (quote.regularMarketPrice === null || quote.regularMarketPrice === undefined) {
          throw new Error(`Symbol not found: ${symbol}`);
        }
        
        // Normalize to match frontend format using actual Yahoo Finance fields
        return {
          symbol: quote.symbol || symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange !== null && quote.regularMarketChange !== undefined 
            ? quote.regularMarketChange 
            : (quote.regularMarketPrice - (quote.regularMarketPreviousClose || quote.regularMarketPrice)),
          changePercent: quote.regularMarketChangePercent !== null && quote.regularMarketChangePercent !== undefined
            ? quote.regularMarketChangePercent
            : (quote.regularMarketPreviousClose 
              ? ((quote.regularMarketPrice - quote.regularMarketPreviousClose) / quote.regularMarketPreviousClose) * 100
              : 0),
          high: quote.regularMarketDayHigh !== null && quote.regularMarketDayHigh !== undefined 
            ? quote.regularMarketDayHigh 
            : quote.regularMarketPrice,
          low: quote.regularMarketDayLow !== null && quote.regularMarketDayLow !== undefined 
            ? quote.regularMarketDayLow 
            : quote.regularMarketPrice,
          open: quote.regularMarketOpen !== null && quote.regularMarketOpen !== undefined 
            ? quote.regularMarketOpen 
            : quote.regularMarketPrice,
          previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
          volume: quote.regularMarketVolume || 0,
          currency: quote.currency || 'USD',
          time: quote.regularMarketTime || Date.now()
        };
      });
      
      // Ensure CORS headers are set before sending response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } catch (fetchError) {
      const errorMessage = fetchError.message || 'Unable to fetch stock data';
      console.error(`Error fetching quote for ${symbol}:`, errorMessage);
      
      // Return 404 for "not found" errors, 400 for other errors
      const isNotFound = errorMessage.toLowerCase().includes('not found') || 
                        errorMessage.toLowerCase().includes('invalid symbol');
      return res.status(isNotFound ? 404 : 400).json({ 
        error: errorMessage,
        cached: false
      });
    }
  } catch (error) {
    console.error('Error proxying quote request:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Yahoo Finance historical data endpoint
app.get('/api/yf/history', async (req, res) => {
  try {
    const symbol = req.query.symbol?.toUpperCase().trim();
    const range = req.query.range || '3mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    const interval = req.query.interval || '1d'; // 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Missing required parameter: symbol' 
      });
    }

    const cacheKey = `history_${symbol}_${range}_${interval}`;
    
    try {
      const data = await fetchYahooQuote(cacheKey, `${symbol} (${range}, ${interval})`, async () => {
        // Use chart() API - convert range to period1/period2 dates
        const now = new Date();
        const period2 = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const rangeDays = {
          '1d': 1,
          '5d': 5,
          '1mo': 30,
          '3mo': 90,
          '6mo': 180,
          '1y': 365,
          '2y': 730,
          '5y': 1825,
          '10y': 3650
        };
        
        const days = rangeDays[range] || 90;
        const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        const period1 = pastDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        const result = await yahooFinance.chart(symbol, {
          period1: period1,
          period2: period2,
          interval: interval,
        });
        
        // Debug: Log response structure
        console.log(`[DEBUG] Chart response keys: ${Object.keys(result || {}).join(', ')}`);
        if (result && result.quotes && result.quotes.length > 0) {
          const firstQuote = result.quotes[0];
          console.log(`[DEBUG] First quote keys: ${Object.keys(firstQuote || {}).slice(0, 5).join(', ')}`);
        }
        
        // Extract quotes from chart response
        // chart() returns { quotes: [...], meta: {...} }
        let history = [];
        if (result && result.quotes && Array.isArray(result.quotes) && result.quotes.length > 0) {
          history = result.quotes;
        } else if (Array.isArray(result) && result.length > 0) {
          // Fallback: if result is directly an array
          history = result;
        }
        
        if (!history || history.length === 0) {
          throw new Error(`Symbol not found: ${symbol}`);
        }
        
        // Helper function to sanitize numeric values
        const sanitizeNumber = (value, defaultValue = 0) => {
          if (value === null || value === undefined || isNaN(value)) {
            return defaultValue;
          }
          const num = typeof value === 'string' ? parseFloat(value) : Number(value);
          return isFinite(num) ? num : defaultValue;
        };
        
        // Helper function to sanitize date values
        const sanitizeDate = (dateValue) => {
          if (!dateValue) return null;
          try {
            const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
            if (isNaN(date.getTime())) return null;
            return date.toISOString();
          } catch (e) {
            return null;
          }
        };
        
        // Normalize and sanitize chart data - only return valid data points
        const sanitizedData = history
          .filter(item => {
            // Only keep items with valid date and at least one valid price field
            if (!item || !item.date) return false;
            const hasValidPrice = isFinite(sanitizeNumber(item.open)) ||
                                 isFinite(sanitizeNumber(item.high)) ||
                                 isFinite(sanitizeNumber(item.low)) ||
                                 isFinite(sanitizeNumber(item.close));
            return hasValidPrice;
          })
          .map(item => {
            // Sanitize all numeric fields
            const open = sanitizeNumber(item.open);
            const high = sanitizeNumber(item.high);
            const low = sanitizeNumber(item.low);
            const close = sanitizeNumber(item.close);
            const volume = sanitizeNumber(item.volume, 0);
            
            // Ensure all required fields are finite numbers
            return {
              date: sanitizeDate(item.date),
              open: isFinite(open) ? open : 0,
              high: isFinite(high) ? high : (isFinite(close) ? close : 0),
              low: isFinite(low) ? low : (isFinite(close) ? close : 0),
              close: isFinite(close) ? close : (isFinite(open) ? open : 0),
              volume: isFinite(volume) ? volume : 0
            };
          })
          .filter(item => item.date !== null) // Remove items with invalid dates
          .slice(-100) // Limit to last 100 data points
          .reverse(); // Reverse to show oldest first
        
        if (sanitizedData.length === 0) {
          throw new Error(`No valid historical data available for ${symbol}`);
        }
        
        return {
          symbol: symbol,
          interval: interval,
          range: range,
          data: sanitizedData
        };
      });
      
      // Ensure CORS headers are set before sending response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.json(data);
    } catch (fetchError) {
      const errorMessage = fetchError.message || 'Unable to fetch historical data';
      console.error(`Error fetching history for ${symbol}:`, errorMessage);
      
      // Return 404 for "not found" errors, 400 for other errors
      const isNotFound = errorMessage.toLowerCase().includes('not found') || 
                        errorMessage.toLowerCase().includes('invalid symbol');
      return res.status(isNotFound ? 404 : 400).json({ 
        error: errorMessage,
        cached: false
      });
    }
  } catch (error) {
    console.error('Error proxying history request:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Legacy endpoint compatibility - redirect to Yahoo Finance endpoints
app.get('/api/quote', async (req, res) => {
  // Forward to Yahoo Finance endpoint
  const symbol = req.query.symbol;
  if (!symbol) {
    return res.status(400).json({ error: 'Missing required parameter: symbol' });
  }
  
  // Reuse the yf/quote handler logic
  const cacheKey = `quote_${symbol}`;
  
  try {
    const data = await fetchYahooQuote(cacheKey, symbol, async () => {
      const quote = await yahooFinance.quote(symbol);
      
      // Debug: Log response structure
      const keys = Object.keys(quote || {});
      console.log(`[DEBUG] Legacy quote keys (first 3): ${keys.slice(0, 3).join(', ')}`);
      
      if (!quote) {
        throw new Error(`Symbol not found: ${symbol}`);
      }
      
      if (quote.regularMarketPrice === null || quote.regularMarketPrice === undefined) {
        throw new Error(`Symbol not found: ${symbol}`);
      }
      
      return {
        symbol: quote.symbol || symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange !== null && quote.regularMarketChange !== undefined
          ? quote.regularMarketChange
          : (quote.regularMarketPrice - (quote.regularMarketPreviousClose || quote.regularMarketPrice)),
        changePercent: quote.regularMarketChangePercent !== null && quote.regularMarketChangePercent !== undefined
          ? quote.regularMarketChangePercent
          : (quote.regularMarketPreviousClose 
            ? ((quote.regularMarketPrice - quote.regularMarketPreviousClose) / quote.regularMarketPreviousClose) * 100
            : 0),
        high: quote.regularMarketDayHigh !== null && quote.regularMarketDayHigh !== undefined
          ? quote.regularMarketDayHigh
          : quote.regularMarketPrice,
        low: quote.regularMarketDayLow !== null && quote.regularMarketDayLow !== undefined
          ? quote.regularMarketDayLow
          : quote.regularMarketPrice,
        open: quote.regularMarketOpen !== null && quote.regularMarketOpen !== undefined
          ? quote.regularMarketOpen
          : quote.regularMarketPrice,
        previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
        volume: quote.regularMarketVolume || 0,
        currency: quote.currency || 'USD',
        time: quote.regularMarketTime || Date.now()
      };
    });
    
    res.json(data);
  } catch (fetchError) {
    const errorMessage = fetchError.message || 'Unable to fetch stock data';
    const isNotFound = errorMessage.toLowerCase().includes('not found') || 
                      errorMessage.toLowerCase().includes('invalid symbol');
    return res.status(isNotFound ? 404 : 400).json({ error: errorMessage });
  }
});

app.get('/api/history', async (req, res) => {
  // Forward to Yahoo Finance endpoint
  const symbol = req.query.symbol?.toUpperCase().trim();
  const interval = req.query.interval || 'daily';
  
  if (!symbol) {
    return res.status(400).json({ error: 'Missing required parameter: symbol' });
  }
  
  // Map legacy interval to Yahoo Finance format
  const intervalMap = {
    daily: { range: '3mo', interval: '1d' },
    weekly: { range: '1y', interval: '1wk' },
    monthly: { range: '2y', interval: '1mo' }
  };
  
  const { range, interval: yfInterval } = intervalMap[interval] || intervalMap.daily;
  const cacheKey = `history_${symbol}_${range}_${yfInterval}`;
  
  try {
    const data = await fetchYahooQuote(cacheKey, `${symbol} (${range}, ${yfInterval})`, async () => {
      // Use chart() API - convert range to period1/period2 dates
      const now = new Date();
      const period2 = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const rangeDays = {
        '1d': 1,
        '5d': 5,
        '1mo': 30,
        '3mo': 90,
        '6mo': 180,
        '1y': 365,
        '2y': 730,
        '5y': 1825,
        '10y': 3650
      };
      
      const days = rangeDays[range] || 90;
      const pastDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      const period1 = pastDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const result = await yahooFinance.chart(symbol, {
        period1: period1,
        period2: period2,
        interval: yfInterval,
      });
      
      // Extract quotes from chart response
      let history = [];
      if (result && result.quotes && Array.isArray(result.quotes) && result.quotes.length > 0) {
        history = result.quotes;
      } else if (Array.isArray(result) && result.length > 0) {
        history = result;
      }
      
      if (!history || history.length === 0) {
        throw new Error(`Symbol not found: ${symbol}`);
      }
      
      // Helper function to sanitize numeric values
      const sanitizeNumber = (value, defaultValue = 0) => {
        if (value === null || value === undefined || isNaN(value)) {
          return defaultValue;
        }
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isFinite(num) ? num : defaultValue;
      };
      
      // Helper function to sanitize date values
      const sanitizeDate = (dateValue) => {
        if (!dateValue) return null;
        try {
          const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
          if (isNaN(date.getTime())) return null;
          return date.toISOString();
        } catch (e) {
          return null;
        }
      };
      
      // Normalize and sanitize chart data - only return valid data points
      const sanitizedData = history
        .filter(item => {
          // Only keep items with valid date and at least one valid price field
          if (!item || !item.date) return false;
          const hasValidPrice = isFinite(sanitizeNumber(item.open)) ||
                               isFinite(sanitizeNumber(item.high)) ||
                               isFinite(sanitizeNumber(item.low)) ||
                               isFinite(sanitizeNumber(item.close));
          return hasValidPrice;
        })
        .map(item => {
          // Sanitize all numeric fields
          const open = sanitizeNumber(item.open);
          const high = sanitizeNumber(item.high);
          const low = sanitizeNumber(item.low);
          const close = sanitizeNumber(item.close);
          const volume = sanitizeNumber(item.volume, 0);
          
          // Ensure all required fields are finite numbers
          return {
            date: sanitizeDate(item.date),
            open: isFinite(open) ? open : 0,
            high: isFinite(high) ? high : (isFinite(close) ? close : 0),
            low: isFinite(low) ? low : (isFinite(close) ? close : 0),
            close: isFinite(close) ? close : (isFinite(open) ? open : 0),
            volume: isFinite(volume) ? volume : 0
          };
        })
        .filter(item => item.date !== null) // Remove items with invalid dates
        .slice(-100) // Limit to last 100 data points
        .reverse(); // Reverse to show oldest first
      
      if (sanitizedData.length === 0) {
        throw new Error(`No valid historical data available for ${symbol}`);
      }
      
      return {
        symbol: symbol,
        interval: interval,
        range: range,
        data: sanitizedData
      };
    });
    
    res.json(data);
  } catch (fetchError) {
    const errorMessage = fetchError.message || 'Unable to fetch historical data';
    const isNotFound = errorMessage.toLowerCase().includes('not found') || 
                      errorMessage.toLowerCase().includes('invalid symbol');
    return res.status(isNotFound ? 404 : 400).json({ error: errorMessage });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Yahoo Finance Proxy server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Quote endpoint: http://localhost:${PORT}/api/yf/quote?symbol=AAPL`);
  console.log(`📈 History endpoint: http://localhost:${PORT}/api/yf/history?symbol=AAPL&range=3mo&interval=1d`);
  console.log(`📦 Using Yahoo Finance (no API key required)\n`);
});
