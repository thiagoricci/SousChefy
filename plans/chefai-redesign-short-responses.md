# ChefAI Redesign: Short Responses & Tab Routing

## Overview

Redesign ChefAI to provide concise, one-sentence responses and automatically route different request types to appropriate tabs instead of displaying detailed information in the chat.

## Current Behavior

- ChefAI provides detailed multi-paragraph responses in chat
- Recipe details and instructions shown in chat
- Confirmation messages appended to chat (e.g., "I've added 3 items to your shopping list...")
- Users see all content in chat panel

## New Behavior Requirements

### 1. Response Length

- **Maximum**: One sentence per response
- **Style**: Concise, direct, action-oriented
- **Examples**:
  - "Added to your list."
  - "Check the Recipe tab."
  - "Switched to Cooking mode."
  - "See your History tab."

### 2. Request Type Routing

#### List-Related Requests

**Triggers**: "add milk", "create list", "remove eggs", "delete items"
**Action**:

- Call `add_items_to_list` or `delete_items_from_list` function
- Switch to 'home' tab (List view)
- Show toast notification with details
- Chat response: One sentence confirmation
- **NO detailed item listing in chat**

#### Recipe/Recommendation Requests

**Triggers**: "what can I cook", "recipe ideas", "dinner suggestions"
**Action**:

- Generate 5 recipe options (names + descriptions only)
- Call `show_recipes_in_tab` with mode="options"
- Switch to 'search' tab (Recipe tab)
- Show recipes as compact cards in Recipe tab
- Chat response: "Check the Recipe tab for suggestions."
- **NO recipe details in chat**

#### Cooking Requests

**Triggers**: "how do I make lasagna", "chicken stir fry recipe", "cook pasta"
**Action**:

- Generate complete recipe with all details
- Call `save_recipe` function to save to database
- Call NEW `show_recipe_in_cooking_tab` function
- Switch to 'cooking' tab
- Display recipe in Cooking mode with timer
- Chat response: "Recipe saved. Check the Cooking tab."
- **NO recipe details in chat**

#### History/Saved/My Recipes Requests

**Triggers**: "show my history", "saved recipes", "my recipes"
**Action**:

- Call NEW `switch_to_history_tab` function
- Switch to 'favorites' tab (History tab)
- Chat response: "Check the History tab."
- **NO listing in chat**

#### General Cooking Questions

**Triggers**: "how to chop onions", "what is al dente", "cooking tips"
**Action**:

- Provide one-sentence answer in chat
- **NO tab switching**

## Implementation Plan

### Phase 1: System Prompt Updates

**File**: `src/lib/openai.ts`

**Changes**:

1. Update `buildChefAISystemPrompt()` function
2. Add strict one-sentence response guideline
3. Update routing instructions for each request type
4. Remove detailed response instructions
5. Add new function definitions

**New System Prompt Structure**:

```typescript
function buildChefAISystemPrompt(context: ChefAIContext): string {
  return `You are ChefAI, a helpful cooking assistant for SousChefy app.

CRITICAL RULES:
- ALL responses must be ONE sentence maximum
- Be concise and direct
- Use function calls for actions, not chat explanations
- NEVER include recipe details in chat
- NEVER list items in chat
- Use toast notifications for confirmations

REQUEST ROUTING:
- List requests (add/remove items) → Switch to home tab
- Recipe requests (ideas/suggestions) → Switch to search tab with options
- Cooking requests (specific recipes) → Switch to cooking tab with recipe
- History/saved recipes requests → Switch to favorites tab
- General questions → Answer in one sentence

Context awareness:
- Shopping list: ${shoppingListItems}
- Saved recipes: ${recipeNames}
- Shopping history: ${shoppingHistorySummary}
- Current view: ${context.currentTab}

FUNCTION USAGE:
- add_items_to_list: Add items, switch to home tab
- delete_items_from_list: Remove items, switch to home tab
- save_recipe: Save recipe to database
- show_recipes_in_tab: Switch to search tab with recipe options
- show_recipe_in_cooking_tab: Switch to cooking tab with full recipe
- switch_to_history_tab: Switch to favorites tab
`;
}
```

### Phase 2: New Function Definitions

**File**: `src/lib/openai.ts`

**Add to tools array**:

#### 1. `show_recipe_in_cooking_tab`

```typescript
{
  type: 'function' as const,
  function: {
    name: 'show_recipe_in_cooking_tab',
    description: 'Switch to cooking tab and display a complete recipe for cooking',
    parameters: {
      type: 'object',
      properties: {
        recipe: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Recipe name' },
            description: { type: 'string', description: 'Brief description' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  quantity: { type: 'string' },
                  unit: { type: 'string' }
                }
              }
            },
            instructions: { type: 'array', items: { type: 'string' } },
            prepTime: { type: 'string' },
            cookTime: { type: 'string' },
            servings: { type: 'number' },
            difficulty: { type: 'string' }
          }
        }
      },
      required: ['recipe']
    }
  }
}
```

