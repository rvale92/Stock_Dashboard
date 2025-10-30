# GitHub Pages Deployment Guide

## ✅ Deployment Status

**Live Site**: https://rvale92.github.io/Stock_Dashboard  
**Repository**: https://github.com/rvale92/Stock_Dashboard  
**Last Deployed**: Check GitHub repository for latest deployment status

## Quick Deploy

Once your repository is set up:

```bash
npm run deploy
```

## Initial Setup (One-time)

### 1. Initialize Git Repository (if not already done)

```bash
# Navigate to project directory
cd stock-analysis-dashboard

# Initialize git
git init

# Add remote (replace with your repository URL)
git remote add origin https://github.com/rvale92/Stock_Dashboard.git

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Stock Analysis Dashboard"

# Push to main branch
git push -u origin main
```

### 2. Verify package.json Configuration

Ensure your `package.json` has:

```json
{
  "homepage": "https://rvale92.github.io/Stock_Dashboard",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  },
  "devDependencies": {
    "gh-pages": "^6.3.0"
  }
}
```

### 3. Install gh-pages (if not installed)

```bash
npm install --save-dev gh-pages
```

## Deployment Steps

### Standard Deployment

1. **Make sure all changes are committed:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

3. **Wait a few minutes** for GitHub Pages to update (usually 1-5 minutes)

4. **Visit your live site:**
   https://rvale92.github.io/Stock_Dashboard

## Troubleshooting

### Error: "Failed to get remote.origin.url"

**Problem**: Git repository not initialized or remote not set.

**Solution**:
```bash
# Check if git is initialized
git status

# If not, initialize it
git init

# Add remote
git remote add origin https://github.com/rvale92/Stock_Dashboard.git

# Verify remote
git remote -v

# Then try deploy again
npm run deploy
```

### Error: "gh-pages branch already exists"

**Problem**: Previous deployment created gh-pages branch.

**Solution**: This is normal. The deploy script will update the existing branch. If you encounter issues:

```bash
# Delete local gh-pages branch if it exists
git branch -D gh-pages

# Try deploy again
npm run deploy
```

### App shows blank page after deployment

**Problem**: Homepage path mismatch or build issues.

**Solution**:
1. Verify `homepage` in `package.json` matches: `https://rvale92.github.io/Stock_Dashboard`
2. Rebuild and redeploy:
   ```bash
   npm run build
   npm run deploy
   ```
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for errors

### Assets not loading (404 errors)

**Problem**: Asset paths incorrect for GitHub Pages.

**Solution**:
1. Ensure `homepage` field is set correctly in `package.json`
2. Rebuild the app:
   ```bash
   rm -rf build
   npm run build
   npm run deploy
   ```
3. Check `build/index.html` - asset paths should be relative or start with your GitHub Pages path

### API Keys not working after deployment

**Problem**: Environment variables don't work in static builds on GitHub Pages.

**Solution**:
- **Option 1**: Use public API keys (not recommended for production)
  - Add keys directly in code (remove from .env)
  - Be aware of rate limits and security

- **Option 2**: Use runtime configuration
  - Create a public `config.js` file with API endpoints
  - Use a backend proxy for sensitive API calls

- **Option 3**: Use GitHub Secrets with GitHub Actions
  - Set up CI/CD pipeline
  - Use secrets during build process

### Deployment takes too long

**Problem**: GitHub Pages can take a few minutes to update.

**Solution**:
- Wait 5-10 minutes after deployment
- Check GitHub repository Settings → Pages → check deployment status
- Check the Actions tab for any deployment errors

### Routing doesn't work (404 on page refresh)

**Problem**: Client-side routing not compatible with GitHub Pages.

**Solution**:
- If using React Router, consider using `HashRouter` instead of `BrowserRouter`
- Or create a `404.html` that redirects to `index.html`

## Manual Deployment Alternative

If `npm run deploy` doesn't work, you can manually deploy:

```bash
# Build the app
npm run build

# Create/update gh-pages branch manually
git checkout --orphan gh-pages
git rm -rf .
git add build/*
git mv build/index.html index.html
git mv build/static ./static
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages --force

# Go back to main
git checkout main
```

## Verification Checklist

After deployment, verify:

- [ ] Site loads at https://rvale92.github.io/Stock_Dashboard
- [ ] All assets load correctly (check Network tab)
- [ ] Dark mode toggle works
- [ ] Price alerts functionality works
- [ ] Watchlist persists (localStorage)
- [ ] API calls work (if using public keys)
- [ ] Charts render correctly
- [ ] Mobile responsiveness works
- [ ] No console errors

## Updating Deployment

To update your deployed site:

1. Make changes locally
2. Commit and push to main:
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```
3. Redeploy:
   ```bash
   npm run deploy
   ```

The gh-pages branch will be updated automatically.

## Continuous Deployment

For automatic deployment on every push:

1. Create `.github/workflows/deploy.yml`
2. Use GitHub Actions to deploy on push to main
3. Reference GitHub Actions documentation for setup

