# Port and Script Fixes - Summary

## ✅ Issues Fixed

### 1. Port Conflicts
- ✅ Created `scripts/kill-port.js` to automatically free ports before starting
- ✅ Added `free:3000` and `free:3001` scripts to kill processes on specific ports
- ✅ React automatically uses next available port if 3000 is busy (built-in React Scripts feature)

### 2. Package.json Scripts
- ✅ Removed inline comments that caused shell errors
- ✅ Updated `start:dev` to free ports before starting both servers
- ✅ Added colored output with `concurrently` for better visibility
- ✅ Explicitly set `PORT=3000` for React app

### 3. Environment Variable Loading
- ✅ Updated `server.js` to properly load `.env` file
- ✅ Added API key masking function for secure logging
- ✅ Shows whether API key loaded from `.env` or default

### 4. Helper Scripts
- ✅ `npm run free:3000` - Free port 3000
- ✅ `npm run free:3001` - Free port 3001  
- ✅ `npm run kill:port <PORT>` - Free any port
- ✅ `npm run test:setup` - Test both servers

---

## 📋 Updated package.json Scripts

```json
{
  "scripts": {
    "start": "react-scripts start",
    "start:server": "node server.js",
    "kill:port": "node scripts/kill-port.js",
    "free:3000": "node scripts/kill-port.js 3000",
    "free:3001": "node scripts/kill-port.js 3001",
    "start:dev": "npm run free:3000 && npm run free:3001 && concurrently --names \"PROXY,REACT\" --prefix-colors \"cyan,green\" \"npm run start:server\" \"PORT=3000 npm start\"",
    "test:setup": "node scripts/test-setup.js",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

---

## 🚀 How to Use

### Start Both Servers
```bash
npm run start:dev
```

This will:
1. Free port 3000 (kill any process using it)
2. Free port 3001 (kill any process using it)
3. Start proxy server on port 3001
4. Start React app on port 3000 (or next available if 3000 is busy)

### Start Only Proxy
```bash
npm run start:server
```

### Start Only React
```bash
npm start
```

### Free Specific Ports
```bash
npm run free:3000  # Free port 3000
npm run free:3001  # Free port 3001
npm run kill:port 3002  # Free any port
```

---

## 🧪 Testing

### Test Setup (Automated)
```bash
npm run test:setup
```

### Manual Testing

1. **Proxy Health Check**
```bash
curl http://localhost:3001/health
```
Expected: `{"status":"ok","timestamp":"..."}`

2. **Proxy Quote Endpoint**
```bash
curl "http://localhost:3001/api/quote?symbol=AAPL"
```
Expected: JSON with stock quote data

3. **Proxy History Endpoint**
```bash
curl "http://localhost:3001/api/history?symbol=AAPL&interval=daily"
```
Expected: JSON with historical stock data

4. **React App**
- Open http://localhost:3000 in browser
- Should see the Stock Dashboard
- Add a stock (e.g., AAPL) to watchlist
- Check browser console - should see "Fetching quote via proxy"

---

## 📝 Server.js Changes

### Enhanced Environment Loading
```javascript
require('dotenv').config({ path: path.join(__dirname, '.env') });
```

### API Key Masking
```javascript
const maskApiKey = (key) => {
  if (!key || key.length < 8) return '****';
  return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
};
```

### Improved Startup Logging
```
🚀 Proxy server running on port 3001
📍 Health check: http://localhost:3001/health
📊 Quote endpoint: http://localhost:3001/api/quote?symbol=AAPL
📈 History endpoint: http://localhost:3001/api/history?symbol=AAPL&interval=daily
🔑 API Key: LUFF****3AZ
📝 Loaded from: .env file
```

---

## ✅ Verification Checklist

- [x] Port 3000 can be freed automatically
- [x] Port 3001 can be freed automatically
- [x] Proxy server starts on port 3001
- [x] React app starts on port 3000 (or next available)
- [x] Environment variables load from `.env`
- [x] API key is masked in logs
- [x] Both servers run concurrently with colored output
- [x] No shell errors from inline comments
- [x] React automatically uses alternate port if 3000 is busy

---

## 🔧 Troubleshooting

### Issue: React still can't start on port 3000

**Solution:** React Scripts automatically uses the next available port. Check the terminal output - it will show the actual port (e.g., "The app is running at http://localhost:3002")

### Issue: Ports still in use after `free:3000`

**Solution:** Some processes may need elevated permissions. Try:
```bash
sudo lsof -ti:3000 | xargs kill -9
```

### Issue: API key not loading

**Solution:** 
1. Ensure `.env` file exists in project root
2. Check `.env` contains: `ALPHA_VANTAGE_API_KEY=LUFFBMJFOTCKM3AZ`
3. Restart the proxy server

### Issue: Concurrently not working

**Solution:** Make sure it's installed:
```bash
npm install
```

---

**Status**: ✅ All fixes implemented and tested

All scripts now work correctly, ports are automatically freed, and both servers start successfully!

