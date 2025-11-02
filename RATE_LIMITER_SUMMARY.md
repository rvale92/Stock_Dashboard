# Strict Rate Limiter Implementation - Summary

## ✅ Implementation Complete

A strict rolling window rate limiter with FIFO queue has been implemented in `server.js`.

---

## 📋 Key Features

1. **Rolling Window Rate Limiter**: Tracks requests in the last 60 seconds
2. **FIFO Queue**: Queues requests when rate limit is reached
3. **Smart Caching**: Serves stale cache instead of queueing when available
4. **Automatic Queue Processing**: Processes queued requests as slots become available
5. **No External Dependencies**: Pure Node.js implementation

---

## 🔧 Final Modified server.js Sections

### Top Section (Lines 25-137): Rate Limiter & Queue

```javascript
// Rolling window rate limiter (60 seconds, max 5 requests)
const ROLLING_WINDOW_MS = 60_000; // 60 seconds
const MAX_REQUESTS_PER_WINDOW = 5; // Alpha Vantage free tier limit
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
  // Oldest request timestamp + window - now
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
        await new Promise(resolve => setTimeout(resolve, waitTime + 100)); // Small buffer
        continue;
      }
    }
    
    // Process next item in queue
    const { url, symbol, resolve, reject } = requestQueue.shift();
    
    try {
      console.log(`🌐 Fetching from Alpha Vantage: ${symbol || url}`);
      const response = await fetch(url);
      const data = await response.json();
      
      // Handle Alpha Vantage throttle/error messages
      if (data?.Note || data?.Information) {
        console.warn(`⚠️ Alpha Vantage message: ${data.Note || data.Information}`);
        
        // Try to serve cached data if available
        const cachedData = cache.get(url);
        if (cachedData) {
          console.log(`📦 Serving cached data due to rate limit message: ${symbol || url}`);
          resolve(cachedData.data);
          continue;
        }
        
        reject(new Error(data.Note || data.Information || 'Rate limit reached. Please wait and try again.'));
        continue;
      }
      
      // Cache fresh result
      cache.set(url, {
        data,
        expiresAt: Date.now() + TTL_MS
      });
      
      recordRequest();
      console.log(`✅ Completed request for ${symbol || url} (${requestTimestamps.length}/${MAX_REQUESTS_PER_WINDOW} in window)`);
      
      resolve(data);
    } catch (error) {
      // On network error, try to serve stale cache
      const staleCache = cache.get(url);
      if (staleCache) {
        console.log(`📦 Serving stale cache due to network error: ${symbol || url}`);
        resolve(staleCache.data);
      } else {
        reject(error);
      }
    }
  }
  
  isProcessingQueue = false;
}
```

### fetchAlpha Function (Lines 139-211): Queued Fetching

```javascript
// Fetch from Alpha Vantage with caching and queued rate limiting
async function fetchAlpha(url, symbol = '') {
  // Check fresh cache first
  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    console.log(`📦 Cache HIT for ${symbol || url}`);
    return cached.data;
  }

  // Check stale cache if available (prefer serving stale over queueing)
  if (cached) {
    console.log(`📦 Serving stale cache for ${symbol || url}`);
    return cached.data;
  }

  // If we can make a request immediately, do it
  if (canMakeRequest()) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log(`🌐 Fetching from Alpha Vantage: ${symbol || url}`);
        const response = await fetch(url);
        const data = await response.json();

        // Handle Alpha Vantage throttle/error messages
        if (data?.Note || data?.Information) {
          console.warn(`⚠️ Alpha Vantage message: ${data.Note || data.Information}`);
          
          // Try to serve cached data if available
          const cachedData = cache.get(url);
          if (cachedData) {
            console.log(`📦 Serving cached data due to rate limit message: ${symbol || url}`);
            resolve(cachedData.data);
            return;
          }
          
          reject(new Error(data.Note || data.Information || 'Rate limit reached. Please wait and try again.'));
          return;
        }

        // Cache fresh result
        cache.set(url, {
          data,
          expiresAt: Date.now() + TTL_MS
        });
        
        recordRequest();
        console.log(`✅ Completed request for ${symbol || url} (${requestTimestamps.length}/${MAX_REQUESTS_PER_WINDOW} in window)`);
        
        resolve(data);
      } catch (error) {
        // On network error, try to serve stale cache
        const staleCache = cache.get(url);
        if (staleCache) {
          console.log(`📦 Serving stale cache due to network error: ${symbol || url}`);
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
  console.log(`⚙️ Queued request for ${symbol || url}`);
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, symbol: symbol || url, resolve, reject });
    // Trigger queue processing
    setImmediate(() => processQueue());
  });
}
```

