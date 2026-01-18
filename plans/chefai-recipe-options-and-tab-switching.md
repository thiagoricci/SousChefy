# ChefAI Recipe Options and Tab Switching

## Overview

Enhance ChefAI to show recipe options instead of full recipes in chat, and enable ChefAI to switch to the RecipeTab to display results.

## Requirements

### 1. Recipe Options Only in Chat

- When user asks for recipes (general request), ChefAI should respond with only 5 recipe options
- Options should include dish name and brief description only
- No full recipes or instructions should be shown in chat
- ChefAI should switch to RecipeTab to display the options

### 2. Specific Recipe Handling

- When user asks for a specific recipe (e.g., "Give me a lasagna recipe"), ChefAI should:
  - Generate the full recipe with ingredients and instructions
  - Save it to saved recipes
  - Switch to RecipeTab to show the full recipe

### 3. Tab Switching Capability

- ChefAI should be able to switch to the "search" tab (RecipeTab)
- Recipe data should be passed to RecipeTab component
- User can view details, save, or add ingredients to shopping list from RecipeTab

## Implementation Plan

### Step 1: Add New OpenAI Function

**File**: `src/lib/openai.ts`

Add a new function `show_recipes_in_tab` to the tools array:

```typescript
{
  type: 'function' as const,
  function: {
    name: 'show_recipes_in_tab',
    description: 'Switch to recipe tab and display recipe options or full recipe',
    parameters: {
      type: 'object',
      properties: {
        recipes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Recipe name'
              },
              description: {
                type: 'string',
                description: 'Brief description of the recipe'
              },
              ingredients: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    quantity: { type: 'string' },
                    unit: { type: 'string' }
                  }
                },
                description: 'Recipe ingredients (required for full recipe)'
              },
              instructions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Step-by-step instructions (required for full recipe)'
              },
              prepTime: { type: 'string', description: 'Preparation time' },
              cookTime: { type: 'string', description: 'Cooking time' },
              servings: { type: 'number', description: 'Number of servings' },
              difficulty: { type: 'string', description: 'Difficulty level' }
            }
          },
          description: 'Array of recipes to display'
        },
        mode: {
          type: 'string',
          enum: ['options', 'full'],
          description: 'Mode: "options" for 5 dish names only, "full" for complete recipe'
        }
      },
      required: ['recipes', 'mode']
    }
  }
}
```

### Step 2: Update ChefAI System Prompt

**File**: `src/lib/openai.ts`

Update `buildChefAISystemPrompt` function to include:

```typescript
**RECIPE REQUESTS INSTRUCTIONS**:
When user asks for recipes (general request like "What can I cook?", "Give me some recipe ideas", "I need dinner ideas"):
1. Generate 5 recipe options with names and brief descriptions
2. Call show_recipes_in_tab function with mode="options"
3. Provide a brief conversational response (e.g., "I've found 5 recipe ideas for you!")
4. DO NOT include full recipes or instructions in chat

When user asks for a specific recipe (e.g., "Give me a lasagna recipe", "How do I make chicken stir fry?"):
1. Generate the full recipe with all details
2. Call save_recipe function to save it to user's recipes
3. Call show_recipes_in_tab function with mode="full" and the complete recipe
4. Provide a brief confirmation (e.g., "I've saved the lasagna recipe and opened it for you!")
5. DO NOT include full recipe in chat - it's available in the recipe tab
```

### Step 3: Update ChatPanel to Handle Function Call

**File**: `src/components/ChatPanel.tsx`

Add handler for `show_recipes_in_tab` function call:

```typescript
// Handle show_recipes_in_tab function call
if (functionName === "show_recipes_in_tab") {
  const { recipes, mode } = args;

  try {
    // Convert recipes to Recipe format
    const recipeData: Recipe[] = recipes.map((r: any, index: number) => ({
      id: r.id || `${Date.now()}-${index}`,
      name: r.name,
      description: r.description || "",
      ingredients: r.ingredients || [],
      instructions: r.instructions || [],
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
      difficulty: r.difficulty,
    }));

    // Call callback to switch to recipe tab and display recipes
    if (onShowRecipesInTab) {
      onShowRecipesInTab(recipeData, mode);
    }

    // Append confirmation to chat
    const confirmationMessage =
      mode === "options"
        ? `\n\nI've found ${recipes.length} recipe options for you! Check them out in the Recipe tab.`
        : `\n\nI've saved the recipe "${recipes[0]?.name}" and opened it for you!`;

    setMessages((prev) => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        return [
          ...prev.slice(0, -1),
          {
            ...lastMessage,
            content: lastMessage.content + confirmationMessage,
          },
        ];
      }
      return [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: confirmationMessage.trim(),
          timestamp: Date.now(),
        },
      ];
    });
  } catch (error) {
    console.error("Error showing recipes in tab:", error);

    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I couldn't display those recipes. Please try again.",
        timestamp: Date.now(),
      },
    ]);

    toast({
      title: "Error",
      description: "Failed to display recipes in recipe tab.",
      variant: "destructive",
    });
  }
}
```

Update ChatPanelProps interface:

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
}
```

### Step 4: Update GroceryApp to Handle Tab Switching

**File**: `src/components/GroceryApp.tsx`

Add state and handler for recipe tab switching:

```typescript
const [externalRecipes, setExternalRecipes] = useState<Recipe[] | null>(null);
const [externalRecipeMode, setExternalRecipeMode] = useState<
  "options" | "full" | null
>(null);

const handleShowRecipesInTab = useCallback(
  (recipes: Recipe[], mode: "options" | "full") => {
    setExternalRecipes(recipes);
    setExternalRecipeMode(mode);
    setActiveView("search");
    setSelectedRecipe(null);
  },
  [],
);
```

Update ChatPanel props:

