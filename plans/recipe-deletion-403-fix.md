# Recipe Deletion 403 Forbidden Error - Fix Plan

## Problem Summary

Users can delete recipes from the frontend (UI and localStorage), but the backend API deletion fails with a **403 Forbidden** error. This causes recipes to remain in the database even after they appear deleted in the app.

## Root Cause Analysis

### 1. Token Key Inconsistency (Primary Issue)

**Issue**: Different parts of the codebase use different localStorage keys for the authentication token:

| File                                 | Token Key Used               | Line          |
| ------------------------------------ | ---------------------------- | ------------- |
| `src/contexts/AuthContext.tsx`       | `'voice-shopper-auth-token'` | 15, 30, 36    |
| `src/lib/api.ts` (axios interceptor) | `'voice-shopper-auth-token'` | 14            |
| `src/lib/storage.ts`                 | `'grocerli-auth-token'`      | 9, 49, 56, 63 |

**Impact**:

- When user logs in via `AuthContext`, token is saved to `'voice-shopper-auth-token'`
- When `api.ts` interceptor makes requests, it reads from `'voice-shopper-auth-token'` ✓
- When `storage.ts` functions are called, they read from `'grocerli-auth-token'` ✗
- This inconsistency can cause authentication failures in some scenarios

### 2. Potential Authentication Scenarios

The 403 error indicates one of these scenarios:

**Scenario A: User Not Authenticated**

- No valid token in localStorage
- Backend receives request without Authorization header
- **Expected**: 401 Unauthorized (not 403)

**Scenario B: Token Expired/Invalid**

- Token exists but JWT verification fails
- Backend rejects the token
- **Expected**: 401 Unauthorized (not 403)

**Scenario C: Recipe Ownership Mismatch** (Most Likely)

- User is authenticated with valid token
- Recipe exists in database
- But `recipe.userId !== req.user.id`
- **Expected**: 403 Forbidden ✓

**Scenario D: User Switched Accounts**

- User logged out and logged in with different account
- Recipes from previous account still in localStorage
- New user tries to delete old user's recipes
- **Expected**: 403 Forbidden ✓

**Scenario E: Recipes Created Before Auth**

- Recipes were created before authentication was implemented
- Recipes might not have proper userId or belong to different user
- **Expected**: 403 Forbidden ✓

### 3. Current Error Handling Issues

**In GroceryApp.tsx (lines 793-809)**:

```typescript
const handleDeleteRecipe = useCallback(
  async (recipeId: string) => {
    try {
      await recipesApi.delete(recipeId);
    } catch (error: any) {
      console.error("Failed to delete recipe from database:", error);
      // Don't show error toast - recipe might only exist in localStorage
    }

    // Always update local state and localStorage
    setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    toast({
      title: "Recipe Deleted",
      description: "Recipe has been removed from your saved recipes.",
    });
  },
  [toast],
);
```

**Problems**:

1. No user feedback when backend deletion fails
2. Silent failure - user sees success message but recipe remains in database
3. No distinction between different error types (auth, ownership, network)
4. No attempt to recover or provide helpful information

## Solution Plan

### Phase 1: Fix Token Key Inconsistency

**Objective**: Standardize authentication token storage across entire codebase

**Changes Required**:

1. **Update `src/lib/storage.ts`** (lines 9, 49, 56, 63):

   ```typescript
   const STORAGE_KEYS = {
     CURRENT_LIST: "grocerli-current-list",
     HISTORY: "grocerli-history",
     SAVED_RECIPES: "grocerli-saved-recipes",
     AUTH_TOKEN: "voice-shopper-auth-token", // Changed from 'grocerli-auth-token'
   } as const;
   ```

2. **Create centralized token utility** in `src/lib/storage.ts`:

   ```typescript
   // Export token functions that match AuthContext usage
   export const getAuthToken = (): string | null => {
     return localStorage.getItem("voice-shopper-auth-token");
   };

   export const setAuthToken = (token: string): void => {
     localStorage.setItem("voice-shopper-auth-token", token);
   };

   export const clearAuthToken = (): void => {
     localStorage.removeItem("voice-shopper-auth-token");
   };
   ```

3. **Update AuthContext to use centralized token utilities**:

   ```typescript
   import { setAuthToken, clearAuthToken } from "@/lib/storage";

   const login = async (credentials: LoginCredentials) => {
     const response = await authApi.login(credentials);
     setAuthToken(response.token); // Use centralized function
     setUser(response.user);
   };

   const logout = () => {
     clearAuthToken(); // Use centralized function
     setUser(null);
   };
   ```

### Phase 2: Improve Error Handling

**Objective**: Provide clear user feedback and handle different error scenarios

**Changes Required**:

