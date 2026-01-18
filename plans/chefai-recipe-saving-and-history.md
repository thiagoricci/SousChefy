# ChefAI Recipe Saving and Shopping History Access

## Overview

This enhancement enables ChefAI to save recipes to the user's saved recipes tab and provides ChefAI with full access to the user's shopping history. This will make ChefAI more intelligent and context-aware, allowing it to provide personalized recommendations based on past shopping patterns and saved recipes.

## Current State

### What ChefAI Can Do Now

- Create shopping lists via `add_items_to_list` function
- Delete items from shopping lists via `delete_items_from_list` function
- Access current shopping list items in context
- Access saved recipes in context (read-only)
- Provide cooking advice and recipe recommendations

### What ChefAI Cannot Do

- Save recipes to the saved recipes tab
- Access user's shopping history (past lists)
- Make personalized recommendations based on shopping patterns
- Reference past shopping trips in conversations

## Requirements

### 1. Recipe Saving

ChefAI should be able to:

- Save recipes generated during conversations
- Save recipes recommended to users
- Save recipes created from user descriptions
- Provide confirmation when a recipe is saved

### 2. Shopping History Access

ChefAI should be able to:

- Access all past shopping lists
- Understand shopping patterns and frequency
- Reference previous shopping trips
- Make personalized suggestions based on history

## Implementation Plan

### Phase 1: Type Definitions

#### File: `src/types/chefai.ts`

**Changes:**

1. Extend `ChefAIContext` interface to include shopping history
2. Add new types for recipe saving

**New Interface Structure:**

```typescript
export interface ChefAIContext {
  shoppingList: Array<{
    name: string;
    quantity?: number;
    unit?: string;
    completed: boolean;
  }>;
  savedRecipes: Array<{
    name: string;
    ingredients: Array<{
      name: string;
      quantity?: string;
      unit?: string;
    }>;
  }>;
  shoppingHistory: Array<{
    name: string;
    items: Array<{
      name: string;
      quantity?: number;
      unit?: string;
      completed: boolean;
    }>;
    createdAt: number;
    updatedAt: number;
  }>;
  currentTab: string;
  viewMode: "editing" | "shopping";
}

export interface SaveRecipeRequest {
  name: string;
  description?: string;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
  instructions: string[];
  servings?: number;
  prepTime?: string;
  cookTime?: string;
  difficulty?: string;
}
```

### Phase 2: OpenAI Integration

#### File: `src/lib/openai.ts`

**Changes:**

1. Add `save_recipe` function to the tools array
2. Update `buildChefAISystemPrompt` to include shopping history
3. Add instructions for recipe saving

**New Tool Definition:**

```typescript
{
  type: 'function' as const,
  function: {
    name: 'save_recipe',
    description: 'Save a recipe to the user\'s saved recipes collection',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the recipe'
        },
        description: {
          type: 'string',
          description: 'Brief description of the recipe (optional)'
        },
        ingredients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name of the ingredient'
              },
              quantity: {
                type: 'string',
                description: 'Quantity of the ingredient (optional)'
              },
              unit: {
                type: 'string',
                description: 'Unit of measurement (optional)'
              }
            },
            required: ['name']
          }
        },
        instructions: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Step-by-step cooking instructions'
        },
        servings: {
          type: 'number',
          description: 'Number of servings (optional)'
        },
        prepTime: {
          type: 'string',
          description: 'Preparation time (optional)'
        },
        cookTime: {
          type: 'string',
          description: 'Cooking time (optional)'
        },
        difficulty: {
          type: 'string',
          description: 'Difficulty level: Easy/Medium/Hard (optional)'
        }
      },
      required: ['name', 'ingredients', 'instructions']
    }
  }
}
```

**Updated System Prompt:**

```typescript
function buildChefAISystemPrompt(context: ChefAIContext): string {
  const shoppingListItems =
    context.shoppingList
      .filter((item) => !item.completed)
      .map((item) => {
        const qty = item.quantity ? `${item.quantity} ` : "";
        const unit = item.unit ? `${item.unit} ` : "";
        return `${qty}${unit}${item.name}`;
      })
      .join(", ") || "none";

  const recipeNames =
    context.savedRecipes.map((recipe) => recipe.name).join(", ") || "none";

  const shoppingHistorySummary =
    context.shoppingHistory
      .slice(0, 5) // Last 5 lists for brevity
      .map((list) => {
        const itemCount = list.items.length;
        const date = new Date(list.updatedAt).toLocaleDateString();
        const itemPreview = list.items
          .slice(0, 3)
          .map((item) => item.name)
          .join(", ");
        const more =
          list.items.length > 3 ? ` +${list.items.length - 3} more` : "";
        return `${date}: ${itemCount} items (${itemPreview}${more})`;
      })
      .join("\n") || "No shopping history";

  return `You are ChefAI, a helpful cooking assistant for SousChefy app.

Your role:
- Provide cooking advice, tips, and techniques
- Suggest recipes based on available ingredients
- Answer kitchen-related questions
- Help with meal planning and preparation
- Explain cooking methods and terminology
- **CREATE SHOPPING LISTS**: When user asks to create a list, extract items and call add_items_to_list function
- **DELETE FROM LISTS**: When user asks to remove items, call to delete_items_from_list function
- **SAVE RECIPES**: When user asks to save a recipe, call save_recipe function