#### 2. `switch_to_history_tab`

```typescript
{
  type: 'function' as const,
  function: {
    name: 'switch_to_history_tab',
    description: 'Switch to history/favorites tab to show saved lists and recipes',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
}
```

### Phase 3: ChatPanel Updates

**File**: `src/components/ChatPanel.tsx`

**Changes**:

1. **Remove chat confirmation messages**:
   - Remove all `setMessages` calls that append confirmations
   - Keep only streaming response from AI
   - Let toast notifications handle all feedback

2. **Add new function handlers**:

```typescript
// Handle show_recipe_in_cooking_tab function call
if (functionName === "show_recipe_in_cooking_tab") {
  const { recipe } = args;

  try {
    // Save recipe to database
    const dbRecipe = await recipesApi.create({
      name: recipe.name,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      servings: recipe.servings,
      prepTime: recipe.prepTime ? parseInt(recipe.prepTime) : undefined,
      cookTime: recipe.cookTime ? parseInt(recipe.cookTime) : undefined,
    });

    // Create saved recipe
    const savedRecipe: SavedRecipe = {
      id: dbRecipe.id,
      name: dbRecipe.name,
      description: recipe.description || "",
      ingredients: dbRecipe.ingredients,
      instructions: dbRecipe.instructions,
      servings: dbRecipe.servings,
      prepTime: dbRecipe.prepTime?.toString(),
      cookTime: dbRecipe.cookTime?.toString(),
      savedAt: Date.now(),
    };

    // Call callback to switch to cooking tab
    if (onShowRecipeInCookingTab) {
      onShowRecipeInCookingTab(savedRecipe);
    }

    // Show toast notification
    toast({
      title: "Recipe Saved",
      description: `"${recipe.name}" is ready in Cooking mode.`,
    });

    // Refresh saved recipes
    if (onSaveRecipe) {
      onSaveRecipe(savedRecipe);
    }
  } catch (error) {
    console.error("Error showing recipe in cooking tab:", error);
    toast({
      title: "Error",
      description: "Failed to save recipe.",
      variant: "destructive",
    });
  }
}

// Handle switch_to_history_tab function call
if (functionName === "switch_to_history_tab") {
  try {
    // Call callback to switch to history tab
    if (onSwitchToHistoryTab) {
      onSwitchToHistoryTab();
    }

    // Show toast notification
    toast({
      title: "History Tab",
      description: "Check your saved lists and recipes.",
    });
  } catch (error) {
    console.error("Error switching to history tab:", error);
  }
}
```

3. **Update existing function handlers**:
   - Remove all chat confirmation message appends
   - Keep only toast notifications
   - Add tab switching for list operations

```typescript
// Updated add_items_to_list handler
if (functionName === "add_items_to_list") {
  const { items: listItems, clearExisting = false } = args;

  try {
    // Add items to list via API
    await listsApi.addItemsToList({
      listId: activeList.id,
      items: listItems,
      clearExisting,
    });

    // Show toast notification
    toast({
      title: "Items added",
      description: `${listItems.length} item(s) added to your shopping list`,
    });

    // Trigger list refresh and switch to home tab
    if (onCreateList) {
      onCreateList(listItems, clearExisting);
    }
    if (onSwitchToHomeTab) {
      onSwitchToHomeTab();
    }
  } catch (listError) {
    // Error handling...
  }
}
```

4. **Update props interface**:

```typescript
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  savedRecipes: SavedRecipe[];
  history: SavedList[];
  activeView: string;
  viewMode: "editing" | "shopping";
  onCreateList?: (items: ListCreationItem[], clearExisting?: boolean) => void;
  onSaveRecipe?: (recipe: SavedRecipe) => void;
  onShowRecipesInTab?: (recipes: Recipe[], mode: "options" | "full") => void;
  onShowRecipeInCookingTab?: (recipe: SavedRecipe) => void; // NEW
  onSwitchToHistoryTab?: () => void; // NEW
  onSwitchToHomeTab?: () => void; // NEW
}
```

### Phase 4: GroceryApp Updates

**File**: `src/components/GroceryApp.tsx`

**Changes**:

1. **Add new state**:

```typescript
const [selectedCookingRecipe, setSelectedCookingRecipe] =
  useState<SavedRecipe | null>(null);
```

2. **Add new callback handlers**:

```typescript
// Handle showing recipe in cooking tab
const handleShowRecipeInCookingTab = useCallback((recipe: SavedRecipe) => {
  setSelectedCookingRecipe(recipe);
  setActiveView("cooking");
}, []);

// Handle switching to history tab
const handleSwitchToHistoryTab = useCallback(() => {
  setActiveView("favorites");
}, []);

// Handle switching to home tab
const handleSwitchToHomeTab = useCallback(() => {
  setActiveView("home");
}, []);
```

3. **Update CookingMode rendering**:

