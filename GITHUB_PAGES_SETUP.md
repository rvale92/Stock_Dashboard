# GitHub Pages Deployment Setup

This guide walks you through deploying the Stock Analysis Dashboard to GitHub Pages using GitHub Actions.

## Prerequisites

1. **Deploy Proxy Server First**
   - Deploy `server.js` to Vercel, Render, or Railway
   - Note your proxy URL (e.g., `https://stock-proxy.vercel.app`)

## Step 1: Add Repository Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - **Name**: `REACT_APP_PROXY_URL`
   - **Value**: Your proxy URL (e.g., `https://stock-proxy.vercel.app`)
5. Click **Add secret**

## Step 2: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select: **GitHub Actions**
3. Save changes

## Step 3: Push Workflow File

The workflow file `.github/workflows/pages.yml` is already created and will:
- Trigger on pushes to `main` branch
- Build the React app with your proxy URL
- Deploy to GitHub Pages automatically

## Step 4: Deploy

1. Push to `main` branch (or manually trigger workflow):
   ```bash
   git push origin main
   ```

2. Go to **Actions** tab in GitHub
3. Watch the workflow run
4. When complete, your site will be available at:
   ```
   https://rvale92.github.io/Stock_Dashboard
   ```

## Step 5: Verify Deployment

1. Open the deployed site
2. Open browser DevTools → Network tab
3. Look for API calls to your proxy:
   ```
   https://<your-proxy-domain>/api/yf/quote?symbol=AAPL
   ```
4. Verify:
   - ✅ No CSP/CORS errors
   - ✅ Charts render correctly
   - ✅ Stock data loads successfully

## Troubleshooting

### Workflow Fails
- Check Actions → [workflow run] → View logs
- Ensure `REACT_APP_PROXY_URL` secret is set correctly
- Verify Node.js version is 20 (check workflow file)

### Site Shows Blank Page
- Check browser console for errors
- Verify `homepage` in `package.json` matches GitHub Pages URL
- Ensure proxy server is deployed and accessible

### API Calls Fail
- Verify proxy URL is correct in secrets
- Check proxy server logs
- Test proxy directly: `curl https://<your-proxy>/health`

## Manual Workflow Trigger

You can manually trigger the workflow:
1. Go to **Actions** tab
2. Select **Build & Deploy (GitHub Pages native)**
3. Click **Run workflow** → **Run workflow**

## Notes

- The workflow uses `npm ci` for faster, reliable builds
- Production build includes `REACT_APP_PROXY_URL` from secrets
- Deployment happens automatically on every push to `main`
- The workflow respects concurrency limits (cancels in-progress runs)

