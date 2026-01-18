# Chat Dialog Redesign Plan

## Overview

Replace the unused ChefAI components with a new, enhanced ChatDialog that provides full chat functionality in a dialog-based interface.

## Current State Analysis

### Existing Components

1. **ChatDialog.tsx** - Simple button + dialog with basic input (no AI, no history)
2. **ChefAI/** directory - Complete chat system (not used in app):
   - ChefAI.tsx - Main component with toggle button
   - FloatingChat.tsx - Floating chat window with full functionality
   - ChatWindow.tsx - Alternative chat window
   - ChatToggleButton.tsx - Toggle button
   - MessageList.tsx - Message display
   - MessageItem.tsx - Individual message
   - MessageInput.tsx - Input with voice support
   - TypingIndicator.tsx - Loading indicator
   - QuickActions.tsx - Quick action buttons
   - ChatBubble.tsx - Message bubble component

### Supporting Files (KEEP)

- **src/lib/openai.ts** - Contains `askChefAI()` function with streaming and function calling
- **src/types/chefai.ts** - TypeScript types for chat (ChatMessage, ChefAIContext, etc.)

## Implementation Plan

### Phase 1: Remove Unused Components

Delete the entire `src/components/ChefAI/` directory (all 9 component files)

### Phase 2: Create New ChatDialog

Create enhanced `ChatDialog.tsx` with:

- **Button trigger**: Floating button (bottom-right) to open dialog
- **Dialog interface**: Uses shadcn/ui Dialog component
- **Message history**: Display conversation with user/assistant messages
- **AI integration**: Call `askChefAI()` with streaming responses
- **Function calling**: Handle `add_items_to_list` and `delete_items_from_list`
- **Voice input**: Web Speech API integration for dictation
- **Streaming responses**: Real-time text streaming as AI responds
- **Context awareness**: Pass shopping list, recipes, current tab, view mode
- **Error handling**: Toast notifications for errors
- **Loading states**: Typing indicator during AI responses

### Phase 3: Update GroceryApp

- Pass required props to ChatDialog:
  - `items` (shopping list)
  - `savedRecipes`
  - `activeView` (current tab)
  - `viewMode` (editing/shopping)
  - `onCreateList` callback for list updates

### Phase 4: Cleanup

- Remove any unused imports
- Verify no broken references
- Test all chat functionality

## New ChatDialog Component Structure

```typescript
interface ChatDialogProps {
  items: ShoppingItem[];
  savedRecipes: SavedRecipe[];
  activeView: ViewType;
  viewMode: 'editing' | 'shopping';
  onCreateList?: (items: ListCreationItem[], clearExisting?: boolean) => void;
}

// Component will include:
- useState for open/close dialog
- useState for messages array
- useState for typing indicator
- useState for voice listening state
- useState for transcript
- useRef for processing flag
- askChefAI() integration
- listsApi.addItemsToList() calls
- listsApi.deleteItemsFromList() calls
- MessageList rendering
- MessageInput with voice support
```

## Key Features to Implement

1. **Message History**
   - Scrollable message list
   - User messages (right-aligned)
   - Assistant messages (left-aligned)
   - Timestamps
   - Auto-scroll to bottom on new messages

2. **AI Integration**
   - Streaming responses (chunk by chunk)
   - Function calling for list operations
   - Context awareness (shopping list, recipes, current view)
   - Error handling with toasts

3. **Voice Input**
   - Web Speech API integration
   - Start/stop listening controls
   - Real-time transcript display
   - Auto-send on silence (3 seconds)

4. **UI Components**
   - Dialog with shadcn/ui
   - Header with ChefAI branding
   - Message bubbles
   - Typing indicator
   - Input area with submit button
   - Voice microphone button
   - Loading states

5. **Function Calling**
   - `add_items_to_list`: Add items to shopping list
   - `delete_items_from_list`: Remove items from list
   - Confirmation messages in chat
   - Toast notifications
   - Trigger list refresh in GroceryApp

## Files to Delete

```
src/components/ChefAI/ChefAI.tsx
src/components/ChefAI/FloatingChat.tsx
src/components/ChefAI/ChatWindow.tsx
src/components/ChefAI/ChatToggleButton.tsx
src/components/ChefAI/MessageList.tsx
src/components/ChefAI/MessageItem.tsx
src/components/ChefAI/MessageInput.tsx
src/components/ChefAI/TypingIndicator.tsx
src/components/ChefAI/QuickActions.tsx
src/components/ChefAI/ChatBubble.tsx
src/components/ChefAI/index.ts
```

## Files to Modify

```
src/components/ChatDialog.tsx - Complete rewrite with full functionality
src/components/GroceryApp.tsx - Update props passed to ChatDialog
```

## Files to Keep (No Changes)

```
src/lib/openai.ts - Contains askChefAI function
src/types/chefai.ts - Contains TypeScript types
```

## Success Criteria

- [ ] ChefAI directory completely removed
- [ ] New ChatDialog has message history
- [ ] AI integration works with streaming
- [ ] Voice input functional
- [ ] Function calling works (add/remove items)
- [ ] Dialog opens/closes properly
- [ ] No broken imports or references
- [ ] All chat features tested
