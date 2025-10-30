# API Setup Guide

## Getting API Keys

### Alpha Vantage (Primary Provider)
1. Visit: https://www.alphavantage.co/support/#api-key
2. Sign up for a free account
3. Copy your API key
4. Free tier: 5 API calls per minute, 500 per day

### Finnhub (Secondary Provider)
1. Visit: https://finnhub.io/
2. Sign up for a free account
3. Copy your API key
4. Free tier: 60 API calls per minute

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```
   REACT_APP_ALPHA_VANTAGE_API_KEY=your_key_here
   REACT_APP_FINNHUB_API_KEY=your_key_here
   ```

3. Restart the development server:
   ```bash
   npm start
   ```

## WebSocket Setup (Optional but Recommended)

For real-time price updates, the app uses Finnhub WebSocket API:

1. **Requires Finnhub API Key**: WebSocket features only work with a valid Finnhub API key
2. **Automatic Fallback**: If WebSocket is unavailable, the app automatically falls back to polling
3. **Connection Status**: The watchlist shows "⚡ Live" when WebSocket is connected, "🔄 Polling" otherwise

## Usage Without API Keys

The app will work with demo keys but:
- Rate limits are very restrictive
- WebSocket features will not work (automatic fallback to polling)
- Some features may not work reliably
- Consider getting free API keys for better experience

## Troubleshooting

### "API limit reached" error
- You've exceeded the rate limit
- Wait a few minutes or upgrade your API plan
- The app uses fallback providers automatically

### "Invalid symbol" error
- Check that the stock symbol is correct
- Some symbols may not be available on all providers

### CORS errors
- If developing locally, ensure you're using `npm start`
- The API providers allow requests from localhost in development
