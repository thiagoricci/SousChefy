# Voice Shopper - Architecture

## System Architecture

Voice Shopper is a single-page React application that uses browser-native Web Speech API for voice recognition. The application follows a component-based architecture with clear separation of concerns.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  QueryClientProvider (TanStack Query)                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  BrowserRouter (React Router)                   │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │  Routes:                                  │  │  │  │
│  │  │  │  - / → LandingPage                       │  │  │  │
│  │  │  │  - /app → GroceryApp                     │  │  │  │
│  │  │  │  - * → NotFound                          │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Source Code Paths

### Core Application Structure

```
src/
├── App.tsx                          # Main app component with routing
├── main.tsx                         # Application entry point
├── index.css                        # Global styles
├── vite-env.d.ts                    # Vite TypeScript declarations
│
├── components/
│   ├── GroceryApp.tsx               # Main grocery shopping component
│   ├── ShoppingList.tsx             # Shopping list display component
│   ├── VoiceButton.tsx              # Reusable voice button component
│   └── ui/                          # shadcn/ui components (40+ components)
│
├── pages/
│   ├── LandingPage.tsx              # Landing page with CTA
│   ├── MenuPage.tsx                 # Menu selection page
│   ├── Index.tsx                    # Index page (redirects to GroceryApp)
│   └── NotFound.tsx                 # 404 error page
│
├── hooks/
│   ├── useSpeechRecognition.ts      # Custom speech recognition hook
│   ├── use-debounce.ts              # Debounce utility hook
│   ├── use-mobile.tsx               # Mobile detection hook
│   └── use-toast.ts                 # Toast notification hook
│
├── data/
│   └── groceryItems.ts              # Grocery item database (200+ items)
│
├── types/
│   └── speech.ts                    # Speech recognition TypeScript types
│
├── lib/
│   └── utils.ts                     # Utility functions (cn helper)
│
└── assets/
    ├── grocery-hero.jpg             # Hero image
    └── landing-hero.png             # Landing page image
```

## Key Technical Decisions

### 1. Browser-Native Speech Recognition

- **Decision**: Use Web Speech API instead of cloud-based services
- **Rationale**: No API keys required, privacy-focused, works offline, no external dependencies
- **Trade-off**: Limited browser support (Chrome, Safari, Edge), no cross-browser consistency

### 2. Dual-Mode Operation

- **Decision**: Separate "Adding" and "Shopping" modes
- **Rationale**: Different speech patterns for adding vs checking off items, clearer UX
- **Implementation**: Two separate `useSpeechRecognition` instances with different configurations

### 3. Debounced Transcript Processing

- **Decision**: 500ms debounce on speech transcript processing
- **Rationale**: Prevents excessive re-renders and item duplication during continuous speech
- **Implementation**: Custom `useDebounce` hook

### 4. Aggressive Microphone Cleanup

- **Decision**: Multiple stop calls with timeouts up to 750ms
- **Rationale**: Mobile browsers have unreliable speech recognition stop behavior
- **Implementation**: `stopListening()` function with cascading timeout-based stops

### 5. Grocery Database with Fuzzy Matching

- **Decision**: Pre-defined database of 200+ items with fuzzy matching
- **Rationale**: Ensures consistent item names, supports variations and plurals
- **Implementation**: `groceryItems.ts` with `isValidGroceryItem()` and `findBestMatch()` functions

## Design Patterns

### 1. Custom Hooks Pattern

- `useSpeechRecognition`: Encapsulates Web Speech API logic
- `useDebounce`: Provides debounced values
- `useToast`: Manages toast notifications
- `useIsMobile`: Detects mobile viewport

### 2. Component Composition

- `GroceryApp` composes `ShoppingList`, `VoiceButton`, and UI components
- `ShoppingList` renders items grouped by category
- Reusable UI components from shadcn/ui

### 3. State Management

- Local component state with `useState`
- Callback memoization with `useCallback`
- Computed values with `useMemo`
- No external state management library needed

### 4. Event Handling

- Keyboard shortcuts with global event listeners
- Speech recognition callbacks
- Button click handlers with mode transitions

## Component Relationships

### Core Component Hierarchy

```
App.tsx
└── GroceryApp.tsx
    ├── VoiceButton.tsx (not currently used, inline button instead)
    ├── ShoppingList.tsx
    │   └── ShoppingItem (rendered inline)
    └── UI Components (Button, Card, etc.)
```

### Data Flow

```
User Speech Input
    ↓
useSpeechRecognition Hook
    ↓
onResult Callback
    ↓
parseAndAddItems Function
    ↓
setItems State Update
    ↓
ShoppingList Re-render
```

### Mode Transitions

```
Idle → Adding (user clicks "Add Items")
Adding → Idle (user clicks "Stop Adding" or timeout)
Idle → Shopping (user clicks "Start Shopping")
Shopping → Idle (user clicks "Stop Shopping" or all items completed)
```

## Critical Implementation Paths

### 1. Adding Items Flow

```
handleStartAddingItems()
    ↓
addItemsRecognition.startListening()
    ↓
onResult callback triggered
    ↓
Accumulate transcript
    ↓
Debounce (500ms)
    ↓
parseAndAddItems(transcript)
    ↓
Extract quantities
    ↓
Validate against grocery database
    ↓
Add items to state
    ↓
Show toast notification
```

### 2. Shopping Mode Flow

```
handleStartShopping()
    ↓
shoppingRecognition.startListening()
    ↓
onResult callback triggered
    ↓
checkOffItems(transcript)
    ↓
Match spoken words to items
    ↓
Update item.completed state
    ↓
Check if all items completed
    ↓
Play celebration sound if complete
```

### 3. Microphone Stop Flow

```
handleStopAddingItems() / handleStopShopping()
    ↓
Clear all timeouts
    ↓
Set manuallyStopped flags
    ↓
Multiple abort() calls (immediate, 50ms, 150ms, 300ms, 500ms, 750ms)
    ↓
Update mode to 'idle'
    ↓
Clear accumulated transcript
```

## Performance Considerations

### Optimizations Implemented

1. **Debounced Processing**: Prevents excessive re-renders during speech
2. **Callback Memoization**: `useCallback` for event handlers
3. **Computed Values**: `useMemo` for expensive calculations
4. **Cleanup on Unmount**: Proper timeout and event listener cleanup
5. **Aggressive Stop Mechanism**: Prevents memory leaks from hanging microphones

### Potential Bottlenecks

1. **Grocery Database Lookup**: O(n) search through 200+ items (acceptable for current scale)
2. **Speech Recognition**: Browser-dependent performance
3. **Large Shopping Lists**: Rendering performance with 100+ items

## Security Considerations

1. **Microphone Permissions**: Requires user consent
2. **No External APIs**: All processing happens in-browser
3. **No Data Persistence**: Lists stored in memory only (history in localStorage)
4. **HTTPS Required**: Speech API requires secure context

## Browser Compatibility

### Supported Browsers

- Chrome/Edge (full support)
- Safari (partial support, different behavior)
- Firefox (limited support)

### Mobile Considerations

- iOS Safari: Different speech recognition behavior
- Android Chrome: Generally good support
- Requires special handling for mobile quirks
