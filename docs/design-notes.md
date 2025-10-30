# Design Notes

## Layout

### Dashboard Structure
- **Header**: Application title and navigation
- **Left Panel**:
  - Watchlist component (top)
  - News Feed component (bottom)
- **Right Panel**:
  - Stock Chart component (top)
  - Analytics Panel component (bottom)

### Component Design

#### Watchlist
- Input field for adding stock symbols
- List of watched stocks
- Remove functionality for each stock
- Real-time price updates (future enhancement)

#### Stock Chart
- Interactive chart displaying price history
- Time range selector (1D, 1W, 1M, 3M, 1Y, All)
- Candlestick or line chart options
- Volume indicator

#### Analytics Panel
- Key metrics display:
  - Current price
  - Price change (absolute and percentage)
  - Volume
  - Market cap
  - P/E ratio
  - 52-week high/low
  - More metrics as needed

#### News Feed
- Latest news articles related to watched stocks
- Article title, summary, and date
- Link to full article (future enhancement)

## Color Scheme
- Primary: Blue (#007bff)
- Background: Light gray (#f5f5f5)
- Cards: White with subtle shadows
- Text: Dark gray (#333) for headings, lighter gray (#666) for body

## Responsive Design
- Mobile-first approach
- Grid layout adapts to single column on mobile
- Touch-friendly buttons and inputs

## Future Enhancements
- Dark mode toggle
- Customizable dashboard layout
- Export functionality
- Notifications for price alerts
- Portfolio tracking
