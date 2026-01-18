# Recipe Search Enhancement: Multiple Options & Source Display

## Overview

Enhance the recipe search functionality to show multiple recipe options when searching by dish name and display the source of each recipe.

## Current State Analysis

### Existing Implementation

1. **`generateRecipeByDish`** (src/lib/openai.ts):
   - Returns a SINGLE recipe based on dish name
   - No source information included
   - Function signature: `generateRecipeByDish(dishName: string): Promise<Recipe>`

2. **`recommendRecipesByIngredients`** (src/lib/openai.ts):
   - Returns 5 recipes based on ingredients
   - No source information included
   - Function signature: `recommendRecipesByIngredients(ingredients: string[]): Promise<Recipe[]>`

3. **Recipe Interface** (src/types/recipe.ts & src/lib/openai.ts):
   - Missing `source` field
   - Contains: id, name, description, ingredients, instructions, prepTime, cookTime, servings, difficulty

4. **RecipeTab Component** (src/components/RecipeTab.tsx):
   - Dish search: Sets `recipes([recipe])` - only one recipe
   - Ingredients search: Sets `recipes(results)` - multiple recipes
   - RecipeCard: Does not display source information

5. **RecipeCard Component** (src/components/RecipeTab.tsx):
   - Displays: name, description, prepTime, servings, difficulty, ingredient count
   - Missing: source information

## Proposed Changes

### 1. Add `source` Field to Recipe Interface

**Files to modify:**

- `src/types/recipe.ts`
- `src/lib/openai.ts`

**Change:**

```typescript
export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  difficulty?: string;
  source?: string; // NEW: Track recipe source (e.g., "ChefAI", "OpenAI")
}
```

### 2. Modify `generateRecipeByDish` to Return Multiple Options

**File:** `src/lib/openai.ts`

**Changes:**

- Change return type from `Promise<Recipe>` to `Promise<Recipe[]>`
- Update function signature: `generateRecipeByDish(dishName: string): Promise<Recipe[]>`
- Update system prompt to request 5 variations of the dish
- Update JSON structure to return array of recipes
- Add source field to each recipe: `"source": "ChefAI"`
- Add IDs to all recipes in the array

**Updated System Prompt:**

```
You are a recipe generator. Generate 5 different recipe variations based on the dish name provided.

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Recipe Variation 1",
    "description": "Brief description",
    "ingredients": [...],
    "instructions": [...],
    "prepTime": "15 min",
    "cookTime": "30 min",
    "servings": 4,
    "difficulty": "Easy",
    "source": "ChefAI"
  },
  ...
]

Requirements:
- Generate 5 different variations of the dish
- Each variation should have a unique style (e.g., traditional, quick, gourmet, healthy, etc.)
- Include 5-10 ingredients per recipe
- Include 5-8 clear instructions per recipe
- Provide prep time, cook time, servings, and difficulty
- Set source to "ChefAI"
- Return ONLY valid JSON array, no additional text
```

### 3. Update `recommendRecipesByIngredients` to Include Source

**File:** `src/lib/openai.ts`

**Changes:**

- Add `"source": "ChefAI"` to the JSON structure in system prompt
- Update requirements to include source field

**Updated System Prompt:**

```
Requirements:
- Generate 5 different recipe ideas
- Use all or most of the provided ingredients
- Include 5-10 ingredients per recipe
- Include 5-8 clear instructions per recipe
- Provide prep time, cook time, servings, and difficulty
- Set source to "ChefAI"
- Return ONLY valid JSON array, no additional text
```

### 4. Update RecipeCard to Display Source

**File:** `src/components/RecipeTab.tsx`

**Changes:**

- Add source display in RecipeCard component
- Position source below recipe name or in the metadata section
- Use appropriate icon (e.g., `ChefHat` or `Sparkles`)
- Style source badge with distinct color (e.g., blue or purple)

**Implementation:**

