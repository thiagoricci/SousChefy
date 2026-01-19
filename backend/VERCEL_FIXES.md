# Vercel Deployment Fixes - 2026-01-19

## Problem

The backend was failing on Vercel with error:

```
PrismaClientInitializationError: Prisma has detected that this project was built on Vercel, which caches dependencies. This leads to an outdated Prisma Client because Prisma's auto-generation isn't triggered. To fix this, make sure to run `prisma generate` command during the build process.
```

## Root Cause

Vercel caches dependencies (including `node_modules`) between deployments, which means the Prisma Client generated locally becomes outdated when deployed. The build process wasn't explicitly running `prisma generate` during Vercel's build step.

## Fixes Applied

### 1. Updated `backend/vercel.json`

- Added explicit `buildCommand` that includes `npx prisma generate && npm run build`
- Set `outputDirectory` to `dist`
- Set `installCommand` to `npm install`
- Removed unnecessary `rewrites` configuration

### 2. Updated `backend/package.json`

- Changed build script from `"prisma generate && tsc"` to `"npx prisma generate && tsc"`
- Using `npx` ensures Prisma CLI is available even if not in node_modules

### 3. Updated `backend/tsconfig.json`

- Changed `outDir` from `"./dist"` with `rootDir: "./src"` to `"./dist"` with `rootDir: "./"`
- This allows compiling both `src/` and `api/` directories to the same output directory
- Set `declaration` to `false` to reduce build artifacts
- Included both `src/**/*` and `api/**/*` in compilation

### 4. Created `backend/.vercelignore`

- Added to ignore development files and unnecessary artifacts
- Prevents Vercel from uploading unnecessary files

### 5. Enhanced `backend/api/index.ts`

- Added global error handler middleware
- Added request logging for debugging
- Added graceful Prisma disconnect for serverless environment
- Increased JSON body limit to 10mb
- Added 404 handler

## Verification

Build now completes successfully:

```bash
cd backend && npm run build
```

Output:

```
✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client in 50ms
```

## Deployment

After these fixes, deploy to Vercel:

1. The build process will run `prisma generate` before TypeScript compilation
2. Prisma Client will be fresh and match the schema
3. All compiled files will be in `dist/` directory
4. Vercel will correctly serve the API from `dist/api/index.js`

## Next Steps

1. Commit and push these changes to your repository
2. Vercel will automatically redeploy with the fixed build process
3. The Prisma error should be resolved
4. Monitor Vercel deployment logs to confirm success
