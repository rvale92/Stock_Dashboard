# Stock Analysis Dashboard

A React-based stock analysis dashboard and watchlist application for tracking and analyzing stocks.

## Features

- **Watchlist**: Add and manage stocks to watch
- **Stock Charts**: Visualize stock price movements over time
- **Analytics Panel**: View key metrics and statistics
- **News Feed**: Stay updated with latest stock-related news

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- (Optional) API keys for Alpha Vantage and/or Finnhub for better performance

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/rvale92/Stock_Dashboard.git
   cd Stock_Dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure API keys:
   - Copy `.env.example` to `.env`
   - Add your API keys (see `API_SETUP.md` for details)
   - The app works with demo keys but has rate limits

4. Start the development server:
   ```bash
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app

## Deployment

### Live Version

The app is live on GitHub Pages at: **https://rvale92.github.io/Stock_Dashboard**

### Deploying to GitHub Pages

1. **Install gh-pages** (if not already installed):
   ```bash
   npm install --save-dev gh-pages
   ```

2. **The `package.json` is already configured with:**
   - `homepage` field pointing to GitHub Pages URL
   - `predeploy` script to build the app
   - `deploy` script to publish to gh-pages branch

3. **Deploy:**
   ```bash
   npm run deploy
   ```
   This will:
   - Build the production version
   - Create/update the `gh-pages` branch
   - Push to GitHub
   - Make the app live at the GitHub Pages URL

4. **After deployment:**
   - Wait a few minutes for GitHub Pages to update
   - Visit https://rvale92.github.io/Stock_Dashboard
   - Check the GitHub repository Settings → Pages to verify deployment

### Deployment Troubleshooting

**Issue**: App doesn't load or shows blank page
- **Solution**: Ensure `homepage` in `package.json` matches your GitHub Pages URL exactly
- Check browser console for errors
- Verify `gh-pages` branch exists in repository

**Issue**: Assets not loading (404 errors)
- **Solution**: Assets are served from root path, ensure `homepage` is set correctly
- Clear browser cache
- Check Network tab in browser dev tools

**Issue**: API calls failing after deployment
- **Solution**: API keys must be set as environment variables during build
- For GitHub Pages, consider using a backend service or GitHub Secrets for API keys
- See `API_SETUP.md` for detailed API configuration

**Issue**: Routing doesn't work (404 on refresh)
- **Solution**: This is expected for client-side routing on GitHub Pages
- Consider using HashRouter instead of BrowserRouter for GitHub Pages
- Or configure GitHub Pages to redirect all routes to index.html

### Environment Variables for Production

For GitHub Pages deployment, you'll need to handle API keys differently:

1. **Option 1: Build-time variables** (requires rebuilding on each deploy)
   - Set variables before running `npm run build`
   - Variables are embedded in the build

2. **Option 2: Runtime configuration** (recommended)
   - Use a config file that's loaded at runtime
   - Or use a backend proxy for API calls

3. **Option 3: Public API keys** (not recommended for production)
   - Only use free-tier APIs with public keys
   - Be aware of rate limits and security implications

## Project Structure

```
stock-analysis-dashboard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Watchlist.js
│   │   ├── StockChart.js
│   │   ├── AnalyticsPanel.js
│   │   └── NewsFeed.js
│   ├── utils/
│   │   └── api.js
│   ├── styles/
│   │   └── App.css
│   ├── App.js
│   └── index.js
├── docs/
│   ├── api-reference.md
│   ├── design-notes.md
│   └── stock-dashboard-todo.md
├── MemoryBank/
│   ├── user-insights.md
│   ├── feature-requests.md
│   └── previous-trades.md
├── TaskList/
│   ├── tasks.md
│   ├── completed-tasks.md
│   └── roadmap.md
├── package.json
├── README.md
└── .gitignore
```

## Development

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## API Integration

The app integrates with multiple stock data APIs:

- **Alpha Vantage**: Primary provider for real-time quotes and historical data
- **Finnhub**: Fallback provider for quotes and news feed
- **Automatic Fallback**: If one API fails, the app automatically tries the other

See `API_SETUP.md` for detailed setup instructions and `docs/api-reference.md` for API provider documentation.

### Current Features
- ✅ **Real-time Updates**: WebSocket integration for instant price updates (with polling fallback)
- ✅ **Technical Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands with interactive charts
- ✅ **Interactive Charts**: Recharts library with line and bar chart types
- ✅ **Historical Data**: Daily, weekly, monthly price data
- ✅ **Company Profiles**: Comprehensive metrics (P/E ratio, market cap, sector, etc.)
- ✅ **News Feed**: Latest stock-related news articles
- ✅ **Watchlist**: Persistent stock tracking with localStorage
- ✅ **Smart Caching**: Reduces API calls by 60-80% through intelligent caching
- ✅ **Stock Search**: Autocomplete with 37+ common stock symbols
- ✅ **Portfolio Management**: Create, manage, and track multiple stock portfolios
- ✅ **Portfolio Performance**: Real-time portfolio metrics and summary
- ✅ **Price Alerts**: Set custom price alerts with browser notifications and comprehensive dashboard
- ✅ **Dark Mode**: Toggle between light and dark themes with persistent preference and keyboard support
- ✅ **Accessibility**: Full ARIA support, keyboard navigation, and screen reader compatibility
- ✅ **Alerts Dashboard**: Centralized alert management with filtering, sorting, and statistics
- ✅ **Connection Status**: Visual indicators for WebSocket vs polling mode
- ✅ **Error Handling**: Comprehensive error handling with user-friendly messages
- ✅ **Loading States**: Smooth loading indicators for all API calls

## Documentation

- **Usage Guide**: `docs/USAGE_GUIDE.md` - Complete guide for price alerts, dark mode, and troubleshooting
- **API Reference**: `docs/api-reference.md`
- **Design Notes**: `docs/design-notes.md`
- **TODO List**: `docs/stock-dashboard-todo.md`

## Latest Updates

### Version 5.0 Enhancements (Latest)
- **Price Alerts**: Set and manage price alerts for stocks
  - Set high/low price alerts for watchlist and portfolio stocks
  - Alert badges show active and triggered alerts (🔔 🚨)
  - Browser notifications for instant alerts (with permission)
  - Alert management UI (create, delete, clear triggered alerts)
  - Real-time alert checking on price updates
  - **New**: Alerts Dashboard with statistics, filtering, and sorting

- **Dark Mode**: Complete theme toggle
  - Toggle between light and dark themes
  - Persistent preference stored in localStorage
  - Smooth theme transitions
  - Full component support with CSS variables
  - **Enhanced**: Keyboard accessibility (Enter/Space to toggle)

- **Accessibility Improvements**:
  - ARIA labels and roles on all interactive elements
  - Keyboard navigation support throughout the app
  - Screen reader compatibility with proper semantic HTML
  - Alert badges with role="alert" for triggered alerts

### Version 4.0 Enhancements
- **Portfolio Tracking**: Create and manage multiple stock portfolios
  - Sidebar UI for portfolio management
  - Create, rename, and delete portfolios
  - Add/remove stocks to/from portfolios
  - Portfolio performance summary (total value, change, average)
  - Real-time portfolio data updates
  - Click portfolio stocks to view detailed analysis

### Version 3.0 Enhancements
- **WebSocket Integration**: Real-time price updates via Finnhub WebSocket API
- **Technical Indicators**: Full suite of technical analysis tools:
  - SMA (Simple Moving Average) - 20 & 50 period
  - EMA (Exponential Moving Average) - 20 & 50 period
  - RSI (Relative Strength Index) - 14 period with overbought/oversold levels
  - MACD (Moving Average Convergence Divergence) - with signal line and histogram
  - Bollinger Bands - with upper, middle, and lower bands
- **Hybrid Updates**: WebSocket for real-time data with automatic fallback to polling
- **Connection Status**: Visual indicators showing live vs polling mode

### Version 2.0 Enhancements
- **Interactive Charts**: Integrated Recharts library for dynamic line and bar charts
- **Real-time Updates**: Automatic polling every 60 seconds to refresh stock quotes
- **API Caching**: Smart caching system reduces API calls and improves performance
- **Stock Search**: Autocomplete functionality with common stock suggestions

## Future Enhancements

- Export functionality (CSV, PDF)
- Portfolio comparison tools
- Advanced alert settings (email notifications, multiple thresholds)
- Custom alert sounds
- Custom date ranges for charts
- Additional technical indicators (Stochastic, Williams %R, ADX, etc.)
- Backtesting tools
- Portfolio allocation charts (pie/bar charts)

## Repository

- **GitHub**: https://github.com/rvale92/Stock_Dashboard
- **Live Demo**: https://rvale92.github.io/Stock_Dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.
