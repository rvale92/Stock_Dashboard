# Quick Start Guide - Proxy Server Setup

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies

```bash
npm install
```

This installs:
- Express (proxy server)
- CORS (cross-origin support)
- dotenv (environment variables)
- concurrently (run both servers together)

### 2. Create `.env` File

```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```
ALPHA_VANTAGE_API_KEY=LUFFBMJFOTCKM3AZ
```

### 3. Start Development

**Option A: Run Both Servers Together**
```bash
npm run start:dev
```
This starts:
- Proxy server on http://localhost:3001
- React app on http://localhost:3000

**Option B: Run Separately**

Terminal 1 (Proxy):
```bash
npm run start:server
```

Terminal 2 (React):
```bash
npm start
```

---

## ✅ Verify It Works

1. Open http://localhost:3000 in your browser
2. Try adding a stock (e.g., AAPL) to the watchlist
3. Check browser console - you should see "Fetching quote via proxy"
4. No CSP errors should appear!

---

## 🧪 Test Proxy Directly

```bash
# Health check
curl http://localhost:3001/health

# Get stock quote
curl "http://localhost:3001/api/quote?symbol=AAPL"

# Get historical data
curl "http://localhost:3001/api/history?symbol=AAPL&interval=daily"
```

---

## 📦 What Changed?

### Before (CSP Issues)
- Frontend called `alphavantage.co` directly
- Browser blocked requests (CSP violation)
- API key exposed in frontend code

### After (Fixed)
- Frontend calls `/api/quote` and `/api/history` (same origin)
- Proxy server forwards to Alpha Vantage
- API key stored server-side only
- No CSP violations!

---

## 🚀 Next: Deploy to Production

See [PROXY_DEPLOYMENT.md](./PROXY_DEPLOYMENT.md) for:
- Vercel deployment (recommended)
- Render deployment
- Railway deployment
- Configuration guide

---

**Need Help?** Check `PROXY_DEPLOYMENT.md` for detailed deployment instructions.

