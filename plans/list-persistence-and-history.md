# List Persistence and History Feature - Implementation Plan

## Overview

Add automatic list persistence and a history tab to Voice Shopper, allowing users to:

1. Automatically save the current list when clicking "Stop Adding"
2. Load the last active list when opening the app
3. Access a history tab to view and load previous shopping lists

## Current State Analysis

### Existing Features

- `history` state stores shopping lists in memory (line 20 in GroceryApp.tsx)
- `saveToListHistory()` function exists but is not called automatically (lines 749-757)
- `loadFromHistory()` function exists (lines 760-769)
- `clearHistory()` function exists (lines 772-778)
- History UI is displayed inline at the bottom of the page (lines 978-1014)

### Missing Features

1. **Auto-save on "Stop Adding"**: List is not automatically saved when user stops adding items
2. **localStorage persistence**: History is only stored in memory, lost on page refresh
3. **Load active list on app start**: App doesn't restore the last active list
4. **History tab UI**: History is shown inline, not in a separate tab

## Implementation Plan

### Phase 1: localStorage Persistence

#### 1.1 Create localStorage utility functions

**File**: `src/lib/storage.ts` (new file)

Create utility functions for localStorage operations:

- `saveCurrentList(items: ShoppingItem[])` - Save current active list
- `loadCurrentList()` - Load current active list
- `saveHistory(history: ShoppingItem[][])` - Save history to localStorage
- `loadHistory()` - Load history from localStorage
- `clearStorage()` - Clear all stored data

#### 1.2 Update GroceryApp.tsx to use localStorage

**File**: `src/components/GroceryApp.tsx`

Add `useEffect` hooks to:

- Load current list and history from localStorage on component mount
- Save current list to localStorage whenever items change
- Save history to localStorage whenever history changes

### Phase 2: Auto-save on "Stop Adding"

#### 2.1 Modify handleStopAddingItems function

**File**: `src/components/GroceryApp.tsx`

Update the `handleStopAddingItems` function (line 168) to:

- Automatically call `saveToListHistory()` when stopping
- Save the current list as the active list in localStorage
- Show a toast notification confirming the list was saved

### Phase 3: History Tab UI

#### 3.1 Create HistoryTab component

**File**: `src/components/HistoryTab.tsx` (new file)

Create a new component that displays:

- List of saved shopping lists with:
  - Item count
  - Date/time saved
  - Preview of first few items
- Load button for each list
- Delete button for individual lists
- Clear all history button
- Empty state when no history exists

#### 3.2 Add Tabs component to GroceryApp

**File**: `src/components/GroceryApp.tsx`

Add tab navigation to switch between:

- "Current List" tab (default) - shows the active shopping list
- "History" tab - shows saved lists

Use the existing `Tabs` component from shadcn/ui (`src/components/ui/tabs.tsx`)

#### 3.3 Update GroceryApp layout

**File**: `src/components/GroceryApp.tsx`

Restructure the UI to:

- Add tab navigation at the top (below the header)
- Move ShoppingList to the "Current List" tab
- Move HistoryTab to the "History" tab
- Keep the Add Items and Shopping buttons visible in both tabs

### Phase 4: Enhanced History Features

#### 4.1 Add list naming

**File**: `src/components/HistoryTab.tsx`

Allow users to:

- Name their lists when saving (optional)
- Edit list names
- Search/filter lists by name

#### 4.2 Add list preview

**File**: `src/components/HistoryTab.tsx`

Show a preview of items in each history entry:

- Display first 3-5 items
- Show "and X more" for longer lists
- Show item categories with emojis

#### 4.3 Add list merging

**File**: `src/components/GroceryApp.tsx`

Add functionality to:

- Merge a history list with the current list
- Avoid duplicates when merging
- Show toast notification with merge results

## Data Structure

### localStorage Keys

```typescript
const STORAGE_KEYS = {
  CURRENT_LIST: "voice-shopper-current-list",
  HISTORY: "voice-shopper-history",
} as const;
```

### History Entry Structure

```typescript
interface HistoryEntry {
  id: string;
  items: ShoppingItem[];
  name?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}
```

## UI/UX Considerations

### Tab Navigation

- Use shadcn/ui Tabs component
- Default to "Current List" tab
- Show badge on "History" tab with count of saved lists
- Smooth transitions between tabs

### History List Display

- Show most recent lists first
- Each list entry shows:
  - List name (if provided) or "Unnamed List"
  - Item count
  - Date/time saved
  - Preview of first few items
- Hover effects for better interactivity
- Load button on each entry
- Delete button on each entry

### Toast Notifications

- "List saved to history" when auto-saving
- "List loaded from history" when loading
- "History cleared" when clearing
- "List merged" when merging lists

### Empty States

- "No saved lists yet" when history is empty
- "Your shopping list is empty" when current list is empty
- Helpful prompts to guide users

## Technical Implementation Details

### localStorage Error Handling

- Wrap localStorage operations in try-catch blocks
- Handle cases where localStorage is disabled (private browsing)
- Gracefully degrade if storage fails

### Performance Optimizations

- Debounce localStorage writes to avoid excessive writes
- Limit history to 10-20 lists to prevent storage bloat
- Use JSON.stringify/parse for serialization

### Accessibility

- Ensure tab navigation is keyboard accessible
- Add ARIA labels to buttons
- Provide clear focus indicators
- Support screen readers

## Testing Checklist

- [ ] Current list loads on app start
- [ ] List auto-saves when clicking "Stop Adding"
- [ ] History persists across page refreshes
- [ ] History tab displays saved lists correctly
- [ ] Loading a list from history works
- [ ] Deleting individual lists works
- [ ] Clearing all history works
- [ ] Tab navigation works smoothly
- [ ] Toast notifications appear correctly
- [ ] Empty states display properly
- [ ] localStorage errors are handled gracefully
- [ ] Keyboard navigation works for tabs

## Migration Notes

- No breaking changes to existing functionality
- Existing history state will be migrated to localStorage on first load
- Users with existing in-memory history will not lose data

## Future Enhancements (Out of Scope)

- Cloud sync across devices
- List sharing/collaboration
- List templates
- Analytics on list usage
- Export/import lists
- List categories/tags
