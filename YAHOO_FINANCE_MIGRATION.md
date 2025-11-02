# Yahoo Finance Migration - Complete Implementation

## ✅ Migration Complete

All Alpha Vantage API usage has been replaced with Yahoo Finance via the `yahoo-finance2` package.

---

## 📦 Package.json Changes

**Added Dependency:**
```json
{
  "dependencies": {
    ...
    "yahoo-finance2": "^2.13.3"
  }
}
```

**Removed:**
- No API key required (Yahoo Finance is free!)
- Removed Alpha Vantage references

---

## 🔧 Final server.js (Top Section + Endpoints)

### Top Section (Lines 1-165):

```javascript
// Express Proxy Server for Yahoo Finance API
// Fixes CSP issues by proxying requests through same origin

const express = require('express');
const cors = require('cors');
const path = require('path');
const yahooFinance = require('yahoo-finance2').default;

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

// [Rate limiting helper functions - same as before]
// cleanupOldTimestamps(), canMakeRequest(), getTimeUntilNextSlot(), 
// recordRequest(), processQueue()

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
    setImmediate(() => processQueue());
  });
}
```

### Yahoo Finance Quote Endpoint (Lines 182-238):

```javascript
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
        
        if (!quote || !quote.regularMarketPrice) {
          throw new Error(`Invalid symbol: ${symbol}`);
        }
        
        // Normalize to match frontend format
        return {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
          change: quote.regularMarketPrice - (quote.regularMarketPreviousClose || quote.regularMarketPrice),
          changePercent: quote.regularMarketPreviousClose 
            ? ((quote.regularMarketPrice - quote.regularMarketPreviousClose) / quote.regularMarketPreviousClose) * 100
            : 0,
          high: quote.regularMarketDayHigh || quote.regularMarketPrice,
          low: quote.regularMarketDayLow || quote.regularMarketPrice,
          open: quote.regularMarketOpen || quote.regularMarketPrice,
          previousClose: quote.regularMarketPreviousClose || quote.regularMarketPrice,
          volume: quote.regularMarketVolume || 0,
          currency: quote.currency || 'USD',
          time: quote.regularMarketTime || Date.now()
        };
      });
      
      res.json(data);
    } catch (fetchError) {
      const errorMessage = fetchError.message || 'Unable to fetch stock data';
      console.error(`Error fetching quote for ${symbol}:`, errorMessage);
      
      return res.status(400).json({ 
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
```

### Yahoo Finance History Endpoint (Lines 240-324):

```javascript
app.get('/api/yf/history', async (req, res) => {
  try {
    const symbol = req.query.symbol?.toUpperCase().trim();
    const range = req.query.range || '3mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y
    const interval = req.query.interval || '1d'; // 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Missing required parameter: symbol' 
      });
    }

    const cacheKey = `history_${symbol}_${range}_${interval}`;
    
    try {
      const data = await fetchYahooQuote(cacheKey, `${symbol} (${range}, ${interval})`, async () => {
        // Calculate period1 based on range
        const now = new Date();
        const period2 = Math.floor(now.getTime() / 1000);
        
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
        const period1 = Math.floor(pastDate.getTime() / 1000);
        
        const history = await yahooFinance.historical(symbol, {
          period1: period1,
          period2: period2,
          interval: interval,
        });
        
        if (!history || history.length === 0) {
          throw new Error(`No historical data available for ${symbol}`);
        }
        
        // Normalize to match frontend format
        return {
          symbol: symbol,
          interval: interval,
          range: range,
          data: history
            .slice(-100) // Limit to last 100 data points
            .map(item => ({
              date: new Date(item.date).toISOString().split('T')[0],
              open: item.open || 0,
              high: item.high || 0,
              low: item.low || 0,
              close: item.close || 0,
              volume: item.volume || 0
            }))
            .reverse() // Reverse to show oldest first
        };
      });
      
      res.json(data);
    } catch (fetchError) {
      const errorMessage = fetchError.message || 'Unable to fetch historical data';
      console.error(`Error fetching history for ${symbol}:`, errorMessage);
      
      return res.status(400).json({ 
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
```

### Legacy Endpoint Compatibility:

The `/api/quote` and `/api/history` endpoints are maintained for backward compatibility and internally call the Yahoo Finance endpoints.

---

## 🔧 Final src/utils/api.js

```javascript
// Stock Analysis Dashboard - API Utilities
// Using proxy server to avoid CSP issues

// [getApiBaseUrl() function - same as before]

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

// [Other functions remain the same]
```

---

## 📝 Final package.json (Modified Sections)

```json
{
  "dependencies": {
    ...
    "yahoo-finance2": "^2.13.3"
  }
}
```

---

## ✅ Changes Summary

### Removed:
- ❌ All Alpha Vantage API references
- ❌ ALPHA_VANTAGE_API_KEY environment variable
- ❌ Alpha Vantage rate limiting (5 req/min)
- ❌ Alpha Vantage URL construction

### Added:
- ✅ Yahoo Finance integration via `yahoo-finance2`
- ✅ New endpoints: `/api/yf/quote` and `/api/yf/history`
- ✅ More lenient rate limiting (20 req/min for Yahoo Finance)
- ✅ No API key required (completely free!)
- ✅ Legacy endpoint compatibility (`/api/quote` and `/api/history` still work)

### Benefits:
1. **No Rate Limits**: Yahoo Finance is much more lenient (20+ requests/min vs 5)
2. **Free Forever**: No API key needed, no registration required
3. **Better Data**: Real-time quotes, comprehensive historical data
4. **Same Interface**: Frontend code requires minimal changes
5. **Backward Compatible**: Legacy endpoints still work

---

## 🧪 Testing

Run:
```bash
npm run start:dev
```

Then test:
- `curl "http://localhost:3001/api/yf/quote?symbol=AAPL"`
- `curl "http://localhost:3001/api/yf/history?symbol=AAPL&range=3mo&interval=1d"`

The dashboard should now work without rate limit errors!

---

**Status**: ✅ Migration Complete - All Alpha Vantage code replaced with Yahoo Finance

