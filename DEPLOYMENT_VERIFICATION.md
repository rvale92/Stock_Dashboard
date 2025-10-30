# Deployment Verification Checklist

## Pre-Deployment Checklist

- [x] `package.json` configured with `homepage` field
- [x] `gh-pages` installed as dev dependency
- [x] Deployment scripts (`predeploy`, `deploy`) added
- [x] Git repository initialized
- [x] Remote repository configured
- [x] All files committed
- [x] Production build successful

## Post-Deployment Verification

### 1. Site Accessibility

**URL**: https://rvale92.github.io/Stock_Dashboard

- [ ] Site loads without errors
- [ ] No blank page or console errors
- [ ] Check browser console (F12) for any JavaScript errors
- [ ] Check Network tab - all assets load (no 404s)

**Expected Load Time**: 2-5 seconds on first visit

### 2. Asset Loading

- [ ] CSS stylesheets load correctly
- [ ] JavaScript bundles load (check Network tab)
- [ ] Images/icons display (if any)
- [ ] Fonts load (if using custom fonts)
- [ ] Recharts library loads (for charts)

**Verification**: Open DevTools → Network tab → Reload page
- All requests should return 200 status
- No failed requests (red status)

### 3. Core Features Testing

#### Dark Mode
- [ ] Toggle button visible in header
- [ ] Clicking toggle switches theme
- [ ] Theme persists after page refresh
- [ ] Keyboard accessible (Tab + Enter/Space)
- [ ] Screen reader announces theme change

**Test Steps**:
1. Click 🌙 button in header
2. Verify background becomes dark
3. Refresh page
4. Verify dark mode persists

#### Price Alerts
- [ ] Alert button (🔔) appears next to stocks
- [ ] Clicking button opens alert form
- [ ] Can create "Above" alert
- [ ] Can create "Below" alert
- [ ] Alert badges show (🔔 for active, 🚨 for triggered)
- [ ] Alerts persist after page refresh

**Test Steps**:
1. Add a stock to watchlist (e.g., AAPL)
2. Click 🔔 button
3. Set alert: "Above $150" or "Below $100"
4. Save alert
5. Verify 🔔 badge appears
6. Refresh page - alert should persist

#### Alerts Dashboard
- [ ] "🔔 Alerts" button in header works
- [ ] Dashboard displays statistics cards
- [ ] Can filter alerts (All/Active/Triggered/Cleared)
- [ ] Can sort alerts (Date/Symbol/Price)
- [ ] Can delete individual alerts
- [ ] Can clear all triggered alerts

**Test Steps**:
1. Click "🔔 Alerts" in header
2. Verify dashboard opens
3. Test filtering dropdown
4. Test sorting dropdown
5. Create test alerts to verify counts

#### Real-Time Updates
- [ ] Connection status shows (⚡ Live or 🔄 Polling)
- [ ] Stock prices update automatically
- [ ] WebSocket connection works (if API key configured)
- [ ] Polling fallback works (if WebSocket unavailable)

**Test Steps**:
1. Add stocks to watchlist
2. Observe connection status indicator
3. Watch price updates (should refresh every 60s if polling)
4. Verify real-time price changes

#### Watchlist & Portfolios
- [ ] Can add stocks to watchlist
- [ ] Watchlist persists after refresh
- [ ] Can create portfolios
- [ ] Can add stocks to portfolios
- [ ] Portfolio performance calculates correctly

**Test Steps**:
1. Add stocks via search/autocomplete
2. Refresh page - stocks should persist
3. Create a portfolio
4. Add stocks to portfolio
5. Verify performance metrics

#### Charts & Analytics
- [ ] Stock charts render (Recharts)
- [ ] Can switch between line/bar charts
- [ ] Can change time intervals (daily/weekly/monthly)
- [ ] Technical indicators display
- [ ] Analytics panel shows metrics

**Test Steps**:
1. Click on a stock in watchlist
2. Verify chart appears
3. Switch chart type (Line/Bar)
4. Change interval (Daily/Weekly/Monthly)
5. Scroll to Technical Indicators section
6. Switch between indicators (SMA, EMA, RSI, MACD, Bollinger Bands)

