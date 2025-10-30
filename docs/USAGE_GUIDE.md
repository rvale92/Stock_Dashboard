# Stock Analysis Dashboard - Usage Guide

## Price Alerts

### Setting Up Alerts

1. **From Watchlist:**
   - Click the 🔔 button next to any stock symbol
   - Enter your target price
   - Select "Above" or "Below" based on when you want to be alerted
   - Click "Save Alert"
   - Alert badges will appear: 🔔 (active) or 🚨 (triggered)

2. **From Portfolio:**
   - Navigate to a portfolio view
   - Click the 🔔 button next to any stock
   - Follow the same steps as above

### Alert Badges

- **🔔 Blue Badge**: Active alert waiting to trigger
- **🚨 Red Badge**: Alert has been triggered (pulsing animation)

### Managing Alerts

- **View All Alerts**: Click "🔔 Alerts" button in the header to open the Alerts Dashboard
- **Clear Triggered Alerts**: Click the ✓ button on any triggered alert
- **Delete Alerts**: Click the × button on any alert
- **Clear All Triggered**: Use "Clear All Triggered" button in the Alerts Dashboard

### Browser Notifications

The dashboard will request permission to show browser notifications when alerts trigger. You can:
- Grant permission for instant desktop notifications
- Deny to only see in-app badge notifications
- Change notification settings in your browser preferences

### Alert Scenarios

**Scenario 1: Stock Price Rises Above Target**
1. Set alert: "AAPL Above $150.00"
2. When AAPL price reaches or exceeds $150.00
3. Alert triggers: 🚨 badge appears, browser notification (if enabled)
4. Alert can be cleared or left active

**Scenario 2: Stock Price Drops Below Target**
1. Set alert: "TSLA Below $200.00"
2. When TSLA price drops to or below $200.00
3. Alert triggers with same notifications

## Dark Mode

### Toggle Dark Mode

- Click the 🌙/☀️ button in the header to switch themes
- Your preference is automatically saved
- Theme persists across browser sessions

### Theme Features

- **Light Mode**: Default theme with light backgrounds and dark text
- **Dark Mode**: Dark backgrounds with light text for reduced eye strain
- **Smooth Transitions**: Themes switch with smooth animations
- **Comprehensive Coverage**: All components, charts, and UI elements support both themes

### Keyboard Accessibility

- Press `Tab` to navigate to the dark mode toggle
- Press `Enter` or `Space` to toggle theme
- All interactive elements support keyboard navigation

## Alerts Dashboard

### Overview

The Alerts Dashboard provides comprehensive alert management:

1. **Statistics Cards:**
   - Total Alerts
   - Active Alerts
   - Triggered Alerts
   - Cleared Alerts

2. **Filtering:**
   - Filter by: All, Active, Triggered, or Cleared
   - Sort by: Date Created, Symbol, or Target Price

3. **Alert List:**
   - View all alerts in a table format
   - See alert status, creation date, and trigger time
   - Delete individual alerts or clear all triggered

### Accessibility

All dashboard features support:
- **Screen Readers**: ARIA labels and roles
- **Keyboard Navigation**: Tab through all elements
- **Visual Indicators**: Color-coded status badges

## Troubleshooting

### Alerts Not Triggering

**Issue**: Alerts don't trigger when price reaches target.

**Solutions:**
1. Check WebSocket connection status (should show "⚡ Live" or "🔄 Polling")
2. Verify alert direction (above vs below) matches your expectation
3. Ensure target price is correct
4. Check browser console for errors
5. Refresh the page to reload alerts

### Browser Notifications Not Working

**Issue**: No browser notifications appear when alerts trigger.

**Solutions:**
1. Check browser notification permissions in browser settings
2. Ensure you granted permission when prompted
3. Some browsers block notifications in private/incognito mode
4. Verify alerts are actually triggering (check for 🚨 badge)

### Dark Mode Not Persisting

**Issue**: Dark mode resets to light after page refresh.

**Solutions:**
1. Check browser localStorage is enabled
2. Clear browser cache and try again
3. Check browser console for errors
4. Ensure cookies/localStorage are not blocked

### Alert Dashboard Shows Wrong Counts

**Issue**: Statistics don't match actual alerts.

**Solutions:**
1. Click the refresh button (🔄) in the dashboard
2. Wait a few seconds for automatic refresh
3. Check localStorage in browser dev tools
4. Clear and reset if data is corrupted

## Permission Requirements

### Browser Notifications

- **Permission Type**: Notification permission
- **Purpose**: Show desktop notifications when alerts trigger
- **Optional**: App works without notifications (badges still show)
- **Reset**: Change in browser settings → Site Settings → Notifications

### LocalStorage

- **Required For**: Saving watchlists, portfolios, alerts, and preferences
- **Blocking**: If localStorage is disabled, app features will not persist
- **Storage Limit**: ~5-10MB (plenty for normal use)

## Best Practices

### Setting Alerts

1. Set realistic price targets based on current market conditions
2. Use "Above" alerts for entry points or profit targets
3. Use "Below" alerts for stop-loss or buying opportunities
4. Clear old triggered alerts regularly to reduce clutter

### Dark Mode

1. Use dark mode in low-light environments
2. Use light mode during daylight hours if preferred
3. Theme preference syncs across browser tabs

### Alert Dashboard

1. Review triggered alerts daily
2. Clear triggered alerts after reviewing
3. Use filtering to focus on active alerts
4. Sort by date to see newest alerts first

## Keyboard Shortcuts

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate buttons and toggles
- **Escape**: Close modals (if applicable)

## Support

For issues or questions:
1. Check this guide first
2. Review browser console for errors
3. Clear browser cache and localStorage
4. Refresh the page
5. Check API connection status

