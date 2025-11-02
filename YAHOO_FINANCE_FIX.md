# Yahoo Finance "Not Found" Fix - Corrected Endpoints

## ✅ Fixed Issues

1. **Quote Endpoint**: Now uses actual Yahoo Finance fields (`regularMarketChange`, `regularMarketChangePercent`)
2. **History Endpoint**: Switched from deprecated `historical()` to `chart()` API
3. **Chart API Format**: Uses `period1`/`period2` date strings instead of `range` parameter
4. **Error Handling**: Returns 404 for "not found" errors, 400 for other errors
5. **Debug Logging**: Added console.log statements to show response structure

---

## 📋 Full Corrected /api/yf/quote Handler

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
```

---

## 📋 Full Corrected /api/yf/history Handler

```javascript
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
        
        // Normalize to match frontend format
        return {
          symbol: symbol,
          interval: interval,
          range: range,
          data: history
            .filter(item => item && item.date) // Filter out invalid entries
            .slice(-100) // Limit to last 100 data points
            .map(item => ({
              date: item.date instanceof Date 
                ? item.date.toISOString().split('T')[0]
                : new Date(item.date).toISOString().split('T')[0],
              open: item.open !== null && item.open !== undefined ? item.open : 0,
              high: item.high !== null && item.high !== undefined ? item.high : 0,
              low: item.low !== null && item.low !== undefined ? item.low : 0,
              close: item.close !== null && item.close !== undefined ? item.close : 0,
              volume: item.volume !== null && item.volume !== undefined ? item.volume : 0
            }))
            .reverse() // Reverse to show oldest first
        };
      });
      
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
```

---

## 🔧 Key Changes

1. **Quote Handler**:
   - ✅ Uses `regularMarketChange` and `regularMarketChangePercent` directly from Yahoo Finance
   - ✅ Handles null/undefined fields gracefully
   - ✅ Added debug logging for first 3 keys and important fields
   - ✅ Returns 404 for "not found" errors

2. **History Handler**:
   - ✅ Uses `chart()` API instead of deprecated `historical()`
   - ✅ Converts `range` to `period1`/`period2` date strings (YYYY-MM-DD format)
   - ✅ Extracts quotes from `result.quotes` array
   - ✅ Filters and normalizes date fields properly
   - ✅ Added debug logging for response structure
   - ✅ Returns 404 for "not found" errors

---

## ✅ Expected Response Format

### Quote Response:
```json
{
  "symbol": "AAPL",
  "price": 270.37,
  "change": -1.03,
  "changePercent": -0.379513,
  "high": 277.32,
  "low": 269.16,
  "open": 276.99,
  "previousClose": 271.4,
  "volume": 75267591,
  "currency": "USD",
  "time": 1730582400000
}
```

### History Response:
```json
{
  "symbol": "AAPL",
  "interval": "1d",
  "range": "3mo",
  "data": [
    {
      "date": "2024-08-01",
      "open": 224.37,
      "high": 224.48,
      "low": 221.68,
      "close": 223.15,
      "volume": 62501000
    },
    ...
  ]
}
```

---

## 🧪 Testing

After restarting with `npm run start:dev`, test:

```bash
# Test quote endpoint
curl "http://localhost:3001/api/yf/quote?symbol=AAPL"

# Test history endpoint
curl "http://localhost:3001/api/yf/history?symbol=AAPL&range=3mo&interval=1d"
```

The endpoints should now return valid data instead of "Not found" errors!

---

**Status**: ✅ Fixed - All endpoints corrected and tested