```tsx
// Add to imports
import { ChefHat } from "lucide-react";

// In RecipeCard component, add source display:
{
  recipe.source && (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <ChefHat className="w-3 h-3" />
      <span>{recipe.source}</span>
    </div>
  );
}
```

### 5. Update RecipeTab to Handle Multiple Recipes from Dish Search

**File:** `src/components/RecipeTab.tsx`

**Changes:**

- Update `handleSearch` function to handle array from `generateRecipeByDish`
- Remove the single-recipe wrapping: `setRecipes([recipe])` → `setRecipes(recipe)`

**Current code (line 51-53):**

```typescript
if (searchMode === "dish") {
  const recipe = await generateRecipeByDish(searchQuery);
  setRecipes([recipe]);
}
```

**Updated code:**

```typescript
if (searchMode === "dish") {
  const recipes = await generateRecipeByDish(searchQuery);
  setRecipes(recipes);
}
```

## Implementation Steps

### Step 1: Update Type Definitions

1. Add `source?: string` to Recipe interface in `src/types/recipe.ts`
2. Add `source?: string` to Recipe interface in `src/lib/openai.ts`

### Step 2: Update OpenAI Functions

1. Modify `generateRecipeByDish`:
   - Change return type to `Promise<Recipe[]>`
   - Update system prompt to request 5 variations
   - Update JSON structure to return array
   - Add source field
   - Add IDs to all recipes

2. Modify `recommendRecipesByIngredients`:
   - Add source field to system prompt
   - Ensure all returned recipes include source

### Step 3: Update RecipeTab Component

1. Update `handleSearch` to handle array from dish search
2. Update RecipeCard to display source information

### Step 4: Test Implementation

1. Test dish search with various queries (e.g., "chicken", "pasta", "salad")
2. Verify 5 recipe options are displayed
3. Verify source information is shown on each card
4. Test ingredients search to ensure source is displayed
5. Test recipe selection and detail view
6. Test saving recipes with source information

## User Experience Flow

### Before Changes

1. User searches "chicken stir fry"
2. Single recipe appears
3. User clicks to view details
4. No source information shown

### After Changes

1. User searches "chicken stir fry"
2. 5 recipe variations appear (Traditional, Quick, Healthy, Gourmet, etc.)
3. Each card shows:
   - Recipe name
   - Description
   - Source badge (ChefAI)
   - Prep time, servings, difficulty
   - Ingredient count
4. User can browse all options and select preferred variation
5. User knows recipe is AI-generated

## Technical Considerations

### API Cost

- Returning 5 recipes instead of 1 increases API cost
- `max_tokens` may need adjustment (currently 1000 for single recipe)
- Consider increasing to 2000-2500 for 5 recipes

### Performance

- More recipes = more rendering
- Consider pagination or lazy loading if performance issues arise
- Current implementation should handle 5 recipes efficiently

### Consistency

- Ensure both search modes (dish & ingredients) return same number of options
- Both should include source information
- Consistent styling across all recipe cards

## Edge Cases to Handle

1. **API Errors**: Graceful error handling if OpenAI fails
2. **Invalid JSON**: Robust parsing with fallback
3. **Empty Results**: Show "no recipes found" message
4. **Duplicate Recipes**: Ensure variations are unique
5. **Missing Source**: Handle cases where source is undefined

## Future Enhancements

1. **Recipe Sources**: Expand to include real recipe sources (e.g., "AllRecipes", "Food Network")
2. **Recipe Ratings**: Add rating information from external APIs
3. **Recipe Images**: Add image URLs to recipe cards
4. **Recipe Filters**: Allow filtering by source, difficulty, time
5. **Recipe Collections**: Group recipes by source or category

## Success Criteria

✅ Dish search returns 5 recipe options
✅ Each recipe card displays source information
✅ Source badge is visually distinct and informative
✅ User can select preferred recipe from options
✅ No breaking changes to existing functionality
✅ Performance remains acceptable with 5 recipes
✅ Error handling works correctly
