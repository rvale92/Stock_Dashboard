# User Insights

## Implementation Notes

### API Integration
- Successfully integrated Alpha Vantage API for quotes and historical data
- Added Finnhub as fallback provider for quotes and news
- Implemented error handling with graceful fallbacks
- Rate limiting considerations: Alpha Vantage (5 calls/min free tier), Finnhub (60 calls/min free tier)

### Component Architecture
- Watchlist: Manages stock list with localStorage persistence, fetches quotes on add
- StockChart: Fetches historical data based on selected symbol and interval
- AnalyticsPanel: Combines real-time quote and company profile data
- NewsFeed: Fetches recent news articles for selected stock

### Known Issues & Solutions
- API rate limits: Caching system implemented to reduce repeated API calls
- Demo API keys: App will work but with limited functionality; users should add their own keys
- Polling interval: Currently set to 60 seconds; can be adjusted based on user needs
- Chart performance: Limited to last 30 data points for readability; can be adjusted

### Recent Enhancements (Oct 29, 2024)
- WebSocket integration: Real-time price updates via Finnhub WebSocket API with automatic fallback
- Technical indicators: Full suite of indicators (SMA, EMA, RSI, MACD, Bollinger Bands) with calculated values
- Hybrid update system: WebSocket for instant updates, polling as fallback for reliability
- Connection status indicators: Visual feedback showing live vs polling mode
- Performance: Faster load times due to caching, better UX with real-time updates

### WebSocket Implementation Notes
- Finnhub WebSocket requires valid API key (demo key won't work)
- Automatic connection management with reconnection logic
- Multiple subscribers per connection for efficiency
- Graceful degradation: Falls back to polling if WebSocket unavailable
- Connection pooling: Reuses connections for multiple symbols

### Technical Indicators Implementation
- All indicators calculated client-side from historical data
- SMA/EMA: Configurable periods (default 20, 50)
- RSI: 14-period with overbought (70) and oversold (30) levels
- MACD: 12/26/9 configuration with signal line and histogram
- Bollinger Bands: 20-period with 2 standard deviations

### Portfolio Tracking Implementation
- Portfolio structure: { id, name, symbols[], createdAt, updatedAt }
- Storage: localStorage with key 'stock_portfolios'
- Performance calculations: Total value, total change, average change from portfolio symbols
- UI: Sidebar toggle, portfolio manager, portfolio view with metrics
- Navigation: Toggle between watchlist and portfolio view
- Real-time updates: Portfolio data refreshes every 30 seconds

### Price Alerts Implementation
- Alert structure: { id, symbol, targetPrice, direction, triggered, triggeredAt, cleared, createdAt, updatedAt }
- Storage: localStorage with key 'stock_price_alerts'
- Alert checking: Runs on price updates (WebSocket, polling, manual fetch)
- Browser notifications: Request permission, show when alerts trigger
- UI: Alert badges (🔔 active, 🚨 triggered), AlertManager component for management
- Integration: Watchlist and PortfolioView both support alerts

### Dark Mode Implementation
- Theme system: CSS variables for all colors, smooth transitions
- Storage: localStorage with key 'darkMode'
- Context: React context provider for app-wide dark mode state
- Toggle: Header button (🌙/☀️) for easy switching, keyboard accessible (Enter/Space)
- Coverage: All components support dark mode with CSS variables
- Performance: Transitions are smooth, no layout shifts
- Accessibility: ARIA labels, keyboard navigation support

### Alert Badge Symbols Meaning
- 🔔 (Bell icon): Active alert - alert is set and waiting to trigger
  - Color: Yellow/Orange (warning color)
  - Usage: Appears next to stocks with active price alerts
  - Accessibility: `role="status"`, `aria-label="Price alert active for [SYMBOL]"`

- 🚨 (Alarm icon): Triggered alert - price has reached target threshold
  - Color: Red (danger color)
  - Animation: Pulsing animation to draw attention
  - Usage: Appears when alert condition is met (price above/below target)
  - Accessibility: `role="alert"`, `aria-label="Price alert triggered for [SYMBOL]!"`

### Accessibility Enhancements
- ARIA labels on all interactive elements
- Keyboard navigation support (Tab, Enter, Space)
- Role attributes for alert badges (status/alert)
- Screen reader support with aria-hidden for decorative icons
- Form labels properly associated with inputs
- aria-expanded for collapsible sections

### User Preferences
- Preferences and behavior patterns will be documented here

## Usage Patterns
- Track how the dashboard is being used
- Note common stock symbols watched
- Identify frequently used features

## Feedback Collection
- User feedback on UI/UX
- Feature requests
- Bug reports and resolutions
