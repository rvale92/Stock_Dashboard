# API Configuration Guide

## Overview

This dashboard uses **public/demo API keys** hardcoded for GitHub Pages deployment. All API calls use **sandbox endpoints** to ensure compatibility with demo keys.

## API Providers

### 1. Finnhub (Primary)
- **Sandbox Key**: `sandbox_c0ja2ad3ad1r2jrtm9q0`
- **Sandbox Endpoint**: `https://sandbox.finnhub.io/api/v1`
- **WebSocket Endpoint**: `wss://sandbox.finnhub.io`
- **Used For**:
  - Stock quotes (fallback)
  - Company news
  - Real-time WebSocket updates

**Note**: Sandbox data may be simulated/delayed. For production, use paid API keys with production endpoints.

### 2. Alpha Vantage (Primary for Quotes)
- **Demo Key**: `demo`
- **Endpoint**: `https://www.alphavantage.co/query`
- **Used For**:
  - Stock quotes (primary)
  - Historical data
  - Company profiles/overviews

**Warning**: Demo key is **extremely rate-limited** (5 API calls per minute, 500 per day). App uses caching to minimize calls.

### 3. Yahoo Finance (Fallback)
- **Endpoint**: `https://query1.finance.yahoo.com/v8/finance/chart`
- **No API key required**
- **Used For**: Alternative data source if primary APIs fail

## Rate Limits & Limitations

### Sandbox Environment
- **Data**: May be simulated, delayed, or limited
- **Rate Limits**: Stricter than production
- **WebSocket**: May have connection limits
- **Best For**: Development, testing, and demo deployments

### Production Recommendations
1. **Obtain API keys** from:
   - [Finnhub](https://finnhub.io/) - Free tier: 60 calls/minute
   - [Alpha Vantage](https://www.alphavantage.co/) - Free tier: 5 calls/minute, 500/day

2. **Update Configuration**:
   - Replace hardcoded keys with environment variables
   - Use production endpoints:
     - Finnhub: `https://finnhub.io/api/v1`
     - WebSocket: `wss://ws.finnhub.io`

3. **Environment Variables** (for production):
   ```bash
   REACT_APP_FINNHUB_API_KEY=your_finnhub_key
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   ```

## Caching Strategy

To reduce API calls and respect rate limits:
- **Quotes**: Cached for 1 minute
- **Historical Data**: Cached for 5 minutes
- **Company Profiles**: Cached for 1 hour
- **News**: Cached for 10 minutes

Cache is stored in browser `localStorage`.

## Error Handling

The app implements fallback logic:
1. Try Alpha Vantage for quotes
2. Fallback to Finnhub if Alpha Vantage fails
3. Fallback to Yahoo Finance if both fail
4. Show user-friendly error messages
5. Use polling if WebSocket unavailable

## WebSocket Connection

- **Sandbox**: Uses `wss://sandbox.finnhub.io`
- **Fallback**: Polling every 60 seconds if WebSocket unavailable
- **Reconnection**: Automatic on connection loss

## Troubleshooting

### 401 Unauthorized Errors
- **Cause**: Invalid or expired API key
- **Solution**: Verify sandbox key is correct (`sandbox_c0ja2ad3ad1r2jrtm9q0`)
- **Check**: Ensure using sandbox endpoints, not production

### Rate Limit Errors
- **Cause**: Too many API calls
- **Solution**: 
  - Wait a few minutes
  - Clear cache: `localStorage.clear()` in browser console
  - Use caching to reduce calls

### No Data Returned
- **Cause**: Symbol not available in sandbox
- **Solution**: Try common symbols (AAPL, MSFT, GOOGL)
- **Note**: Sandbox may have limited symbol coverage

### WebSocket Not Connecting
- **Cause**: Sandbox WebSocket may be limited
- **Solution**: App automatically falls back to polling
- **Indicator**: Shows "🔄 Polling" instead of "⚡ Live"

## Security Notes

⚠️ **Important**: API keys are **hardcoded** in source files for public GitHub Pages deployment. This is acceptable for:
- ✅ Sandbox/demo keys
- ✅ Public demo applications
- ❌ **NOT recommended** for production with paid API keys

For production, use environment variables and never commit keys to git.

## Verification

To verify API configuration:
1. Open browser console
2. Add stock to watchlist (e.g., AAPL)
3. Check for:
   - ✅ No 401 errors
   - ✅ Stock data loads
   - ✅ Console shows successful API calls

## Files Modified

- `src/utils/api.js` - API endpoints and keys
- `src/utils/websocket.js` - WebSocket endpoint
- `src/hooks/useWebSocket.js` - WebSocket hook configuration

