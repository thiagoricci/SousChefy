# Service Worker Fix Plan

## Problem Analysis

### Error Message

```
content-scripts.js:1 Content Script Bridge: Sending response back to page context: {isAllowListed: false, isProtectionEnabled: true, isScamsProtectionEnabled: true}
index-O7MD16qp.js:375 SW registered: ServiceWorkerRegistration {installing: null, waiting: null, active: ServiceWorker, navigationPreload: NavigationPreloadManager, scope: 'https://sous-chefy.vercel.app/', …}
register:1
```

### Root Cause

**Duplicate Service Worker Registration**

The application has TWO mechanisms registering the Service Worker:

1. **Manual Registration** in `src/main.tsx` (lines 6-13):

   ```typescript
   if ("serviceWorker" in navigator && import.meta.env.PROD) {
     window.addEventListener("load", () => {
       navigator.serviceWorker
         .register("/sw.js")
         .then((registration) => {
           console.log("SW registered: ", registration);
         })
         .catch((registrationError) => {
           console.log("SW registration failed: ", registrationError);
         });
     });
   }
   ```

2. **Automatic Registration** by `vite-plugin-pwa`:
   - The plugin generates `dist/registerSW.js` automatically
   - This file is included in `dist/index.html` as:
     ```html
     <script id="vite-plugin-pwa:register-sw" src="/registerSW.js"></script>
     ```
   - The plugin configuration has `registerType: 'autoUpdate'` which enables automatic registration

### Impact

- **Duplicate Registration**: Service Worker is registered twice, which can cause conflicts
- **Console Noise**: Multiple log messages about Service Worker registration
- **Potential Issues**: Race conditions, cache conflicts, or unexpected behavior

### Note on Browser Extension Message

The first line in the error:

```
content-scripts.js:1 Content Script Bridge: Sending response back to page context: {isAllowListed: false, isProtectionEnabled: true, isScamsProtectionEnabled: true}
```

This is from a **browser extension** (likely a password manager or security extension) and is **NOT** related to the application. This is normal console noise and can be ignored.

## Solution

### Option 1: Remove Manual Registration (Recommended)

**Rationale**: The `vite-plugin-pwa` plugin provides a more robust and feature-rich registration mechanism with built-in update handling. Manual registration is redundant.

**Steps**:

1. **Remove manual Service Worker registration from `src/main.tsx`**
   - Delete lines 5-14 (the entire Service Worker registration block)
   - Keep only the React app initialization code

2. **Verify `vite.config.ts` configuration**
   - Ensure `registerType: 'autoUpdate'` is set (already configured)
   - Verify the plugin is properly configured

3. **Test locally**
   - Build the application: `npm run build`
   - Preview the build: `npm run preview`
   - Check browser console for Service Worker registration
   - Verify only one Service Worker is registered

4. **Deploy to production**
   - Deploy the updated build to Vercel
   - Verify Service Worker registers correctly on production
   - Test PWA functionality

**Expected Result**:

- Service Worker registers once via `registerSW.js`
- No duplicate registration messages
- PWA functionality works correctly
- Automatic updates handled by vite-plugin-pwa

### Option 2: Disable Automatic Registration (Alternative)

**Rationale**: Keep manual registration for more control, disable plugin's automatic registration.

**Steps**:

1. **Update `vite.config.ts`**
   - Set `registerType: 'prompt'` to disable automatic registration
   - Or use `registerType: 'none'` to disable registration entirely

2. **Keep manual registration in `src/main.tsx`**
   - No changes needed to existing manual registration code

3. **Test and deploy** (same as Option 1)

**Why Not Recommended**:

- Loses built-in update handling from vite-plugin-pwa
- Requires manual implementation of update prompts
- More maintenance overhead

## Implementation Steps (Option 1 - Recommended)

### Step 1: Update `src/main.tsx`

**Current Code**:

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered: ', registration);
    }).catch((registrationError) => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
```

**Updated Code**:

```typescript
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
```

### Step 2: Verify `vite.config.ts` (No Changes Needed)

The current configuration is correct:

```typescript
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
  manifest: {
    // ... manifest configuration
  },
  workbox: {
    // ... workbox configuration
  },
});
```

### Step 3: Test Locally

```bash
# Build the application
npm run build

# Preview the production build
npm run preview

# Open http://localhost:4173 in browser
# Check console for Service Worker registration
# Verify only one "SW registered" message appears
```

### Step 4: Deploy to Production

```bash
# Deploy to Vercel (if using Vercel CLI)
vercel --prod

# Or push to git and let Vercel auto-deploy
git add .
git commit -m "Fix duplicate Service Worker registration"
git push
```

### Step 5: Verify on Production

1. Open https://sous-chefy.vercel.app/
2. Open browser DevTools (F12)
3. Go to Console tab
4. Verify only one Service Worker registration message
5. Go to Application tab
6. Check Service Workers section
7. Verify only one Service Worker is registered

## Testing Checklist

### Before Fix

- [ ] Open browser console on deployed site
- [ ] Observe multiple Service Worker registration messages
- [ ] Check Application tab for duplicate Service Workers

### After Fix

- [ ] Rebuild and deploy application
- [ ] Open browser console on deployed site
- [ ] Verify only one Service Worker registration message
- [ ] Check Application tab for single Service Worker
- [ ] Test PWA installation (install prompt)
- [ ] Test offline functionality
- [ ] Verify app works correctly

## Additional Considerations

### Browser Extension Messages

The "Content Script Bridge" message is from a browser extension and is harmless. To reduce console noise:

1. **Identify the extension**: Check which extension is causing the message
2. **Disable extension temporarily**: Test without the extension
3. **Ignore the message**: It doesn't affect application functionality

### Service Worker Update Handling

With `registerType: 'autoUpdate'`, the vite-plugin-pwa plugin:

- Automatically checks for updates
- Downloads new Service Worker in background
- Activates new version when all tabs are closed
- Provides a smooth update experience

No additional code is needed for update handling.

### Cache Management

The current Workbox configuration:

- Precaches 24 entries (524.96 KiB)
- Caches PNG images with 30-day expiration
- Uses CacheFirst strategy for images
- Automatically handles cache updates

No changes needed to cache configuration.

## Expected Outcome

After implementing this fix:

✅ Service Worker registers once (no duplicates)
✅ Console shows only one registration message
✅ PWA functionality works correctly
✅ Automatic updates handled by vite-plugin-pwa
✅ No conflicts or race conditions
✅ Cleaner console output

## Rollback Plan

If issues occur after the fix:

1. **Revert `src/main.tsx`** to include manual registration
2. **Rebuild and redeploy** the application
3. **Verify** the issue is resolved

The manual registration code can be restored from git history if needed.

## Timeline

- **Step 1**: 5 minutes (update main.tsx)
- **Step 2**: 0 minutes (no changes needed)
- **Step 3**: 10 minutes (build and test locally)
- **Step 4**: 5 minutes (deploy to Vercel)
- **Step 5**: 5 minutes (verify on production)

**Total Estimated Time**: 25 minutes

## Summary

The root cause is duplicate Service Worker registration. The recommended solution is to remove the manual registration from `src/main.tsx` and rely on the automatic registration provided by `vite-plugin-pwa`. This will eliminate duplicate registrations, reduce console noise, and ensure proper PWA functionality.
