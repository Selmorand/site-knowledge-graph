# Railway Deployment Guide

## Prerequisites
- Railway account (sign up at https://railway.app)
- GitHub account (for connecting your repository)

## Step 1: Push to GitHub
```bash
git add .
git commit -m "Initial commit - ready for deployment"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 2: Create Railway Project
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Railway will detect the configuration automatically

## Step 3: Add PostgreSQL Database
1. In your Railway project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically set the `DATABASE_URL` environment variable

## Step 4: Add Redis
1. Click "+ New" again
2. Select "Database" → "Add Redis"
3. Railway will automatically set `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD`

## Step 5: Configure Environment Variables
In your Railway project settings, add:
- `NODE_ENV` = `production`
- `LOG_LEVEL` = `info`
- `API_SECRET` = (generate a random secure string)
- `PORT` = `3000` (or Railway's default)

## Step 6: Run Database Migrations
1. In Railway project settings, go to "Deployments"
2. Click on the latest deployment
3. Open the deployment shell
4. Run: `npx prisma migrate deploy`
5. Run: `npx prisma generate`

## Step 7: Access Your Application
Railway will provide a public URL like:
`https://your-app-name.up.railway.app`

## Troubleshooting
- Check logs in Railway dashboard
- Ensure all environment variables are set
- Verify Playwright is installed (nixpacks.toml handles this)