1. **Update `GroceryApp.tsx` handleDeleteRecipe**:

   ```typescript
   const handleDeleteRecipe = useCallback(
     async (recipeId: string) => {
       // Check if user is authenticated
       if (!user) {
         toast({
           title: "Authentication Required",
           description: "Please log in to delete recipes from the database.",
           variant: "destructive",
         });
         // Still delete from localStorage
         setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
         return;
       }

       try {
         await recipesApi.delete(recipeId);
         // Success - update local state
         setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
         toast({
           title: "Recipe Deleted",
           description: "Recipe has been removed from your saved recipes.",
         });
       } catch (error: any) {
         console.error("Failed to delete recipe from database:", error);

         // Handle different error types
         if (error.response?.status === 403) {
           toast({
             title: "Access Denied",
             description:
               "You don't have permission to delete this recipe. It may belong to another account.",
             variant: "destructive",
           });
         } else if (error.response?.status === 401) {
           toast({
             title: "Authentication Failed",
             description: "Your session has expired. Please log in again.",
             variant: "destructive",
           });
           // Redirect to login
           setTimeout(() => {
             window.location.href = "/login";
           }, 2000);
         } else if (error.response?.status === 404) {
           toast({
             title: "Recipe Not Found",
             description: "This recipe may have already been deleted.",
             variant: "destructive",
           });
         } else {
           toast({
             title: "Delete Failed",
             description:
               "Failed to delete recipe from database. Please try again.",
             variant: "destructive",
           });
         }

         // Still delete from localStorage as fallback
         setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
       }
     },
     [toast, user],
   );
   ```

2. **Update `GroceryApp.tsx` handleDeleteList** (similar improvements):

   ```typescript
   const deleteList = useCallback(
     async (listId: string) => {
       if (!user) {
         toast({
           title: "Authentication Required",
           description: "Please log in to delete lists from the database.",
           variant: "destructive",
         });
         setHistory((prev) => prev.filter((list) => list.id !== listId));
         return;
       }

       try {
         await listsApi.delete(listId);
         setHistory((prev) => prev.filter((list) => list.id !== listId));
         toast({
           title: "List Deleted",
           description: "Shopping list has been removed from history.",
         });
       } catch (error: any) {
         console.error("Failed to delete list from database:", error);

         if (error.response?.status === 403) {
           toast({
             title: "Access Denied",
             description: "You don't have permission to delete this list.",
             variant: "destructive",
           });
         } else if (error.response?.status === 401) {
           toast({
             title: "Authentication Failed",
             description: "Your session has expired. Please log in again.",
             variant: "destructive",
           });
           setTimeout(() => {
             window.location.href = "/login";
           }, 2000);
         } else {
           toast({
             title: "Delete Failed",
             description:
               "Failed to delete list from database. Please try again.",
             variant: "destructive",
           });
         }

         setHistory((prev) => prev.filter((list) => list.id !== listId));
       }
     },
     [editingListId, toast, user],
   );
   ```

3. **Add authentication check to GroceryApp**:
   ```typescript
   // Add this near the top of GroceryApp component
   useEffect(() => {
     if (!user && !isLoading) {
       // Optional: Show warning or redirect
       console.warn("User not authenticated - some features may not work");
     }
   }, [user, isLoading]);
   ```

### Phase 3: Backend Improvements (Optional)

**Objective**: Provide more detailed error messages from backend

**Changes Required**:

1. **Update `backend/src/routes/recipes.ts`** delete endpoint:

   ```typescript
   router.delete("/:id", authenticate, async (req: any, res: any) => {
     try {
       const { id } = req.params;

       const existing = await req.prisma.recipe.findUnique({
         where: { id },
       });

       if (!existing) {
         return res.status(404).json({ error: "Recipe not found" });
       }

       if (existing.userId !== req.user!.id) {
         return res.status(403).json({
           error: "Not authorized",
           details: "You do not have permission to delete this recipe",
         });
       }

       await req.prisma.recipe.delete({
         where: { id },
       });

       res.status(204).send();
     } catch (error) {
       console.error("Error deleting recipe:", error);
       res.status(500).json({ error: "Failed to delete recipe" });
     }
   });
   ```

### Phase 4: Testing & Validation

**Test Cases**:

1. **Test 1: Delete recipe while authenticated**
   - Expected: Recipe deleted from both frontend and database
   - Verify: Check database to confirm deletion

2. **Test 2: Delete recipe while not authenticated**
   - Expected: Show "Authentication Required" toast
   - Verify: Recipe removed from localStorage only

3. **Test 3: Delete recipe from different account**
   - Expected: Show "Access Denied" toast
   - Verify: Recipe removed from localStorage only

4. **Test 4: Delete recipe with expired token**
   - Expected: Show "Authentication Failed" toast and redirect to login
   - Verify: Recipe removed from localStorage only

5. **Test 5: Delete non-existent recipe**
   - Expected: Show "Recipe Not Found" toast
   - Verify: Recipe removed from localStorage only

## Implementation Order

1. **Phase 1**: Fix token key inconsistency (CRITICAL - addresses root cause)
2. **Phase 2**: Improve error handling (HIGH - provides user feedback)
3. **Phase 3**: Backend improvements (MEDIUM - nice to have)
4. **Phase 4**: Testing (REQUIRED - validate fixes)

## Success Criteria

- ✅ All parts of codebase use the same token key
- ✅ Users see clear error messages when deletion fails
- ✅ Users are redirected to login when authentication expires
- ✅ Recipes are successfully deleted from database when user is authenticated
- ✅ LocalStorage deletion still works as fallback for offline/unauthenticated users

## Risk Assessment

**Low Risk**:

- Token key changes are straightforward
- Error handling improvements don't change core functionality

**Medium Risk**:

- Need to test thoroughly to ensure no regressions
- Need to verify existing tokens still work after key change

**Mitigation**:

- Implement gradually and test at each phase
- Keep localStorage deletion as fallback
- Provide clear user feedback for all error scenarios