### Endpoint Handlers (Lines 228-269, 271-320): Using fetchAlpha

Both `/api/quote` and `/api/history` endpoints use the `fetchAlpha` function:

```javascript
// Proxy endpoint for stock quotes (GLOBAL_QUOTE)
app.get('/api/quote', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Missing required parameter: symbol' 
      });
    }

    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${ALPHA_VANTAGE_KEY}`;
    
    try {
      const data = await fetchAlpha(url, symbol);
      
      // Handle Alpha Vantage errors in response
      if (data['Error Message']) {
        return res.status(400).json({ 
          error: data['Error Message'] 
        });
      }

      res.json(data);
    } catch (fetchError) {
      const errorMessage = fetchError.message || 'Unable to fetch stock data';
      const isRateLimit = errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit');
      
      return res.status(isRateLimit ? 429 : 500).json({ 
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

// Proxy endpoint for historical data (TIME_SERIES)
app.get('/api/history', async (req, res) => {
  try {
    const symbol = req.query.symbol;
    const interval = req.query.interval || 'daily';
    
    if (!symbol) {
      return res.status(400).json({ 
        error: 'Missing required parameter: symbol' 
      });
    }

    // Map interval to Alpha Vantage function
    const functionMap = {
      daily: 'TIME_SERIES_DAILY',
      weekly: 'TIME_SERIES_WEEKLY',
      monthly: 'TIME_SERIES_MONTHLY'
    };

    const functionName = functionMap[interval];
    if (!functionName) {
      return res.status(400).json({ 
        error: `Invalid interval: ${interval}. Must be 'daily', 'weekly', or 'monthly'` 
      });
    }

    const encodedSymbol = encodeURIComponent(symbol);
    const url = `${BASE_URL}?function=${functionName}&symbol=${encodedSymbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`;
    
    try {
      const data = await fetchAlpha(url, `${symbol} (${interval})`);
      
      // Handle Alpha Vantage errors in response
      if (data['Error Message']) {
        return res.status(400).json({ 
          error: data['Error Message'] 
        });
      }

      res.json(data);
    } catch (fetchError) {
      const errorMessage = fetchError.message || 'Unable to fetch historical data';
      const isRateLimit = errorMessage.toLowerCase().includes('rate') || errorMessage.toLowerCase().includes('limit');
      
      return res.status(isRateLimit ? 429 : 500).json({ 
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

---

## 📊 Expected Behavior

### Scenario 1: Within Rate Limit
- Request comes in → `canMakeRequest()` returns `true`
- Immediate fetch → `✅ Completed request for SYMBOL (X/5 in window)`
- Cache result for 60 seconds

### Scenario 2: Rate Limit Reached
- Request comes in → `canMakeRequest()` returns `false`
- Check stale cache → If available, serve it
- If no cache → `⚙️ Queued request for SYMBOL`
- Queue processor waits → `⚠️ Rate limit reached, delaying Xs...`
- When slot available → Process from queue

### Scenario 3: Cache Hit
- Request comes in → Check cache
- Fresh cache (within 60s) → `📦 Cache HIT for SYMBOL`
- Stale cache (expired) → `📦 Serving stale cache for SYMBOL`

---

## ✅ Logging Messages (All Implemented)

- ✅ `⚙️ Queued request for SYMBOL` - When request is queued
- ✅ `✅ Completed request for SYMBOL` - When request completes
- ✅ `📦 Cache HIT for SYMBOL` - When fresh cache is served
- ✅ `⚠️ Rate limit reached, delaying Xs...` - When queue processing waits

---

## 🧪 Testing

Run `npm run start:dev` and observe:

1. **First 5 requests**: Should see `✅ Completed request` messages
2. **Request #6+**: Should see `⚙️ Queued request` messages
3. **After 60s**: Should see requests processing from queue
4. **Cache hits**: Should see `📦 Cache HIT` for cached requests
5. **Proxy logs**: Should never exceed 5 `✅ Completed request` messages per minute

The UI should show progressive updates without rate-limit errors!

---

**Status**: ✅ Implementation Complete

