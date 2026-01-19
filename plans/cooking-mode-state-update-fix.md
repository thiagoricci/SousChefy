# Fix Cooking Mode State Update Warning

## Problem Description

When users complete all cooking steps, a React warning appears in the console:

```
Warning: Cannot update a component (`Toaster`) while rendering a different component (`CookingMode`).
To locate the bad setState() call inside `CookingMode`, follow the stack trace as described in https://reactjs.org/link/setstate-in-render
```

## Root Cause

The issue is in `src/components/CookingMode.tsx` where `onComplete()` is being called inside the `setCookingState` updater function. When `setCookingState` is called with an updater function, React executes that updater function during the render phase.

In `GroceryApp.tsx` (lines 1303-1309), the `onComplete` callback calls `toast()` which triggers a state update in the `Toaster` component. This creates a situation where React is trying to update `Toaster` while `CookingMode` is still rendering, which violates React's rendering rules.

### Problematic Code Locations

**CookingMode.tsx - Line 53-56 (handleNextStep):**

```typescript
// Check if all steps are complete
if (nextStep >= cookingState.recipe!.instructions.length) {
  onComplete(); // ❌ Called during render
  return prev;
}
```

**CookingMode.tsx - Line 100-106 (handleMarkComplete):**

```typescript
// Auto-advance if this is the last step
if (nextStep >= cookingState.recipe!.instructions.length) {
  onComplete(); // ❌ Called during render
  return {
    ...prev,
    completedSteps: newCompletedSteps,
  };
}
```

**GroceryApp.tsx - Line 1303-1309:**

```typescript
onComplete={() => {
  toast({  // ❌ Triggers Toaster state update
    title: "🎉 Recipe Complete!",
    description: "You've successfully completed cooking this recipe.",
  });
  setActiveView('home');
}}
```

## Solution

Move the `onComplete()` call outside of the state updater function and use `useEffect` to detect when all steps are complete. This ensures that `onComplete()` is called after the render phase is complete.

### Implementation Steps

1. **Add a ref to track completion status**
   - Add `completionProcessedRef` to track if completion has been handled
   - This prevents multiple calls to `onComplete()`

2. **Remove `onComplete()` calls from state updaters**
   - In `handleNextStep()`, remove the `onComplete()` call from the updater
   - In `handleMarkComplete()`, remove the `onComplete()` call from the updater
   - Let the state update complete normally

3. **Add `useEffect` to detect completion**
   - Monitor `cookingState.completedSteps.length` and `cookingState.recipe?.instructions.length`
   - When all steps are complete and not yet processed, call `onComplete()`
   - Update the ref to prevent duplicate calls

### Code Changes

**Before (Problematic):**

```typescript
const handleNextStep = useCallback(() => {
  if (!cookingState.recipe) return;

  setCookingState((prev) => {
    const newCompletedSteps = [...prev.completedSteps, prev.currentStep];
    const nextStep = prev.currentStep + 1;

    // Check if all steps are complete
    if (nextStep >= cookingState.recipe!.instructions.length) {
      onComplete(); // ❌ Called during render
      return prev;
    }

    return {
      ...prev,
      currentStep: nextStep,
      completedSteps: newCompletedSteps,
    };
  });
}, [cookingState.recipe, onComplete]);
```

**After (Fixed):**

```typescript
const completionProcessedRef = useRef(false);

const handleNextStep = useCallback(() => {
  if (!cookingState.recipe) return;

  setCookingState((prev) => {
    const newCompletedSteps = [...prev.completedSteps, prev.currentStep];
    const nextStep = prev.currentStep + 1;

    // Check if all steps are complete
    if (nextStep >= cookingState.recipe!.instructions.length) {
      // Don't call onComplete() here - let useEffect handle it
      return {
        ...prev,
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
      };
    }

    return {
      ...prev,
      currentStep: nextStep,
      completedSteps: newCompletedSteps,
    };
  });
}, [cookingState.recipe]);

// Add useEffect to detect completion
useEffect(() => {
  const allStepsCompleted =
    cookingState.recipe &&
    cookingState.completedSteps.length ===
      cookingState.recipe.instructions.length;

  if (allStepsCompleted && !completionProcessedRef.current) {
    completionProcessedRef.current = true;
    onComplete();
  }
}, [cookingState.completedSteps, cookingState.recipe, onComplete]);
```

### Benefits

1. **No React Warnings**: The fix eliminates the warning about updating components during render
2. **Follows React Best Practices**: State updates happen in the correct phase (after render, not during)
3. **Same User Experience**: The behavior remains identical from the user's perspective
4. **Cleaner Code**: Separates concerns - state updates happen in one place, side effects in another

## Testing Checklist

- [ ] Complete all cooking steps
- [ ] Verify no React warning appears in console
- [ ] Verify toast notification still appears
- [ ] Verify user is redirected to home view
- [ ] Test with recipes of different lengths (1 step, 5 steps, 10+ steps)
- [ ] Test marking steps complete in different orders
- [ ] Test using "Next Step" button
- [ ] Test using "Mark Complete" button

## Files to Modify

1. `src/components/CookingMode.tsx`
   - Add `completionProcessedRef`
   - Update `handleNextStep` to remove `onComplete()` from updater
   - Update `handleMarkComplete` to remove `onComplete()` from updater
   - Add `useEffect` to detect completion

## Related Files

- `src/components/GroceryApp.tsx` - Contains the `onComplete` callback (no changes needed)
- `src/hooks/use-toast.ts` - Toast implementation (no changes needed)
