# Quick Fix: Vercel Deployment Issues

## Why Two .env Files?

**Short Answer: Yes, you need both. They serve different purposes.**

### Frontend .env (Root Directory)

- **Location**: `.env` in project root (where Vite is)
- **Purpose**: Client-side configuration
- **Variables**: Must start with `VITE_` prefix
- **Example**: `VITE_API_URL`, `VITE_OPENAI_API_KEY`
- **Security**: These variables are **baked into the browser bundle** - anyone can see them in DevTools
- **Usage**: Frontend code (React components, API client)

### Backend .env (backend/.env)

- **Location**: `backend/.env` (where Express.js runs)
- **Purpose**: Server-side configuration
- **Variables**: No prefix required
- **Example**: `DATABASE_URL`, `JWT_SECRET`, `PORT`
- **Security**: These variables are **NEVER exposed to browser** - server secrets only
- **Usage**: Backend code (Express routes, Prisma, auth)

### Why Can't We Consolidate?

1. **Different Runtimes**: Frontend runs in browser, backend runs in Node.js
2. **Security Risk**: Backend secrets (DATABASE_URL, JWT_SECRET) must NEVER be in frontend code
3. **Build Process**: Vite bundles frontend with `VITE_` variables at build time
4. **Deployment**: Frontend and backend are deployed separately to different environments

## Your Current Issue

### Problem

Frontend is trying to connect to `localhost:3001` instead of your deployed backend.

### Root Cause

`VITE_API_URL` is not set in Vercel environment variables, so it defaults to `localhost:3001`.

### Quick Fix (5 Minutes)

#### Step 1: Deploy Backend (if not already done)

```bash
# Option A: Deploy to Vercel
cd backend
vercel login
vercel

# Option B: Deploy to Railway (easier)
# Go to railway.app → New Project → Deploy from GitHub
# Select backend directory
# Add DATABASE_URL (from Vercel Postgres)
# Add JWT_SECRET (generate: openssl rand -base64 32)
```

#### Step 2: Get Backend URL

After deployment, you'll get a URL like:

- Vercel: `https://souschefy-backend-abc123.vercel.app`
- Railway: `https://souschefy-backend.up.railway.app`

**Copy this URL!**

#### Step 3: Set VITE_API_URL in Vercel

1. Go to [vercel.com](https://vercel.com)
2. Select your frontend project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Name: `VITE_API_URL`
6. Value: `https://your-backend-url.vercel.app` (paste from Step 2)
7. **Important**: No trailing slash!
8. Click **Save**

#### Step 4: Redeploy Frontend

1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Wait for deployment to complete

#### Step 5: Test

1. Open your frontend URL
2. Try to sign up
3. Should work now! ✅

## About the 401 Error on manifest.json

### What It Means

The browser is trying to fetch `manifest.json` but getting "Unauthorized" (401).

### Why This Happens

This is likely a **red herring** caused by:

- Browser trying to fetch from wrong URL (maybe cached?)
- Or some authentication interceptor interfering

### The Real Issue

The **main problem** is still `localhost:3001` connection refused. Once you fix `VITE_API_URL`, the 401 error should disappear.

### If 401 Persists After Fix

Try these steps:

1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
2. Open DevTools → Application → Clear storage
3. Try in Incognito/Private window
4. Check that `manifest.json` exists in `public/` directory

## Complete Environment Variables Setup

### Frontend (Vercel Project Settings)

```
VITE_API_URL=https://your-backend-url.vercel.app
VITE_OPENAI_API_KEY=sk-your-openai-key-here
```

### Backend (Vercel/Railway/Render Project Settings)

```
DATABASE_URL=postgres://user:pass@host:5432/dbname
JWT_SECRET=generate-with-openssl-rand-base64-32
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-url.vercel.app
```

## Local Development Setup

### Root .env (for frontend)

```bash
VITE_API_URL=http://localhost:3001
VITE_OPENAI_API_KEY=your-openai-key
```

### backend/.env (for backend)

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/souschefy
JWT_SECRET=any-random-string-for-local-dev
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8080
```

## Verification Checklist

- [ ] Backend deployed and accessible
- [ ] Backend URL copied
- [ ] `VITE_API_URL` set in Vercel frontend project
- [ ] Frontend redeployed
- [ ] Can sign up successfully
- [ ] Can create shopping lists
- [ ] Data persists in database

## Still Having Issues?

1. **Check Vercel logs**: Deployments → Click on deployment → View Logs
2. **Check backend logs**: Make sure backend is running without errors
3. **Test backend directly**: Visit `https://your-backend-url.vercel.app/health`
4. **Verify environment variables**: Make sure no typos in variable names
5. **Check CORS**: Backend `FRONTEND_URL` should match your frontend URL

## Need Help?

Check the full deployment guide: [`DEPLOYMENT.md`](DEPLOYMENT.md)
