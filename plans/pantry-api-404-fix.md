# Pantry API 404 Error Fix

## Problem

The PantryTab component was encountering a 404 error when trying to access the pantry API endpoint:

```
GET http://localhost:3001/api/pantry 404 (Not Found)
```

## Root Cause

The pantry router was registered in the Vercel deployment configuration ([`backend/api/index.ts`](backend/api/index.ts:42)), but was **missing** from the local development server files:

- [`backend/src/index.js`](backend/src/index.js:35-38) - Missing pantry router import and registration
- [`backend/src/local-server.ts`](backend/src/local-server.ts:35-38) - Missing pantry router import and registration

This caused the pantry API endpoints to be unavailable when running the backend locally on port 3001.

## Solution

Added the pantry router to both local development server files:

### Changes to [`backend/src/index.js`](backend/src/index.js)

1. **Import pantry router** (line 8):

   ```javascript
   import pantryRouter from "./routes/pantry";
   ```

2. **Register pantry route** (line 39):
   ```javascript
   app.use("/api/pantry", pantryRouter);
   ```

### Changes to [`backend/src/local-server.ts`](backend/src/local-server.ts)

1. **Import pantry router** (line 8):

   ```typescript
   import pantryRouter from "./routes/pantry";
   ```

2. **Register pantry route** (line 39):
   ```typescript
   app.use("/api/pantry", pantryRouter);
   ```

## Files Modified

- [`backend/src/index.js`](backend/src/index.js)
- [`backend/src/local-server.ts`](backend/src/local-server.ts)

## Testing Instructions

To verify the fix resolves the 404 error:

1. **Restart the backend server**:

   ```bash
   cd backend
   npm run dev
   ```

2. **Verify the pantry endpoint is available**:
   - Navigate to `http://localhost:3001/health` to confirm the server is running
   - Test the pantry endpoint with curl or Postman:
     ```bash
     curl http://localhost:3001/api/pantry
     ```
   - You should receive a JSON response (empty array if no pantry items exist, or 401 if not authenticated)

3. **Test in the frontend**:
   - Start the frontend dev server: `npm run dev`
   - Navigate to the Pantry tab in the application
   - The pantry items should load without errors
   - You should be able to add, update, and delete pantry items

## Verification

After restarting the backend server, the following pantry API endpoints should be available:

- `GET /api/pantry` - Get all pantry items for authenticated user
- `POST /api/pantry` - Add new pantry item
- `PUT /api/pantry/:id` - Update pantry item
- `DELETE /api/pantry/:id` - Delete specific pantry item
- `DELETE /api/pantry` - Clear all pantry items

## Related Files

- [`backend/src/routes/pantry.ts`](backend/src/routes/pantry.ts) - Pantry route handlers
- [`src/lib/pantry-api.ts`](src/lib/pantry-api.ts) - Frontend API client
- [`src/components/PantryTab.tsx`](src/components/PantryTab.tsx) - Pantry UI component
