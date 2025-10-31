# API Setup Instructions

## 🚀 Demo Mode (Current Setup)

The app works **immediately** with Alpha Vantage's demo API key - no registration required!

**Current Configuration:**
- **API Provider**: Alpha Vantage (primary)
- **API Key**: `demo` (public, shared across all users)
- **Rate Limit**: 25 requests per day (shared quota)
- **WebSocket**: Disabled (polling every 60 seconds instead)
- **News Feed**: Placeholder messages with upgrade instructions

**Demo Mode Limitations:**
- ⚠️ Shared rate limit (25 requests/day) - may hit limit if many users
- ⚠️ No real-time WebSocket updates (uses polling every 60 seconds)
- ⚠️ Limited news feed (shows upgrade instructions)
- ✅ Perfect for testing and demonstration
- ✅ All core features work (quotes, charts, historical data, portfolios, alerts)

## 📈 Upgrade to Your Own Free Key (Recommended)

### Option 1: Alpha Vantage (Recommended for Most Users)

**Benefits:**
- ✅ 25 requests/day personal quota (not shared)
- ✅ Instant activation (no email verification)
- ✅ Free forever
- ✅ Access to all free endpoints
- ✅ Historical data
- ✅ Technical indicators

**Setup Steps:**
1. Visit: https://www.alphavantage.co/support/#api-key
2. Enter your email address
3. Get instant free API key
4. Open `src/utils/api.js`
5. Replace `'demo'` with your key:
   ```javascript
   alphaVantage: {
     apiKey: 'YOUR_KEY_HERE', // Replace 'demo' with your key
     baseUrl: 'https://www.alphavantage.co/query',
     enabled: true
   }
   ```
6. Rebuild: `npm run build`
7. Deploy: `npm run deploy` (if using GitHub Pages)

**Note**: Free tier still has 25 requests/day limit, but it's your personal quota.

### Option 2: Add Finnhub for Real-Time WebSocket (Optional)

**Benefits:**
- ✅ 60 API calls per minute (much higher rate limit)
- ✅ Real-time WebSocket data (instant price updates)
- ✅ US stock market data
- ✅ Company news feeds
- ✅ Better for active trading/monitoring

**Setup Steps:**
1. Register: https://finnhub.io/register
2. Verify your email
3. Get free API key from dashboard
4. Open `src/utils/api.js`
5. Add your Finnhub key and enable it:
   ```javascript
   finnhub: {
     apiKey: 'YOUR_FINNHUB_KEY_HERE',
     baseUrl: 'https://finnhub.io/api/v1',
     enabled: true // Change to true
   }
   ```
6. Update `src/hooks/useWebSocket.js`:
   ```javascript
   const FINNHUB_API_KEY = 'YOUR_FINNHUB_KEY_HERE';
   ```
7. Rebuild and deploy

**Finnhub Free Tier:**
- 60 API calls per minute
- WebSocket real-time data
- Company news
- Market data

### Option 3: Use Both APIs (Best Experience)

Use Alpha Vantage for quotes/charts and Finnhub for news/WebSocket:
- Alpha Vantage: Quotes, historical data, company profiles
- Finnhub: Real-time WebSocket updates, news feeds

## 🔧 Configuration Files

### Primary Configuration: `src/utils/api.js`

```javascript
const API_CONFIG = {
  alphaVantage: {
    apiKey: 'demo', // Replace with your key
    baseUrl: 'https://www.alphavantage.co/query',
    enabled: true
  },
  finnhub: {
    apiKey: '', // Add your Finnhub key here
    baseUrl: 'https://finnhub.io/api/v1',
    enabled: false // Set to true when you add a key
  }
};
```

### WebSocket Configuration: `src/hooks/useWebSocket.js`

```javascript
// Set to your Finnhub API key for WebSocket support
const FINNHUB_API_KEY = null; // Replace with your key
```

## 📊 Rate Limits Comparison

| Provider | Free Tier Limit | WebSocket | News Feed |
|----------|----------------|-----------|-----------|
| Alpha Vantage (demo) | 25 requests/day (shared) | ❌ No | ❌ No |
| Alpha Vantage (personal) | 25 requests/day | ❌ No | ❌ No |
| Finnhub (free) | 60 calls/minute | ✅ Yes | ✅ Yes |

## 🐛 Troubleshooting

### "Rate limit reached" Error

**Cause**: Shared demo key has hit daily limit

**Solution**: 
1. Get your own free Alpha Vantage key (takes 30 seconds)
2. Replace `'demo'` with your key in `src/utils/api.js`
3. Rebuild and redeploy

### WebSocket Not Connecting

**Cause**: Demo mode doesn't support WebSocket

**Solution**:
1. Get free Finnhub API key
2. Add key to `src/utils/api.js` and `src/hooks/useWebSocket.js`
3. Enable Finnhub: `enabled: true`
4. Rebuild and redeploy

### No News Articles

**Cause**: Alpha Vantage demo doesn't include news

**Solution**:
1. Add Finnhub API key for news feeds
2. Or upgrade to Alpha Vantage premium tier

### "Failed to fetch" Errors

**Cause**: API limit reached or invalid symbol

**Solution**:
1. Check if you've hit rate limit (25/day for demo)
2. Wait until next day or get your own key
3. Verify stock symbol is correct (e.g., AAPL, MSFT)

## 📝 Development vs Production

### For Local Development:
- Demo key works fine for testing
- Can test all features except real-time WebSocket

### For Production/GitHub Pages:
- **Recommended**: Use your own free API keys
- Provides personal quota
- Better user experience
- No shared rate limit issues

## 🔒 Security Notes

⚠️ **Important**: 
- Demo keys can be exposed in source code (acceptable for public demos)
- Personal API keys should use environment variables in production:
  ```javascript
  apiKey: process.env.REACT_APP_ALPHA_VANTAGE_API_KEY || 'demo'
  ```
- Never commit production API keys to public repositories

## 📚 API Documentation Links

- **Alpha Vantage**: https://www.alphavantage.co/documentation/
- **Finnhub**: https://finnhub.io/docs/api
- **Get Alpha Vantage Key**: https://www.alphavantage.co/support/#api-key
- **Get Finnhub Key**: https://finnhub.io/register

## ✅ Quick Start Checklist

- [ ] App works with demo key (no action needed)
- [ ] Get free Alpha Vantage key (optional, recommended)
- [ ] Replace `'demo'` with your key in `src/utils/api.js`
- [ ] Rebuild: `npm run build`
- [ ] Deploy: `npm run deploy`
- [ ] (Optional) Get Finnhub key for WebSocket/news
- [ ] (Optional) Add Finnhub key and enable in config

---

**Ready to upgrade?** Get your free Alpha Vantage key in 30 seconds: https://www.alphavantage.co/support/#api-key

