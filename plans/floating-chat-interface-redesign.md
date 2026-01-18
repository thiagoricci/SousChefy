# ChefAI Floating Chat Interface Redesign

## Overview

Replace the current bottom-right chat bubble with a floating, minimizable chat window that can be toggled from a top-positioned button.

## Current State

- **ChatBubble**: Fixed bottom-right button (green circle with ChefHat icon)
- **ChatWindow**: Fixed bottom-right window (380x500px) that slides up when opened
- **ChefAI**: Main component managing state and rendering both components

## Proposed Design

### 1. New FloatingChat Component

A single component that handles both minimized and maximized states:

#### Minimized State

- Compact floating widget (e.g., 60x60px or small pill shape)
- Positioned at top-right (or user-configurable position)
- Shows ChefHat icon with subtle animation
- Click to expand to maximized state
- Shows unread count badge if applicable

#### Maximized State

- Full chat interface (380x500px or responsive)
- Positioned at top-right with smooth animation
- Contains:
  - Header with title and minimize/close buttons
  - Message list with scroll
  - Input area with text field and send button
  - Voice input support (if applicable)

### 2. Top Toggle Button

A separate button positioned at the top of the screen (e.g., top-right corner):

- Small, unobtrusive button
- ChefHat icon
- Opens the chat window when clicked
- Shows visual indicator when chat is open

### 3. State Management

States to manage:

- `isOpen`: Whether chat window is visible (true/false)
- `isMinimized`: Whether chat is in minimized state (true/false)
- `unreadCount`: Number of unread messages

### 4. Transitions and Animations

- Smooth slide-in/slide-out animations
- Scale effects for minimize/maximize
- Fade effects for content transitions
- Hover states for interactive elements

## Implementation Steps

### Step 1: Create FloatingChat Component

```typescript
// src/components/ChefAI/FloatingChat.tsx
interface FloatingChatProps {
  isOpen: boolean;
  onClose: () => void;
  context: ChefAIContext;
  onCreateList?: (items: ListCreationItem[], clearExisting?: boolean) => void;
}
```

Features:

- Minimize/maximize toggle button
- Smooth CSS transitions
- Responsive sizing
- Keyboard shortcuts (Escape to close)
- Click outside to close (optional)

### Step 2: Create Top Toggle Button Component

```typescript
// src/components/ChefAI/ChatToggleButton.tsx
interface ChatToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount?: number;
}
```

Features:

- Fixed top-right position
- ChefHat icon
- Unread badge
- Hover effects
- Click to toggle chat

### Step 3: Update ChefAI Component

- Replace ChatBubble and ChatWindow with FloatingChat
- Add ChatToggleButton to render
- Maintain existing state management
- Keep keyboard shortcut (C key) functionality

### Step 4: Styling Considerations

- Use Tailwind CSS for responsive design
- Ensure z-index layering is correct
- Mobile optimization (smaller size on mobile)
- Accessibility (ARIA labels, focus states)

### Step 5: Testing

- Desktop: Verify positioning and animations
- Mobile: Test responsive behavior and touch interactions
- Keyboard: Ensure shortcuts work properly
- Performance: Check for smooth 60fps animations

## Component Architecture

```
ChefAI (main container)
├── ChatToggleButton (top-right button)
└── FloatingChat (floating window)
    ├── Header (title, minimize/close)
    ├── MessageList (scrollable messages)
    └── MessageInput (text field, send button)
```

## Responsive Design

### Desktop (>768px)

- Chat window: 380x500px
- Toggle button: 48x48px
- Position: Top-right corner

### Mobile (≤768px)

- Chat window: Full width minus margins, 80% viewport height
- Toggle button: 40x40px
- Position: Top-right corner (with padding)
- Slide-up animation from bottom

## Accessibility

- ARIA labels for all interactive elements
- Keyboard navigation support
- Focus management when opening/closing
- Screen reader announcements for state changes

## Migration Notes

### Files to Modify

1. `src/components/ChefAI/ChefAI.tsx` - Update to use new components
2. `src/components/ChefAI/ChatBubble.tsx` - Deprecate (keep for reference)
3. `src/components/CheFai/ChatWindow.tsx` - Deprecate (keep for reference)

### Files to Create

1. `src/components/ChefAI/FloatingChat.tsx` - New floating chat component
2. `src/components/ChefAI/ChatToggleButton.tsx` - New toggle button component

### Breaking Changes

- None - this is a UI redesign only
- All existing functionality remains intact
- Keyboard shortcuts (C key, Escape) continue to work

## Future Enhancements

- Draggable chat window
- Remember user's preferred position
- Theme customization
- Sound notifications
- Chat history persistence
- Multiple chat sessions
