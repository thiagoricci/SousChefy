# Microphone Stop/Start Fix Plan

## Problem Analysis

When user clicks "Stop Adding", the microphone should shut off completely and stop listening. When user clicks "Start Shopping", the microphone should activate and start listening again.

### Current Issue

There's a race condition in the current implementation:

1. **Stop Adding Flow** (`handleStopAddingItems`):

   - Calls `addItemsRecognition.stopListening()` multiple times
   - Sets mode to 'idle'
   - Clears accumulated transcript

2. **Start Shopping Flow** (`handleStartShopping`):

   - Calls `shoppingRecognition.startListening()` after 100ms delay
   - Sets mode to 'shopping'

3. **The Problem**:
   - The `useSpeechRecognition` hook has an `audioend` event handler that automatically restarts recognition when `continuous` is true
   - When switching modes, the microphone may not be fully stopped before the new recognition starts
   - The `audioend` handler checks `isListening` which might still be true during the transition
   - This causes the microphone to stay on or restart unexpectedly

## Solution

### 1. Add Transition State

Add a new state variable to track when we're in transition between modes:

```typescript
const [isTransitioning, setIsTransitioning] = useState(false);
```

This will prevent any microphone restarts during mode transitions.

### 2. Update handleStopAddingItems

Ensure complete microphone shutdown:

```typescript
const handleStopAddingItems = () => {
  if (isButtonDisabled || isTransitioning) return;

  setIsTransitioning(true); // Start transition

  // Clear auto-stop timeout
  if (autoStopTimeoutRef) {
    clearTimeout(autoStopTimeoutRef);
    setAutoStopTimeoutRef(null);
  }

  // Immediately stop the recognition with multiple fallback methods
  addItemsRecognition.stopListening();
  setIsButtonDisabled(true);

  // Force stop multiple times to ensure it actually stops
  setTimeout(() => addItemsRecognition.stopListening(), 25);
  setTimeout(() => addItemsRecognition.stopListening(), 50);
  setTimeout(() => addItemsRecognition.stopListening(), 75);
  setTimeout(() => addItemsRecognition.stopListening(), 100);
  setTimeout(() => addItemsRecognition.stopListening(), 150);
  setTimeout(() => addItemsRecognition.stopListening(), 200);
  setTimeout(() => addItemsRecognition.stopListening(), 300);

  // Then update the mode
  setMode("idle");

  // Clear any accumulated transcript to prevent further processing
  setAccumulatedTranscript("");

  // Also reset the recognition transcript
  addItemsRecognition.resetTranscript();

  // Auto-save the list to history when stopping adding items
  if (items.length > 0) {
    saveToListHistory();
  }

  // End transition after ensuring microphone is stopped
  setTimeout(() => {
    setIsTransitioning(false);
    setIsButtonDisabled(false);
  }, 500);
};
```

### 3. Update handleStartShopping

Wait for microphone to be fully stopped before starting:

```typescript
const handleStartShopping = () => {
  if (items.length === 0) {
    toast({
      title: "No Items",
      description: "Add some items to your list first!",
      variant: "destructive",
    });
    return;
  }

  if (!shoppingRecognition.isSupported) {
    toast({
      title: "Speech Recognition Not Supported",
      description: "Your browser doesn't support voice recognition.",
      variant: "destructive",
    });
    return;
  }

  // Prevent starting if already transitioning
  if (isTransitioning) return;

  setIsTransitioning(true); // Start transition

  // Stop any active recognition before starting new one
  if (mode === "adding") {
    addItemsRecognition.stopListening();
  }

  // Wait for microphone to be fully stopped before starting shopping
  setTimeout(() => {
    setMode("shopping");
    setHasStartedShopping(true);
    shoppingRecognition.resetTranscript();

    // Add another delay to ensure previous recognition is fully stopped
    setTimeout(() => {
      shoppingRecognition.startListening();
      setIsTransitioning(false); // End transition
    }, 100);
  }, 300); // Wait 300ms for microphone to fully stop
};
```