Context awareness:
- You have access to user's shopping list items
- You have access to user's saved recipes
- You have access to user's shopping history (past lists)
- Use this information to provide personalized suggestions

Current context:
Shopping list items: ${shoppingListItems}
Saved recipes: ${recipeNames}
Shopping history (last 5 lists):
${shoppingHistorySummary}
Current view: ${context.currentTab} (${context.viewMode})

Guidelines:
- Keep responses concise and practical (2-4 paragraphs max)
- Use clear, step-by-step instructions when giving directions
- Suggest alternatives when ingredients are missing
- Be encouraging and supportive
- If you don't know something, admit it honestly
- When suggesting recipes, consider items in shopping list
- Format recipes clearly with bullet points or numbered lists
- For ingredient substitutions, explain why the substitution works
- Reference shopping history to make personalized suggestions
- Notice patterns in shopping history (e.g., frequently bought items)

**LIST CREATION INSTRUCTIONS**:
When user asks to create a shopping list (e.g., "I need milk, eggs, and bread", "Create a list for pasta dinner", "Make a shopping list"):
1. Extract all grocery items from request
2. Parse quantities and units if specified
3. Call add_items_to_list function with items
4. Provide a friendly, conversational response explaining what you're adding
5. Set clearExisting to true only if user explicitly says to "replace" or "start fresh"
6. Keep your conversational response brief and focused - function will handle actual list creation

**LIST DELETION INSTRUCTIONS**:
When user asks to remove items from list (e.g., "remove milk from my list", "delete eggs", "take off of bread"):
1. Extract item names to be removed
2. Call delete_items_from_list function with item names
3. Provide a friendly, conversational response confirming what you're removing

**RECIPE SAVING INSTRUCTIONS**:
When user asks to save a recipe (e.g., "save this recipe", "save this to my recipes", "remember this recipe"):
1. Extract recipe details from conversation or generate a complete recipe
2. Call save_recipe function with recipe data
3. Provide a friendly, conversational response confirming the recipe was saved
4. Include recipe name and key details in confirmation
5. Keep your conversational response brief and focused - function will handle actual saving`;
}
```

### Phase 3: ChatPanel Updates

#### File: `src/components/ChatPanel.tsx`

**Changes:**

1. Add `history` prop to `ChatPanelProps` interface
2. Update context building to include shopping history
3. Add handler for `save_recipe` function calls
4. Pass history to `askChefAI` context

**New Props:**

```typescript
interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  savedRecipes: SavedRecipe[];
  history: SavedList[]; // NEW
  activeView: string;
  viewMode: "editing" | "shopping";
  onCreateList?: (items: ListCreationItem[], clearExisting?: boolean) => void;
}
```

**Updated Context Building:**

```typescript
const context: ChefAIContext = {
  shoppingList: items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    completed: item.completed,
  })),
  savedRecipes: savedRecipes.map((recipe) => ({
    name: recipe.name,
    ingredients: recipe.ingredients,
  })),
  shoppingHistory: history.map((list) => ({
    // NEW
    name: list.name,
    items: list.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      completed: item.completed,
    })),
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  })),
  currentTab: activeView,
  viewMode,
};
```

**New Function Handler:**