```typescript
<ChatPanel
  // ... existing props
  onShowRecipesInTab={handleShowRecipesInTab}
/>
```

Update RecipeTab rendering:

```typescript
{activeView === 'search' && (
  <div className="space-y-4 animate-fade-in">
    <div className="text-center">
      <p className="text-lg md:text-xl font-semibold text-muted-foreground">
        AI-Powered Recipes
      </p>
    </div>
    {selectedRecipe ? (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        onAddToShoppingList={handleAddRecipeIngredients}
        onSaveRecipe={() => handleSaveRecipe(selectedRecipe)}
        isSaved={savedRecipes.some(r => r.id === selectedRecipe.id)}
      />
    ) : (
      <RecipeTab
        onAddIngredients={handleAddRecipeIngredients}
        onSaveRecipe={handleSaveRecipe}
        isRecipeSaved={(recipeId) => savedRecipes.some(r => r.id === recipeId)}
        externalRecipes={externalRecipes}
        externalMode={externalRecipeMode}
        onClearExternalRecipes={() => {
          setExternalRecipes(null);
          setExternalRecipeMode(null);
        }}
      />
    )}
  </div>
)}
```

### Step 5: Update RecipeTab to Accept External Data

**File**: `src/components/RecipeTab.tsx`

Update RecipeTabProps interface:

```typescript
export interface RecipeTabProps {
  onAddIngredients: (ingredients: RecipeIngredient[]) => void;
  onSaveRecipe?: (recipe: SavedRecipe) => void;
  isRecipeSaved?: (recipeId: string) => boolean;
  externalRecipes?: Recipe[] | null;
  externalMode?: "options" | "full" | null;
  onClearExternalRecipes?: () => void;
}
```

Update component to handle external recipes:

```typescript
export const RecipeTab: React.FC<RecipeTabProps> = ({
  onAddIngredients,
  onSaveRecipe,
  isRecipeSaved,
  externalRecipes,
  externalMode,
  onClearExternalRecipes
}) => {
  const [searchMode, setSearchMode] = useState<'dish' | 'ingredients'>('dish');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Use external recipes if provided
  useEffect(() => {
    if (externalRecipes) {
      setRecipes(externalRecipes);
      if (externalMode === 'full' && externalRecipes.length > 0) {
        setSelectedRecipe(externalRecipes[0]);
      }
    }
  }, [externalRecipes, externalMode]);

  // Clear external recipes when user starts new search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    onClearExternalRecipes?.();
    setIsLoading(true);
    setError(null);
    setRecipes([]);
    setSelectedRecipe(null);

    // ... existing search logic
  };
```

Update the render to show external recipes indicator:

```typescript
{externalRecipes && (
  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
    <div className="flex items-center justify-between">
      <p className="text-sm text-blue-800 dark:text-blue-200">
        {externalMode === 'options'
          ? `Showing ${externalRecipes.length} recipe suggestions from ChefAI`
          : 'Showing recipe from ChefAI'}
      </p>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearExternalRecipes}
        className="text-blue-600 dark:text-blue-400"
      >
        Clear
      </Button>
    </div>
  </div>
)}
```

### Step 6: Import Recipe Type

**File**: `src/components/ChatPanel.tsx`

Add import:

```typescript
import type { Recipe } from "@/types/recipe";
```

## Testing Scenarios

### Scenario 1: General Recipe Request

**User Input**: "What can I cook for dinner?"

**Expected Behavior**:

1. ChefAI responds with brief message: "I've found 5 recipe ideas for you!"
2. ChefAI calls `show_recipes_in_tab` with 5 recipe options (mode="options")
3. App switches to RecipeTab
4. RecipeTab displays 5 recipe cards with names and descriptions
5. User can click on any recipe to see full details

### Scenario 2: Specific Recipe Request

**User Input**: "Give me a lasagna recipe"

**Expected Behavior**:

1. ChefAI generates full lasagna recipe
2. ChefAI calls `save_recipe` to save it
3. ChefAI calls `show_recipes_in_tab` with full recipe (mode="full")
4. ChefAI responds: "I've saved the lasagna recipe and opened it for you!"
5. App switches to RecipeTab
6. RecipeDetail shows full recipe with ingredients and instructions
7. Recipe appears in Saved Recipes tab

### Scenario 3: Recipe Options Interaction

**User Input**: "I need some breakfast ideas"

**Expected Behavior**:

1. ChefAI shows 5 breakfast recipe options in RecipeTab
2. User clicks on a recipe card
3. RecipeDetail opens with full details
4. User can:
   - Add ingredients to shopping list
   - Save recipe to saved recipes
   - Go back to options

## Files to Modify

1. `src/lib/openai.ts` - Add new function and update system prompt
2. `src/components/ChatPanel.tsx` - Handle new function call
3. `src/components/GroceryApp.tsx` - Add state and handler for tab switching
4. `src/components/RecipeTab.tsx` - Accept and display external recipes
5. `src/types/chefai.ts` - No changes needed (Recipe type already exists)

## Benefits

1. **Better UX**: Users see recipe options in a dedicated tab with better UI
2. **Reduced Chat Clutter**: Full recipes don't clutter the chat interface
3. **More Features**: Users can interact with recipes (save, add to list) directly from RecipeTab
4. **Consistent Experience**: Recipe requests flow through the same UI as manual recipe searches
5. **Improved Discoverability**: Users can explore recipe options before committing to one

## Edge Cases to Handle

1. **No recipes found**: ChefAI should handle gracefully and inform user
2. **API errors**: Proper error handling and user feedback
3. **Duplicate recipes**: Check if recipe already exists before saving
4. **Empty recipe list**: Show helpful message when no recipes are available
5. **Clear external recipes**: When user starts new search, clear ChefAI-provided recipes