### 4. Accessibility Testing

#### Keyboard Navigation
- [ ] Tab key navigates through all interactive elements
- [ ] Enter/Space activates buttons
- [ ] Focus indicators visible
- [ ] Dark mode toggle keyboard accessible

**Test Steps**:
1. Use only keyboard (no mouse)
2. Tab through interface
3. Press Enter/Space on buttons
4. Verify focus outlines appear

#### Screen Reader
- [ ] All buttons have aria-label
- [ ] Alert badges announce correctly
- [ ] Form inputs have labels
- [ ] Status changes are announced

**Test Steps**:
1. Enable screen reader (VoiceOver/Mac, NVDA/Windows)
2. Navigate through interface
3. Verify announcements are clear and descriptive

#### Visual Accessibility
- [ ] Sufficient color contrast (light mode)
- [ ] Sufficient color contrast (dark mode)
- [ ] Alert badges distinguishable
- [ ] Error messages visible

**Test Tools**:
- Use browser DevTools → Lighthouse → Accessibility audit
- Minimum score: 90/100

### 5. Responsive Design

- [ ] Mobile view works (320px - 768px)
- [ ] Tablet view works (768px - 1024px)
- [ ] Desktop view works (1024px+)
- [ ] Alerts dashboard responsive
- [ ] Charts responsive on mobile

**Test Steps**:
1. Open DevTools → Toggle device toolbar
2. Test different screen sizes
3. Verify layout adjusts correctly
4. Test touch interactions on mobile

### 6. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Note**: All modern browsers should work. IE11 not supported.

### 7. Performance

**Lighthouse Score Targets**:
- [ ] Performance: 70+
- [ ] Accessibility: 90+
- [ ] Best Practices: 90+
- [ ] SEO: 80+

**Test Tool**: Chrome DevTools → Lighthouse

### 8. API Integration (If Configured)

- [ ] Stock quotes load
- [ ] Historical data loads
- [ ] Company profiles load
- [ ] News feed loads
- [ ] WebSocket connects (if Finnhub API key set)

**Note**: Without API keys, app uses demo data with strict rate limits.

## Troubleshooting Common Issues

### Issue: Site shows blank page

**Diagnosis**:
1. Check browser console for errors
2. Verify `homepage` in package.json matches GitHub Pages URL
3. Check GitHub repository Settings → Pages

**Fix**:
```bash
npm run build
npm run deploy
```

### Issue: Assets return 404

**Diagnosis**: Asset paths incorrect

**Fix**: Verify `homepage` field in `package.json`:
```json
"homepage": "https://rvale92.github.io/Stock_Dashboard"
```

### Issue: Dark mode doesn't persist

**Diagnosis**: localStorage not working

**Fix**: Check browser settings, ensure localStorage enabled

### Issue: API calls fail

**Diagnosis**: API keys not configured for production

**Fix**: See API_SETUP.md for production API key configuration

## Automated Verification Script

Run this in browser console on deployed site:

```javascript
// Quick Feature Check
const checks = {
  darkMode: !!document.querySelector('.dark-mode-toggle'),
  alerts: !!document.querySelector('.alert-btn'),
  watchlist: !!document.querySelector('.watchlist'),
  charts: !!document.querySelector('.recharts-wrapper'),
  accessibility: document.querySelectorAll('[aria-label]').length > 10
};

console.log('Feature Checks:', checks);
console.log('All Features Present:', Object.values(checks).every(v => v));
```

## Post-Deployment Checklist Summary

After deployment, verify:
1. ✅ Site loads at correct URL
2. ✅ All assets load (no 404s)
3. ✅ Dark mode works and persists
4. ✅ Price alerts create/trigger/clear
5. ✅ Alerts dashboard functions
6. ✅ Real-time updates work
7. ✅ Charts render correctly
8. ✅ Keyboard navigation works
9. ✅ Screen reader compatible
10. ✅ Mobile responsive

## Report Issues

If any issues are found:
1. Document issue in GitHub Issues
2. Include browser/OS information
3. Include console errors (if any)
4. Include steps to reproduce

