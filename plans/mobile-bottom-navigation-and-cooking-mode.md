# Mobile Bottom Navigation & Cooking Mode Implementation Plan

## Overview

This plan outlines the implementation of a mobile-first bottom navigation system and a new cooking mode feature for the Grocerli app.

## Current State Analysis

### Existing Navigation

- Uses `Tabs` component from shadcn/ui with 3 tabs:
  - "Make a List" - Shopping list management
  - "Recipes" - AI-powered recipe search
  - "History" - Saved lists and recipes

### Key Components

- `GroceryApp.tsx` - Main app component with all state management
- `RecipeDetail.tsx` - Displays recipe details with ingredients and instructions
- `HistoryTab.tsx` - Shows saved lists and recipes
- `RecipeTab.tsx` - Recipe search interface

## New Architecture

### Navigation Structure

```
Mobile Bottom Navigation (Fixed at bottom)
├── Home (Lists)      - Current "Make a List" functionality
├── Search (Recipes)   - Current "Recipes" functionality
├── Cooking            - NEW: Step-by-step cooking mode
└── Favorites (History)- Current "History" functionality
```

### Component Hierarchy

```
GroceryApp (Main Container)
├── Header (User greeting, logout)
├── Main Content Area
│   ├── HomeView (Shopping list management)
│   ├── SearchView (Recipe search)
│   ├── CookingView (Step-by-step cooking)
│   └── FavoritesView (History)
└── BottomNavigation (Mobile-only, fixed position)
```

## Implementation Details

### 1. Bottom Navigation Component

**File:** `src/components/BottomNavigation.tsx`

**Features:**

- Fixed position at bottom of screen (mobile only)
- 4 navigation items with icons
- Active state indication
- Smooth transitions between views
- Badge for Favorites showing count

**Icons:**

- Home: `Home` or `List` icon
- Search: `Search` icon
- Cooking: `ChefHat` or `Flame` icon
- Favorites: `Heart` or `Bookmark` icon

**Props:**

```typescript
interface BottomNavigationProps {
  activeView: "home" | "search" | "cooking" | "favorites";
  onViewChange: (view: "home" | "search" | "cooking" | "favorites") => void;
  favoritesCount?: number;
}
```

### 2. Cooking Mode Feature

**File:** `src/components/CookingMode.tsx`

**Features:**

- Recipe selection screen (from saved recipes)
- Step-by-step instruction display
- Integrated timer for each step
- Progress indicator
- Voice control (optional, using existing speech recognition)
- Mark steps as complete
- Navigate between steps

**State Management:**

```typescript
interface CookingState {
  recipe: Recipe | null;
  currentStep: number;
  timerActive: boolean;
  timerValue: number; // in seconds
  completedSteps: number[];
}
```

**Components:**

1. `RecipeSelector` - Choose recipe to cook
2. `CookingStep` - Display current step with timer
3. `TimerDisplay` - Countdown timer
4. `StepNavigation` - Previous/Next buttons

### 3. Timer Functionality

**Features:**

- Start/Pause/Reset timer
- Visual countdown display
- Audio notification when timer ends
- Preset timers for common cooking times
- Custom timer input

**Implementation:**

```typescript
interface TimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
}
```

### 4. View Components

#### HomeView

- Extracted from current "Make a List" tab
- Shopping list management
- Add/edit/remove items
- Start shopping mode

#### SearchView

- Extracted from current "Recipes" tab
- AI-powered recipe search
- View recipe details
- Add ingredients to list

#### CookingView

- NEW component
- Recipe selection
- Step-by-step cooking
- Timer integration

#### FavoritesView

- Extracted from current "History" tab
- Saved lists
- Saved recipes
- Load/delete functionality

## Data Flow

### Navigation Flow

```
User clicks nav item
    ↓
onViewChange(view)
    ↓
Update activeView state
    ↓
Render corresponding view component
```

### Cooking Mode Flow

```
User selects recipe
    ↓
Load recipe details
    ↓
Display step 1
    ↓
User starts timer (optional)
    ↓
Timer counts down
    ↓
User marks step complete
    ↓
Advance to next step
    ↓
Repeat until all steps complete
    ↓
Show completion celebration
```

## State Management Updates

### GroceryApp State Changes

**Current:**

```typescript
const [activeTab, setActiveTab] = useState("make-list");
```

**New:**

```typescript
const [activeView, setActiveView] = useState<
  "home" | "search" | "cooking" | "favorites"
>("home");
const [cookingState, setCookingState] = useState<CookingState>({
  recipe: null,
  currentStep: 0,
  timerActive: false,
  timerValue: 0,
  completedSteps: [],
});
```

### New Handlers

