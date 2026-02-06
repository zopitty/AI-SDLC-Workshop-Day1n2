# Railway Deployment Guide

This guide explains how to deploy the Todo App to Railway.app using Railway's built-in GitHub integration.

## 🚀 Quick Start (Recommended)

Railway's built-in GitHub integration is the simplest and most reliable way to deploy this application.

### Prerequisites

- A [Railway](https://railway.app) account (free tier available)
- GitHub repository with the Todo App code
- Repository pushed to GitHub

### Step 1: Create Railway Project

1. **Go to [Railway Dashboard](https://railway.app/dashboard)**

2. **Click "New Project"**

3. **Select "Deploy from GitHub repo"**
   - Railway will request GitHub access
   - Grant access to your repositories

4. **Choose your repository:**
   - Select: `zopitty/AI-SDLC-Workshop-Day1n2`
   - Choose branch: `main`, `solution`, or your preferred branch
   - Railway will auto-detect it's a Next.js app

5. **Railway automatically configures everything:**
   - ✅ Detects Next.js framework
   - ✅ Sets build command: `npm run build`
   - ✅ Sets start command: `npm start`
   - ✅ Configures Node.js environment
   - ✅ Generates public URL

### Step 2: Configure Environment (Optional)

1. **In Railway project, click on your service**

2. **Go to "Variables" tab**
   
   Add these environment variables if needed:
   ```
   NODE_ENV=production
   ```

3. **Set up custom domain (optional):**
   - Go to "Settings" → "Networking"
   - Click "Generate Domain" for a Railway subdomain (e.g., `your-app.up.railway.app`)
   - Or add your own custom domain

### Step 3: Deploy!

**That's it!** Railway will now automatically:
- ✅ Deploy on every push to your selected branch
- ✅ Show deployment status in GitHub
- ✅ Provide deployment logs
- ✅ Give you a live URL
- ✅ Handle rollbacks if deployment fails

## 📦 What Gets Deployed

Railway will:
1. Clone your repository
2. Install dependencies with `npm ci`
3. Build the Next.js application with `npm run build`
4. Start the production server with `npm start`
5. Expose the application on a public URL

## 🔄 Automatic Deployments

Every time you push code to your configured branch:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Railway automatically:
1. Detects the push via GitHub webhook
2. Pulls the latest code
3. Runs the build process
4. Deploys the new version
5. Updates your live URL

**No manual deployment needed!**

## 📊 Monitor Deployments

### In Railway Dashboard:
1. View real-time deployment status
2. Check build logs
3. Monitor application logs
4. View deployment history
5. Track resource usage

### In GitHub:
1. See Railway check status on commits
2. Get deployment notifications
3. View deployment URLs in PR comments (if enabled)

## ⚙️ Configuration Files

The repository includes these Railway-specific configuration files:

### `railway.json`
Specifies build and deployment settings:
- Build command
- Start command
- Restart policy

### `nixpacks.toml`
Configures the Nixpacks build system:
- Node.js version (20.x)
- Required system packages
- Build phases

### `package.json`
Standard npm configuration with required scripts:
- `build`: Builds the Next.js application
- `start`: Starts the production server

## 🔧 Troubleshooting

### Build Fails

**Check Railway build logs:**
1. Railway Dashboard → Your service
2. "Deployments" tab → Failed deployment
3. View build logs for errors

**Common issues:**
- Missing dependencies in `package.json`
- TypeScript compilation errors
- Build errors (test locally first: `npm run build`)
- Node.js version mismatch

**Solutions:**
```bash
# Test build locally before pushing
npm install
npm run build
npm start

# Check for errors and fix them before deploying
```

### App Crashes After Deploy

**Check runtime logs:**
1. Railway Dashboard → Your service
2. "Deployments" → Active deployment
3. View runtime logs

**Common issues:**
- Missing environment variables
- Database connection issues (SQLite limitations)
- Port configuration (Railway sets `PORT` automatically)
- Missing dependencies

### Database Persistence Issues

**Important:** This app uses SQLite (`todos.db`) which has limitations on Railway:

⚠️ **SQLite files are stored on ephemeral storage and will be lost when:**
- The service restarts
- A new deployment is made
- Railway moves your service to a different server

**Recommended for production:**

1. **Use Railway's PostgreSQL service:**
   - Click "New" in your Railway project
   - Select "Database" → "PostgreSQL"
   - Update your app to use PostgreSQL instead of SQLite
   - Set `DATABASE_URL` environment variable

2. **Or use an external database:**
   - Set up PostgreSQL on a persistent platform
   - Update database connection in your code
   - Add connection string to environment variables

### Deployment Takes Too Long

Railway has generous build timeouts, but if needed:
- Optimize dependencies in `package.json`
- Remove unused packages
- Use `npm ci` for faster, consistent installs (already configured)
- Check for slow build steps in logs

### Port Binding Issues

Railway automatically sets the `PORT` environment variable. Ensure your Next.js app listens on the correct port:

Next.js handles this automatically, but verify in your `next.config.ts` that you're not overriding the port.

## 🎓 Advanced Features

### Preview Deployments for Pull Requests

Railway can automatically create preview deployments for Pull Requests:

**Enable PR Deploys:**
1. Railway Dashboard → Project Settings
2. "GitHub Integration" section
3. Enable "PR Deploys"

**How it works:**
1. Create a PR in GitHub
2. Railway automatically deploys a preview
3. Get a unique URL for testing changes
4. Merge PR → deploys to production environment

### Environment-Specific Deployments

Deploy different branches to different environments:

1. **Production:** Deploy from `main` branch
2. **Staging:** Create a separate Railway service for `staging` branch
3. **Development:** Create another service for `develop` branch

Each service gets its own URL and can have different environment variables.

### Custom Domains

Add a custom domain to your Railway deployment:

1. Railway Dashboard → Your service
2. "Settings" → "Networking"
3. Click "Custom Domain"
4. Enter your domain (e.g., `todos.example.com`)
5. Add the provided CNAME record to your DNS provider
6. Wait for DNS propagation (usually 5-15 minutes)

### Health Checks

Railway can monitor your application's health:

1. Railway Dashboard → Your service
2. "Settings" → "Health Checks"
3. Configure:
   - **Path:** `/api/health` (create this endpoint)
   - **Interval:** 30 seconds
   - **Timeout:** 10 seconds
   - **Retries:** 3

Example health check endpoint:
```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

## 💰 Pricing Considerations

Railway offers:
- **Free Tier:** $5 of usage per month (includes 500 hours of execution)
- **Pay-as-you-go:** Beyond free tier, $0.000231/GB-hour for memory
- **Team Plan:** Starting at $20/month with additional resources

**Typical usage for this app:**
- ~$2-3/month on free tier
- Minimal memory footprint
- Should stay within free tier limits for development/testing

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Next.js Guide](https://docs.railway.app/guides/nextjs)
- [Railway Discord Community](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app)

## ❓ FAQ

### Q: Can I use GitHub Actions with Railway?

**A:** Railway's built-in integration is simpler and more reliable than GitHub Actions. The repository includes GitHub Actions workflows, but Railway's native integration is recommended.

### Q: How do I rollback a deployment?

**A:** 
1. Railway Dashboard → Deployments
2. Click previous successful deployment
3. Click "Redeploy" button

### Q: Can I see deployment logs?

**A:**
1. Railway Dashboard → Your service
2. "Deployments" → Click deployment
3. View build and runtime logs

### Q: How do I set environment variables?

**A:**
1. Railway Dashboard → Your service
2. "Variables" tab
3. Add variables (key-value pairs)
4. Redeploy for changes to take effect

### Q: Can I deploy from multiple branches?

**A:** Yes! Create separate Railway services for different branches (production, staging, development).

### Q: What about database backups?

**A:** 
- SQLite: Not recommended for production (ephemeral storage)
- PostgreSQL: Railway provides automatic backups
- Manual: Export data regularly via your app's export feature

## 🔐 Security Best Practices

1. **Never commit secrets to repository**
   - Use Railway environment variables
   - Add `.env` to `.gitignore`

2. **Use environment-specific secrets**
   - Different secrets for production/staging
   - Rotate secrets regularly

3. **Enable HTTPS**
   - Railway provides automatic HTTPS
   - Ensure your app redirects HTTP to HTTPS

4. **Monitor your application**
   - Check logs regularly
   - Set up health checks
   - Monitor resource usage

## 🎉 Summary

**Railway Deployment is Simple:**

1. ✅ Connect Railway to your GitHub repository (one-time setup)
2. ✅ Railway auto-detects Next.js and configures everything
3. ✅ Push code to your repository
4. ✅ Railway deploys automatically
5. ✅ Access your app at the provided URL

**No complex configuration required!**

---

## Manual Deployment Steps (If Needed)

While Railway's GitHub integration is recommended, you can also deploy manually using the Railway CLI:

### Install Railway CLI

```bash
npm install -g @railway/cli
```

### Login to Railway

```bash
railway login
```

### Link to Your Project

```bash
railway link
```

### Deploy Manually

```bash
railway up
```

This will deploy the current state of your local repository to Railway.

---

**For support:** Visit the [Railway Discord](https://discord.gg/railway) or check the [documentation](https://docs.railway.app).
