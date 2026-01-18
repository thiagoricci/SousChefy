# SousChefy - Vercel Deployment Guide

This guide will help you deploy SousChefy to Vercel with PostgreSQL database.

## Architecture Overview

SousChefy consists of two parts:

- **Frontend**: React application (root directory)
- **Backend**: Express.js API with Prisma ORM (`backend/` directory)

## Prerequisites

- Vercel account (free tier works)
- GitHub account (for Vercel integration)
- OpenAI API key (for ChefAI)

## Step 1: Set Up Vercel Postgres Database

1. Go to [vercel.com](https://vercel.com) and sign in
2. Create a new project or select existing project
3. Go to **Storage** tab in project settings
4. Click **Create Database** → **Postgres**
5. Choose a region (select one closest to your users)
6. Click **Create**

After creation, you'll see:

- **DATABASE_URL**: Connection string for your database
- **POSTGRES_URL**: Alternative connection string
- **POSTGRES_PRISMA_URL**: Prisma-specific connection string

Copy the **DATABASE_URL** - you'll need it later.

## Step 2: Deploy Backend to Vercel

### Option A: Deploy Backend as Separate Vercel Project

1. Push your code to GitHub
2. Go to Vercel dashboard → **Add New Project**
3. Import your repository
4. In **Root Directory**, enter: `backend`
5. Configure environment variables:
   - `DATABASE_URL`: Paste from Step 1
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `NODE_ENV`: `production`

6. Click **Deploy**

After deployment, you'll get a URL like: `https://souschefy-backend-xyz.vercel.app`

**Important**: Copy this URL - you'll need it for frontend configuration.

### Option B: Deploy Backend to Railway/Render (Alternative)

If you prefer not to use Vercel for backend:

**Railway:**

1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub repo
3. Select `backend/` directory
4. Add environment variables:
   - `DATABASE_URL`: From Vercel Postgres
   - `JWT_SECRET`: Generate with `openssl rand -base64 32`
   - `NODE_ENV`: `production`
5. Deploy

**Render:**

1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Build command: `npm run build`
5. Start command: `npm start`
6. Add environment variables (same as Railway)
7. Deploy

## Step 3: Run Database Migrations

After backend is deployed, you need to run Prisma migrations:

### If Backend is on Vercel:

1. Go to your backend project on Vercel
2. Go to **Settings** → **Environment Variables**
3. Add `DATABASE_URL` (if not already added)
4. Go to **Deployments** tab
5. Click on the latest deployment
6. Click **View Logs**
7. Run migration command locally:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
   This will use your DATABASE_URL from `.env`

### Alternative: Use Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Pull environment variables
cd backend
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Optional: Run seed
npx prisma db seed
```

## Step 4: Deploy Frontend to Vercel

1. Go to Vercel dashboard → **Add New Project**
2. Import your repository (same repo as backend)
3. Leave **Root Directory** empty (defaults to root)
4. Configure environment variables:
   - `VITE_API_URL`: Your backend URL from Step 2
     - Example: `https://souschefy-backend-xyz.vercel.app`
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key

5. Click **Deploy**

After deployment, you'll get your frontend URL like: `https://souschefy.vercel.app`

## Step 5: Verify Deployment

1. Open your frontend URL
2. Try to sign up for a new account
3. Check that you can create shopping lists
4. Test ChefAI functionality (requires OpenAI API key)
5. Verify data persists in database

## Troubleshooting

### Issue: "Failed to load resource: server responded with a status of 404"

**Cause**: Frontend is trying to connect to `localhost:3001` instead of deployed backend.

**Solution**:

1. Check that `VITE_API_URL` is set in Vercel project settings
2. Verify the URL is correct (no trailing slashes)
3. Redeploy frontend after adding environment variable

### Issue: "net::ERR_CONNECTION_REFUSED"

**Cause**: Backend is not running or URL is incorrect.

**Solution**:

1. Verify backend is deployed and accessible
2. Check backend logs for errors
3. Ensure `VITE_API_URL` points to correct backend URL

### Issue: "Error while trying to use the following icon from Manifest"

**Cause**: PWA icon files are missing or incorrect paths.

**Solution**:

1. Check that `public/manifest.json` exists
2. Verify icon files exist in `public/` directory
3. Update manifest.json with correct icon paths

### Issue: Database connection errors

**Cause**: `DATABASE_URL` is incorrect or database is not accessible.

**Solution**:

1. Verify `DATABASE_URL` is set in backend environment variables
2. Check Vercel Postgres is running
3. Test connection locally:
   ```bash
   cd backend
   npx prisma db pull
   ```

### Issue: Prisma migration fails

**Cause**: Database schema is out of sync.

**Solution**:

1. Reset database (WARNING: deletes all data):
   ```bash
   cd backend
   npx prisma migrate reset
   ```
2. Or create a new migration:
   ```bash
   npx prisma migrate dev --name init
   ```

## Environment Variables Reference

### Frontend (Vite)

| Variable              | Description               | Example                                |
| --------------------- | ------------------------- | -------------------------------------- |
| `VITE_API_URL`        | Backend API URL           | `https://souschefy-backend.vercel.app` |
| `VITE_OPENAI_API_KEY` | OpenAI API key for ChefAI | `sk-...`                               |

### Backend (Express)

| Variable       | Description                  | Example                |
| -------------- | ---------------------------- | ---------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://...`       |
| `JWT_SECRET`   | Secret for JWT tokens        | `random-base64-string` |
| `NODE_ENV`     | Environment                  | `production`           |

## Local Development Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Set up local PostgreSQL database:

   ```bash
   # Using Docker
   docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=souschefy -p 5432:5432 -d postgres

   # Or use local PostgreSQL installation
   ```

3. Update `.env` with local database URL:

   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/souschefy
   ```

4. Run migrations:

   ```bash
   cd backend
   npx prisma migrate dev
   ```

5. Start backend:

   ```bash
   cd backend
   npm run dev
   ```

6. Start frontend (in new terminal):
   ```bash
   npm run dev
   ```

## Production Checklist

- [ ] Vercel Postgres database created
- [ ] Backend deployed to Vercel/Railway/Render
- [ ] Database migrations run on production database
- [ ] Frontend deployed to Vercel
- [ ] `VITE_API_URL` set to backend URL
- [ ] `VITE_OPENAI_API_KEY` set (for ChefAI)
- [ ] `DATABASE_URL` set in backend environment
- [ ] `JWT_SECRET` set in backend environment
- [ ] Test sign up/login flow
- [ ] Test shopping list creation
- [ ] Test ChefAI functionality
- [ ] Verify data persistence

## Additional Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/vercel)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## Support

If you encounter issues not covered in this guide:

1. Check Vercel deployment logs
2. Check backend logs for errors
3. Verify all environment variables are set
4. Test locally with same configuration
5. Check Prisma schema matches database
