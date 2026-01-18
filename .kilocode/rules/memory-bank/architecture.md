# SousChefy - Architecture

## System Architecture

SousChefy is a single-page React application that uses text-based input for shopping list management. The application follows a component-based architecture with clear separation of concerns.

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
│   └── ui/                          # shadcn/ui components (40+ components)
│
├── pages/
│   ├── LandingPage.tsx              # Landing page with CTA
│   ├── MenuPage.tsx                 # Menu selection page
│   ├── Index.tsx                    # Index page (redirects to GroceryApp)
│   └── NotFound.tsx                 # 404 error page
│
├── hooks/
│   ├── use-debounce.ts              # Debounce utility hook
│   ├── use-mobile.tsx               # Mobile detection hook
│   └── use-toast.ts                 # Toast notification hook
│
├── data/
│   └── groceryItems.ts              # Grocery item database (200+ items)
│
├── lib/
│   └── utils.ts                     # Utility functions (cn helper)
│
└── assets/
    ├── grocery-hero.jpg             # Hero image
    └── landing-hero.png             # Landing page image
```

## Key Technical Decisions

### 1. Text-Based Input System

- **Decision**: Use text input fields for item addition
- **Rationale**: Universal browser support, no special permissions required, works on all devices
- **Trade-off**: Requires manual typing instead of voice input

### 2. Dual-Mode Operation

- **Decision**: Separate "Editing" and "Shopping" modes
- **Rationale**: Different workflows for creating lists vs checking off items, clearer UX
- **Implementation**: State-based mode switching with `viewMode` state

### 3. Grocery Database with Fuzzy Matching

- **Decision**: Pre-defined database of 200+ items with fuzzy matching
- **Rationale**: Ensures consistent item names, supports variations and plurals
- **Implementation**: `groceryItems.ts` with `isValidGroceryItem()` and `findBestMatch()` functions

### 4. Recipe Generation with OpenAI API

- **Decision**: Use OpenAI API for recipe generation
- **Rationale**: Enables users to generate recipes by dish name or ingredients
- **Implementation**: `generateRecipeByDish` and `recommendRecipesByIngredients` functions
- **Features Supported**:
  - Generate complete recipes by dish name
  - Recommend recipes based on available ingredients
  - Returns recipes with ingredients, instructions, prep time, cook time, servings, and difficulty

## Design Patterns

### 1. Custom Hooks Pattern

- `useDebounce`: Provides debounced values
- `useToast`: Manages toast notifications
- `useIsMobile`: Detects mobile viewport

### 2. Component Composition

- `GroceryApp` composes `ShoppingList` and UI components
- `ShoppingList` renders items grouped by category
- Reusable UI components from shadcn/ui

### 3. State Management

- Local component state with `useState`
- Callback memoization with `useCallback`
- Computed values with `useMemo`
- No external state management library needed

### 4. Event Handling

- Keyboard shortcuts with global event listeners
- Button click handlers with mode transitions
- Form submissions with Enter key support

## Component Relationships

### Core Component Hierarchy

```
App.tsx
└── GroceryApp.tsx
    ├── ShoppingList.tsx
    │   └── ShoppingItem (rendered inline)
    ├── RecipeTab.tsx
    │   ├── Recipe generation by dish name
    │   └── Recipe recommendations by ingredients
    ├── RecipeDetail.tsx
    ├── HistoryTab.tsx
    ├── CookingMode.tsx
    └── UI Components (Button, Card, etc.)
```

### Data Flow

```
User Text Input
    ↓
handleTextInputSubmit Function
    ↓
Item Validation
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
User enters item name, quantity, and unit
    ↓
handleTextInputSubmit()
    ↓
Validate item name (not empty, not duplicate)
    ↓
Parse quantity and unit
    ↓
Find best match in grocery database
    ↓
Create new ShoppingItem
    ↓
Add to items state
    ↓
Show toast notification
```

### 2. Shopping Mode Flow

```
User clicks "Start Shopping"
    ↓
Switch to shopping mode
    ↓
Display items with checkboxes
    ↓
User clicks items to toggle completion
    ↓
Update item.completed state
    ↓
Check if all items completed
    ↓
Play celebration sound if complete
```

### 3. Recipe Generation Flow

```
User searches for recipe by dish name
    ↓
generateRecipeByDish() called with dish name
    ↓
OpenAI API request sent
    ↓
Complete recipe returned with ingredients, instructions, timing
    ↓
Recipe displayed in RecipeTab
    ↓
User can view recipe details, save to collection, or add ingredients to shopping list
```

### 4. Recipe Recommendations Flow

```
User searches for recipes by ingredients
    ↓
recommendRecipesByIngredients() called with ingredient list
    ↓
OpenAI API request sent
    ↓
5 recipe options returned with details
    ↓
Recipes displayed in RecipeTab
    ↓
User can view recipe details, save to collection, or add ingredients to shopping list
```

## Performance Considerations

### Optimizations Implemented

1. **Callback Memoization**: `useCallback` for event handlers
2. **Computed Values**: `useMemo` for expensive calculations
3. **Cleanup on Unmount**: Proper timeout and event listener cleanup

### Potential Bottlenecks

1. **Grocery Database Lookup**: O(n) search through 200+ items (acceptable for current scale)
2. **Large Shopping Lists**: Rendering performance with 100+ items

## Security Considerations

1. **No External APIs**: All processing happens in-browser (except ChefAI OpenAI API)
2. **No Data Persistence**: Lists stored in memory only (history in localStorage)
3. **Database Security**: All data operations are user-specific (filtered by userId in backend)
4. **Recipe Security**: Recipes are user-specific with ownership verification

## Browser Compatibility

### Supported Browsers

- **Chrome/Edge** (full support)
- **Safari** (full support)
- **Firefox** (full support)
- **All modern browsers** with ES6+ support

### Mobile Considerations

- **iOS Safari**: Full support with responsive design
- **Android Chrome**: Full support with responsive design
- **All mobile browsers**: Optimized touch interactions

## Architecture Summary

SousChefy follows a component-based architecture with clear separation of concerns:

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js with Prisma ORM (PostgreSQL database)
- **APIs**: RESTful APIs for lists, recipes, and authentication
- **State Management**: Local component state with localStorage fallback
- **ChefAI**: OpenAI integration with function calling support

The system is production-ready and follows modern best practices for React applications.