### 4. Update handleStopShopping

Ensure complete microphone shutdown:

```typescript
const handleStopShopping = () => {
  if (isTransitioning) return;

  setIsTransitioning(true); // Start transition

  // Stop the microphone immediately with multiple fallback methods
  shoppingRecognition.stopListening();
  setTimeout(() => shoppingRecognition.stopListening(), 25);
  setTimeout(() => shoppingRecognition.stopListening(), 50);
  setTimeout(() => shoppingRecognition.stopListening(), 75);
  setTimeout(() => shoppingRecognition.stopListening(), 100);
  setTimeout(() => shoppingRecognition.stopListening(), 150);
  setTimeout(() => shoppingRecognition.stopListening(), 200);
  setTimeout(() => shoppingRecognition.stopListening(), 300);

  // Update the state
  setMode("idle");
  setHasStartedShopping(false);

  // End transition after ensuring microphone is stopped
  setTimeout(() => {
    setIsTransitioning(false);
  }, 500);
};
```

### 5. Update useEffect for Mode Changes

Prevent microphone restarts during transitions:

```typescript
// Ensure microphones are stopped when mode changes to idle
useEffect(() => {
  if (mode === "idle" && !isTransitioning) {
    // Clear auto-stop timeout
    if (autoStopTimeoutRef) {
      clearTimeout(autoStopTimeoutRef);
      setAutoStopTimeoutRef(null);
    }

    // Stop any active recognition when mode becomes idle
    addItemsRecognition.stopListening();
    shoppingRecognition.stopListening();

    // Additional safety stops for mobile devices
    setTimeout(() => {
      addItemsRecognition.stopListening();
      shoppingRecognition.stopListening();
    }, 50);

    setTimeout(() => {
      addItemsRecognition.stopListening();
      shoppingRecognition.stopListening();
    }, 150);

    // Additional safety: clear any accumulated transcript when idle
    setAccumulatedTranscript("");
  }
}, [mode, autoStopTimeoutRef, isTransitioning]);
```

### 6. Update Button Handlers

Prevent button clicks during transitions:

```typescript
// In the Add Items button
<Button
  onClick={mode === 'adding' ? handleStopAddingItems : handleStartAddingItems}
  disabled={isButtonDisabled || isTransitioning}
  // ... rest of props
>

// In the Start Shopping button
<Button
  onClick={handleStartShopping}
  disabled={isTransitioning}
  // ... rest of props
>

// In the Stop Shopping button
<Button
  onClick={handleStopShopping}
  disabled={isTransitioning}
  // ... rest of props
>
```

## Implementation Steps

1. Add `isTransitioning` state variable to `GroceryApp.tsx`
2. Update `handleStopAddingItems` to use transition state
3. Update `handleStartShopping` to wait for microphone to stop
4. Update `handleStopShopping` to use transition state
5. Update mode change useEffect to check transition state
6. Update button disabled states to include transition check
7. Test the fix to ensure microphone properly stops and starts

## Expected Behavior

After implementing this fix:

1. **Stop Adding**: Clicking "Stop Adding" will immediately stop the microphone and prevent any restarts
2. **Start Shopping**: Clicking "Start Shopping" will wait for the microphone to be fully stopped before activating the shopping mode microphone
3. **Stop Shopping**: Clicking "Stop Shopping" will immediately stop the microphone and prevent any restarts
4. **No Race Conditions**: The transition state prevents any microphone restarts during mode switches

## Testing Checklist

- [ ] Click "Add Items" → speak → click "Stop Adding" → verify microphone stops
- [ ] Click "Add Items" → speak → click "Stop Adding" → click "Start Shopping" → verify microphone starts
- [ ] Click "Start Shopping" → speak item → click "Stop Shopping" → verify microphone stops
- [ ] Click "Start Shopping" → speak item → click "Stop Shopping" → click "Start Shopping" → verify microphone starts
- [ ] Test rapid mode switching to ensure no microphone conflicts
- [ ] Test on mobile devices to ensure proper behavior
