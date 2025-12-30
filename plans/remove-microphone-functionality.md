# Remove Microphone Functionality

## Overview

Remove the microphone/voice recognition functionality from Voice Shopper while preserving the text input option. The user will implement microphone functionality later.

## Changes Required

### 1. Remove Microphone Button from Input Field

**File**: `src/components/GroceryApp.tsx`
**Lines**: 569-595

Remove the microphone button that appears inside the input field:

- Remove the `<button>` element with `handleMicToggle` click handler
- Remove the `<Mic />` icon component
- Update the input field to not have `pr-12` padding (no longer needed for button space)

### 2. Remove Microphone-Related State

**File**: `src/components/GroceryApp.tsx`

Remove these state variables:

- `isListening` (line 24)
- `accumulatedTranscript` (line 32)
- `debouncedTranscript` (line 35)

### 3. Remove Microphone Handlers

**File**: `src/components/GroceryApp.tsx`

Remove these functions:

- `handleStartListening` (lines 111-124)
- `handleStopListening` (lines 126-130)
- `handleMicToggle` (lines 132-138)

### 4. Remove Speech Recognition Hook Usage

**File**: `src/components/GroceryApp.tsx`

Remove:

- `useSpeechRecognition` import (line 9)
- `speechRecognition` hook initialization (lines 69-109)
- Effect that processes debounced transcript (lines 345-350)

### 5. Remove Unused Imports

**File**: `src/components/GroceryApp.tsx`

Remove these imports:

- `useSpeechRecognition` from '@/hooks/useSpeechRecognition' (line 9)
- `useDebounce` from '@/hooks/use-debounce' (line 11)
- `Mic` from 'lucide-react' (line 6)

### 6. Update Input Placeholder

**File**: `src/components/GroceryApp.tsx`
**Line**: 573

Update placeholder from:

```tsx
placeholder = "Type or speak items...";
```

To:

```tsx
placeholder = "Type items...";
```

### 7. Clean Up Speech Recognition Callbacks

**File**: `src/components/GroceryApp.tsx`
**Lines**: 83-89

Remove the code that updates `textInput` and accumulates transcript from speech recognition:

```tsx
// Show live transcript in input field
setTextInput(transcript);

// Accumulate the transcript for processing
if (isFinal) {
  setAccumulatedTranscript((prev) => prev + " " + transcript.trim());
}
```

## What to Keep

✅ **Text Input Functionality**

- `textInput` state
- `handleTextInputSubmit` function
- `parseAndAddItems` function (still used for text input)

✅ **Shopping List Features**

- All list management (add, toggle, remove items)
- History management
- Shopping mode
- Progress tracking
- Celebration sounds

✅ **UI Components**

- Input field (without mic button)
- Shopping list display
- History tab
- All buttons and cards

## Testing Checklist

After implementation, verify:

- [ ] Text input field works correctly
- [ ] Pressing Enter submits items
- [ ] Items are added to the list
- [ ] Items can be toggled as completed
- [ ] Items can be removed
- [ ] List can be saved to history
- [ ] History can be loaded
- [ ] Shopping mode works
- [ ] Progress tracking works
- [ ] Celebration sound plays when list is complete
- [ ] No microphone-related errors in console
- [ ] App loads without errors

## Files Modified

1. `src/components/GroceryApp.tsx` - Main component with microphone removal

## Files Unchanged

- `src/components/ShoppingList.tsx`
- `src/components/HistoryTab.tsx`
- `src/data/groceryItems.ts`
- `src/lib/storage.ts`
- `src/lib/utils.ts`
- All UI components in `src/components/ui/`
- `src/hooks/useSpeechRecognition.ts` (can be kept for future use)

## Notes

- The `useSpeechRecognition.ts` hook file can be kept in the codebase for future implementation
- The `useDebounce` hook can also be kept as it may be useful for other features
- All text input parsing logic (`parseAndAddItems`, `extractQuantity`) remains intact
- The app will function as a text-only grocery list application