```typescript
// Navigation
const handleViewChange = (view: ViewType) => {
  setActiveView(view);
};

// Cooking mode
const handleStartCooking = (recipe: Recipe) => {
  setCookingState({
    recipe,
    currentStep: 0,
    timerActive: false,
    timerValue: 0,
    completedSteps: [],
  });
  setActiveView("cooking");
};

const handleNextStep = () => {
  setCookingState((prev) => ({
    ...prev,
    currentStep: prev.currentStep + 1,
    completedSteps: [...prev.completedSteps, prev.currentStep],
  }));
};

const handlePreviousStep = () => {
  setCookingState((prev) => ({
    ...prev,
    currentStep: Math.max(0, prev.currentStep - 1),
  }));
};

const handleTimerToggle = () => {
  setCookingState((prev) => ({
    ...prev,
    timerActive: !prev.timerActive,
  }));
};
```

## Styling Approach

### Mobile-First Design

- Bottom navigation: Fixed position, 60px height
- Safe area padding for notched devices
- Touch-friendly tap targets (minimum 44px)
- Smooth transitions between views
- Active state with color change and icon highlighting

### Responsive Considerations

- Bottom navigation visible only on mobile (< 768px)
- Desktop: Show tabs at top (keep existing behavior)
- Or: Show bottom navigation on all devices for consistency

### Color Scheme

- Active item: Primary color (blue-500)
- Inactive: Muted foreground
- Background: White with blur effect
- Border: Subtle top border

## Implementation Steps

### Phase 1: Bottom Navigation

1. Create `BottomNavigation.tsx` component
2. Add icons and navigation items
3. Implement active state styling
4. Add responsive visibility (mobile only)
5. Test navigation between views

### Phase 2: View Refactoring

1. Extract HomeView from existing "Make a List" tab
2. Extract SearchView from existing "Recipes" tab
3. Extract FavoritesView from existing "History" tab
4. Update GroceryApp to use new view system
5. Remove old Tabs component

### Phase 3: Cooking Mode - Basic

1. Create `CookingMode.tsx` component
2. Implement recipe selector
3. Create step display component
4. Add step navigation
5. Test basic flow

### Phase 4: Timer Implementation

1. Create `TimerDisplay.tsx` component
2. Implement countdown logic
3. Add start/pause/reset controls
4. Add audio notification on completion
5. Integrate with cooking steps

### Phase 5: Polish & Testing

1. Add animations and transitions
2. Test on mobile devices
3. Verify timer accuracy
4. Add error handling
5. Optimize performance

## Technical Considerations

### Timer Implementation

- Use `setInterval` for countdown
- Clear interval on unmount
- Handle app backgrounding (pause timer)
- Store timer state in localStorage (optional)

### Voice Control Integration

- Reuse existing `useSpeechRecognition` hook
- Commands: "next step", "previous step", "start timer", "pause timer"
- Only activate when cooking mode is active

### Accessibility

- Keyboard navigation for bottom nav
- Screen reader support for timer
- High contrast colors
- Touch target sizes (44px minimum)

### Performance

- Lazy load cooking mode component
- Memoize expensive calculations
- Optimize re-renders
- Use CSS animations instead of JS where possible

## Edge Cases

### Timer Edge Cases

- App goes to background while timer running
- Timer reaches 0 while app is closed
- User switches views while timer active
- Multiple timers (not supported, show warning)

### Navigation Edge Cases

- Switching views while cooking
- Losing progress if switching views
- Returning to cooking mode with incomplete recipe

### Recipe Edge Cases

- Recipe with no instructions
- Recipe with very long instructions
- Recipe with missing data

## Future Enhancements

### Phase 2 Features

- Voice commands for cooking mode
- Multiple timers (for multiple dishes)
- Recipe scaling (adjust servings)
- Cooking tips for each step
- Ingredient checklist in cooking mode

### Phase 3 Features

- Share cooking progress
- Cooking history
- Favorite recipes quick access
- Custom timers saved per recipe
- Integration with smart home devices

## Files to Create

1. `src/components/BottomNavigation.tsx`
2. `src/components/CookingMode.tsx`
3. `src/components/TimerDisplay.tsx`
4. `src/views/HomeView.tsx`
5. `src/views/SearchView.tsx`
6. `src/views/CookingView.tsx`
7. `src/views/FavoritesView.tsx`

## Files to Modify

1. `src/components/GroceryApp.tsx` - Major refactoring
2. `src/types/recipe.ts` - Add cooking-related types
3. `src/types/cooking.ts` - NEW file for cooking types

## Testing Checklist

- [ ] Bottom navigation works on mobile
- [ ] All views accessible via navigation
- [ ] Cooking mode recipe selection works
- [ ] Step navigation works correctly
- [ ] Timer counts down accurately
- [ ] Timer audio notification plays
- [ ] Timer pauses on view switch
- [ ] Progress saves correctly
- [ ] Voice commands work (if implemented)
- [ ] Responsive design works on all screen sizes
- [ ] Accessibility features work
- [ ] Performance is acceptable

## Success Metrics

- Smooth navigation between views (< 100ms)
- Timer accuracy (within 1 second per minute)
- No memory leaks (proper cleanup)
- Mobile touch targets meet accessibility standards
- User can complete a recipe in cooking mode without issues
