# API Reference

## Stock Data APIs

### Overview
This document outlines the APIs used for fetching stock data, news, and analytics.

### Potential API Providers

1. **Alpha Vantage**
   - Free tier available
   - Rate limits: 5 API calls per minute, 500 per day
   - Endpoints: Real-time quotes, historical data, technical indicators

2. **Yahoo Finance API (yfinance)**
   - Unofficial API
   - No authentication required
   - Real-time and historical data

3. **Finnhub**
   - Free tier: 60 API calls/minute
   - Real-time quotes, news, company profiles

4. **Polygon.io**
   - Free tier available
   - Real-time and historical data
   - WebSocket support for live data

### API Functions

See `src/utils/api.js` for implementation details:

- `fetchStockQuote(symbol)` - Get real-time stock quote
- `fetchHistoricalData(symbol, interval)` - Get historical price data
- `fetchStockNews(symbol)` - Get news for a stock
- `fetchMultipleQuotes(symbols)` - Batch fetch multiple stock quotes

### Implementation Notes

- All API functions return Promises
- Error handling should be implemented in components
- Consider implementing rate limiting and caching
- API keys should be stored in environment variables
