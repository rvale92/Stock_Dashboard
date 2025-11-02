# Proxy Server Deployment Guide

This guide explains how to deploy the Express proxy server to fix Content Security Policy (CSP) issues when hosting the React app on GitHub Pages.

## 🎯 Why a Proxy Server?

GitHub Pages and many hosting services enforce strict Content Security Policies that block direct API calls to external domains (like `alphavantage.co`). The proxy server:

- Runs on your own domain/origin
- Forwards requests to Alpha Vantage
- Keeps your API key secure (server-side only)
- Avoids CSP violations

---

## 🚀 Local Development

### 1. Install Dependencies

```bash
cd Stock_Dashboard
npm install
```

### 2. Create `.env` File

```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```
ALPHA_VANTAGE_API_KEY=LUFFBMJFOTCKM3AZ
```

### 3. Start Proxy Server

```bash
npm run start:server
```

The proxy runs on **http://localhost:3001**

### 4. Start React App (in another terminal)

```bash
npm start
```

The React app runs on **http://localhost:3000** and will automatically connect to the proxy on port 3001.

### 5. Or Run Both Together

```bash
npm run start:dev
```

This runs both the proxy server and React app concurrently.

---

## 🌐 Deployment Options

### Option 1: Deploy to Vercel (Recommended)

Vercel is free, easy to use, and perfect for Node.js proxy servers.

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Login to Vercel

```bash
vercel login
```

#### Step 3: Create `vercel.json`

Create a `vercel.json` file in the project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "ALPHA_VANTAGE_API_KEY": "@alpha-vantage-api-key"
  }
```

#### Step 4: Set Environment Variable

```bash
vercel env add ALPHA_VANTAGE_API_KEY
# Enter your key: LUFFBMJFOTCKM3AZ
```

#### Step 5: Deploy

```bash
vercel --prod
```

Your proxy will be live at: `https://your-project.vercel.app`

#### Step 6: Update Frontend

Update `.env.production` or set environment variable in your frontend deployment:

```bash
REACT_APP_PROXY_URL=https://your-project.vercel.app
```

Or update `src/utils/api.js` line 12 to hardcode your Vercel URL.

---

### Option 2: Deploy to Render

Render offers free Node.js hosting with a free tier.

#### Step 1: Create `render.yaml`

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: stock-dashboard-proxy
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: ALPHA_VANTAGE_API_KEY
        value: LUFFBMJFOTCKM3AZ
    plan: free
```

#### Step 2: Deploy

1. Go to [render.com](https://render.com)
2. Connect your GitHub repository
3. Select "New Web Service"
4. Render will auto-detect `render.yaml`
5. Click "Create Web Service"

Your proxy will be live at: `https://stock-dashboard-proxy.onrender.com`

#### Step 3: Update Frontend

Set `REACT_APP_PROXY_URL` to your Render URL in your frontend deployment.

---

### Option 3: Deploy to Railway

Railway is another excellent option for Node.js apps.

#### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

#### Step 2: Login

```bash
railway login
```

#### Step 3: Initialize Project

```bash
railway init
```

#### Step 4: Set Environment Variable

```bash
railway variables set ALPHA_VANTAGE_API_KEY=LUFFBMJFOTCKM3AZ
```

#### Step 5: Deploy

```bash
railway up
```

Your proxy will be live at: `https://your-project.up.railway.app`

---

## 📋 Deployment Checklist

- [ ] Proxy server deployed and accessible
- [ ] Environment variable `ALPHA_VANTAGE_API_KEY` set on hosting platform
- [ ] Test proxy endpoints:
  - `GET /health` - Should return `{status: "ok"}`
  - `GET /api/quote?symbol=AAPL` - Should return stock data
  - `GET /api/history?symbol=AAPL&interval=daily` - Should return historical data
- [ ] Frontend `REACT_APP_PROXY_URL` set to proxy URL (or update `src/utils/api.js`)
- [ ] Rebuild and redeploy frontend
- [ ] Test in browser - check console for CSP errors (should be none)

---

## 🔍 Testing the Proxy

### Test Health Endpoint

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-11-02T..."}
```

### Test Quote Endpoint

```bash
curl "http://localhost:3001/api/quote?symbol=AAPL"
```

Expected response:
```json
{
  "Global Quote": {
    "01. symbol": "AAPL",
    "05. price": "270.37",
    ...
  }
}
```

### Test History Endpoint

```bash
curl "http://localhost:3001/api/history?symbol=AAPL&interval=daily"
```

Expected response:
```json
{
  "Meta Data": {...},
  "Time Series (Daily)": {...}
}
```

---

## 🐛 Troubleshooting

### Issue: "Network request failed"

**Solution:** Ensure the proxy server is running and accessible at the URL specified in `REACT_APP_PROXY_URL`.

### Issue: "CORS error"

**Solution:** The proxy server includes CORS middleware. If you still see CORS errors, check that your proxy URL is correct.

### Issue: "Rate limit reached"

**Solution:** 
- Free Alpha Vantage keys: 25 requests/day
- Check your usage on Alpha Vantage dashboard
- Wait 24 hours for reset or upgrade your plan

### Issue: "No data available"

**Solution:**
- Verify API key is set correctly in `.env` (local) or environment variables (deployed)
- Check proxy server logs for errors
- Test proxy endpoints directly with `curl`

---

## 📝 Production Configuration

### For Vercel

1. Set environment variable in Vercel dashboard:
   - Go to Project → Settings → Environment Variables
   - Add `ALPHA_VANTAGE_API_KEY` with your key

2. Update `vercel.json` if needed:
```json
{
  "env": {
    "ALPHA_VANTAGE_API_KEY": "@alpha-vantage-api-key"
  }
}
```

### For Render

Set environment variable in Render dashboard:
- Go to Service → Environment
- Add `ALPHA_VANTAGE_API_KEY`

### For Railway

Use Railway CLI or dashboard to set environment variables.

---

## 🔒 Security Notes

- ✅ API key is stored server-side only
- ✅ API key is never exposed to the browser
- ✅ Proxy validates requests before forwarding
- ✅ CORS is properly configured
- ⚠️ Keep `.env` in `.gitignore` (already configured)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Express CORS](https://expressjs.com/en/resources/middleware/cors.html)

---

**Last Updated:** 2025-11-02