```typescript
{activeView === 'cooking' && (
  <div className="animate-fade-in">
    <CookingMode
      recipes={savedRecipes}
      selectedRecipe={selectedCookingRecipe} // NEW
      onBack={() => {
        setActiveView('home');
        setSelectedCookingRecipe(null);
      }}
      onComplete={() => {
        toast({
          title: "🎉 Recipe Complete!",
          description: "You've successfully completed cooking this recipe.",
        });
        setActiveView('home');
        setSelectedCookingRecipe(null);
      }}
    />
  </div>
)}
```

4. **Update ChatPanel props**:

```typescript
<ChatPanel
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  items={items}
  savedRecipes={savedRecipes}
  history={history}
  activeView={activeView}
  viewMode={viewMode}
  onCreateList={async (listItems, clearExisting) => {
    // Refresh items from database
    // ... existing code ...
    handleSwitchToHomeTab(); // NEW
  }}
  onSaveRecipe={async (recipe: SavedRecipe) => {
    // Refresh saved recipes from database
    // ... existing code ...
  }}
  onShowRecipesInTab={handleShowRecipesInTab}
  onShowRecipeInCookingTab={handleShowRecipeInCookingTab} // NEW
  onSwitchToHistoryTab={handleSwitchToHistoryTab} // NEW
  onSwitchToHomeTab={handleSwitchToHomeTab} // NEW
/>
```

### Phase 5: CookingMode Updates

**File**: `src/components/CookingMode.tsx`

**Changes**:

1. **Add selectedRecipe prop**:

```typescript
interface CookingModeProps {
  recipes: SavedRecipe[];
  selectedRecipe?: SavedRecipe | null; // NEW
  onBack: () => void;
  onComplete: () => void;
}
```

2. **Handle selected recipe**:

```typescript
export const CookingMode: React.FC<CookingModeProps> = ({
  recipes,
  selectedRecipe,
  onBack,
  onComplete
}) => {
  // If a recipe is selected, show it directly
  if (selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={onBack}
        onAddToShoppingList={/* handler */}
        onSaveRecipe={/* handler */}
        isSaved={true}
        showTimer={true} // NEW: Show cooking timer
      />
    );
  }

  // Otherwise, show recipe selection
  return (
    // ... existing recipe selection UI ...
  );
};
```

## Testing Checklist

### List Operations

- [ ] "Add milk and eggs" → Items added, switches to home tab, one-sentence response
- [ ] "Remove bread from list" → Item removed, switches to home tab, one-sentence response
- [ ] "Create a shopping list" → List created, switches to home tab, one-sentence response

### Recipe Operations

- [ ] "What can I cook?" → 5 options shown in Recipe tab, one-sentence response
- [ ] "Give me recipe ideas" → 5 options shown in Recipe tab, one-sentence response
- [ ] "How do I make lasagna?" → Recipe saved, switches to Cooking tab, one-sentence response
- [ ] "Chicken stir fry recipe" → Recipe saved, switches to Cooking tab, one-sentence response

### History Operations

- [ ] "Show my history" → Switches to History tab, one-sentence response
- [ ] "My saved recipes" → Switches to History tab, one-sentence response
- [ ] "Check my favorites" → Switches to History tab, one-sentence response

### General Questions

- [ ] "How to chop onions" → One-sentence answer in chat, no tab switch
- [ ] "What is al dente" → One-sentence answer in chat, no tab switch
- [ ] "Cooking tips for pasta" → One-sentence answer in chat, no tab switch

### Response Length

- [ ] All responses are one sentence maximum
- [ ] No detailed item listings in chat
- [ ] No recipe details in chat
- [ ] No multi-paragraph responses

## Migration Notes

### Breaking Changes

- Chat confirmations removed (users will see toast notifications instead)
- Recipe details no longer shown in chat
- All recipe-related content now shown in respective tabs

### User Experience Impact

- **Positive**: Cleaner, more focused chat interface
- **Positive**: Faster access to detailed content in appropriate tabs
- **Positive**: Consistent tab-based navigation
- **Potential**: Users may need to learn new behavior patterns

### Rollback Plan

If issues arise, can revert by:

1. Restoring original system prompt
2. Re-enabling chat confirmation messages
3. Removing new function handlers

## Success Metrics

1. **Response Length**: 100% of responses are one sentence
2. **Tab Routing**: 100% of actionable requests route to correct tab
3. **User Feedback**: Positive feedback on cleaner chat interface
4. **Error Rate**: No increase in errors from function calls
5. **Task Completion**: Users can complete all tasks via tabs instead of chat

## Future Enhancements

1. **Quick Actions**: Add buttons in chat for common requests
2. **Tab Preview**: Show small preview of tab content when switching
3. **Smart Routing**: Learn user preferences and auto-route similar requests
4. **Voice Commands**: Add voice commands for tab switching
5. **Context Persistence**: Maintain context when switching tabs