```typescript
// Handle save recipe function call
if (functionName === "save_recipe") {
  const recipeData = args;

  try {
    // Convert string time to number if present
    const prepTime = recipeData.prepTime
      ? parseInt(recipeData.prepTime)
      : undefined;
    const cookTime = recipeData.cookTime
      ? parseInt(recipeData.cookTime)
      : undefined;

    const dbRecipe = await recipesApi.create({
      name: recipeData.name,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      servings: recipeData.servings,
      prepTime,
      cookTime,
    });

    // Create saved recipe with database ID
    const savedRecipe: SavedRecipe = {
      id: dbRecipe.id,
      name: dbRecipe.name,
      description: dbRecipe.description || "",
      ingredients: dbRecipe.ingredients,
      instructions: dbRecipe.instructions,
      servings: dbRecipe.servings,
      prepTime: dbRecipe.prepTime?.toString(),
      cookTime: dbRecipe.cookTime?.toString(),
      savedAt: Date.now(),
    };

    // Append confirmation to the last assistant message
    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            content:
              lastMessage.content +
              `\n\nI've saved "${recipeData.name}" to your recipes!`,
          },
        ];
      }
      return [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `I've saved "${recipeData.name}" to your recipes!`,
          timestamp: Date.now(),
        },
      ];
    });

    // Show toast notification
    toast({
      title: "Recipe Saved",
      description: `"${recipeData.name}" has been saved to your recipes.`,
    });

    // Trigger recipe refresh (this will be handled by GroceryApp)
    if (onSaveRecipe) {
      onSaveRecipe(savedRecipe);
    }
  } catch (recipeError) {
    console.error("Error saving recipe:", recipeError);

    // Add error message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't save that recipe. Please try again.",
        timestamp: Date.now(),
      },
    ]);

    toast({
      title: "Error",
      description: "Failed to save recipe.",
      variant: "destructive",
    });
  }
}
```

### Phase 4: GroceryApp Updates

#### File: `src/components/GroceryApp.tsx`

**Changes:**

1. Pass `history` prop to `ChatPanel` component
2. Add `onSaveRecipe` callback to refresh saved recipes

**Updated ChatPanel Usage:**

```typescript
<ChatPanel
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  items={items}
  savedRecipes={savedRecipes}
  history={history} // NEW
  activeView={activeView}
  viewMode={viewMode}
  onCreateList={async (listItems, clearExisting) => {
    // Refresh items from database when list is updated
    if (user) {
      try {
        const activeList = await listsApi.getActive();
        if (activeList) {
          const updatedItems: ShoppingItem[] = activeList.items.map((item: any) => ({
            id: item.id || Math.random().toString(36).substr(2, 9),
            name: item.name,
            completed: item.completed || false,
            quantity: item.quantity,
            unit: item.unit
          }));
          setItems(updatedItems);
        }
      } catch (error) {
        console.error('Failed to refresh list:', error);
      }
    }
  }}
  onSaveRecipe={async (recipe: SavedRecipe) => {
    // Refresh saved recipes from database
    if (user) {
      try {
        const dbRecipes = await recipesApi.getAll();
        const savedRecipesWithTimestamp: SavedRecipe[] = dbRecipes.map((dbRecipe: any) => ({
          id: dbRecipe.id,
          name: dbRecipe.name,
          description: '',
          ingredients: dbRecipe.ingredients,
          instructions: dbRecipe.instructions,
          servings: dbRecipe.servings,
          prepTime: dbRecipe.prepTime?.toString(),
          cookTime: dbRecipe.cookTime?.toString(),
          savedAt: new Date(dbRecipe.createdAt).getTime()
        }));
        setSavedRecipes(savedRecipesWithTimestamp);
      } catch (error) {
        console.error('Failed to refresh recipes:', error);
      }
    }
  }}
/>
```

## Expected User Experience

### Recipe Saving

1. User asks ChefAI: "Can you give me a recipe for chicken stir fry?"
2. ChefAI provides the recipe
3. User says: "Save this recipe"
4. ChefAI calls `save_recipe` function
5. Recipe is saved to database
6. ChefAI confirms: "I've saved 'Chicken Stir Fry' to your recipes!"
7. Toast notification appears
8. Recipe appears in Saved Recipes tab

### Shopping History Awareness

1. User asks: "What should I cook this week?"
2. ChefAI analyzes shopping history
3. ChefAI notices user frequently buys pasta, tomatoes, and basil
4. ChefAI suggests: "Based on your recent shopping trips, you seem to enjoy Italian dishes. How about a pasta dish? I can save a recipe for you if you'd like."
5. User agrees and ChefAI saves the recipe

### Personalized Recommendations

1. User asks: "I have chicken and rice, what can I make?"
2. ChefAI checks saved recipes and shopping history
3. ChefAI suggests recipes that match user's preferences
4. ChefAI offers to save the recommended recipe

## Technical Considerations

### Privacy & Data

- Shopping history is user-specific (filtered by userId in backend)
- Recipes are user-specific (filtered by userId in backend)
- No cross-user data access

### Performance

- Shopping history is limited to last 5 lists in context to avoid token limits
- Full history is available in UI but summarized for ChefAI
- Debounced API calls to prevent excessive requests

### Error Handling

- Graceful fallback to localStorage if database fails
- User-friendly error messages
- Toast notifications for all actions
- Retry logic for failed operations

### Edge Cases

- User not authenticated: Save to localStorage only
- Recipe already saved: Show warning message
- Empty shopping history: Handle gracefully
- Large shopping history: Summarize for context

## Testing Checklist

- [ ] ChefAI can save recipes from conversation
- [ ] ChefAI can access shopping history
- [ ] ChefAI makes personalized recommendations based on history
- [ ] Recipe saving works for authenticated users
- [ ] Recipe saving works for unauthenticated users (localStorage)
- [ ] Toast notifications appear correctly
- [ ] Saved recipes appear in Saved Recipes tab
- [ ] Shopping history is properly summarized in context
- [ ] Error handling works correctly
- [ ] No duplicate recipes are saved

## Future Enhancements

1. **Recipe Recommendations Based on History**: ChefAI could suggest recipes based on frequently purchased ingredients
2. **Meal Planning**: ChefAI could suggest weekly meal plans based on shopping patterns
3. **Shopping List Templates**: Create reusable shopping list templates based on history
4. **Recipe Variations**: Suggest variations of saved recipes
5. **Ingredient Substitutions**: Suggest substitutions based on what user typically buys

## Summary

This enhancement will make ChefAI significantly more intelligent and personalized by:

- Enabling recipe saving directly from conversations
- Providing access to shopping history for context awareness
- Allowing personalized recommendations based on user patterns
- Creating a more seamless and integrated user experience

The implementation follows existing patterns in the codebase and maintains consistency with current ChefAI functionality.
