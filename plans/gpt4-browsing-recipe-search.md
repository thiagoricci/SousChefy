# GPT-4 Browsing Integration for Real Recipe Search

## Overview

Enhance recipe search functionality to use GPT-4 with browsing capability to find real recipes from the web, providing users with authentic recipes from established cooking websites with proper source attribution and links.

## Current State

### Existing Implementation

- **Model**: `gpt-4o-mini` (no internet access)
- **Source**: All recipes are AI-generated with source="ChefAI"
- **Limitations**: No real recipes from established cooking websites, no links to original recipes
- **Functionality**: Returns 5 AI-generated recipe variations

### Desired State

- **Model**: `gpt-4` with browsing capability
- **Source**: Real recipes from cooking websites (AllRecipes, Food Network, etc.)
- **Benefits**: Authentic recipes, proper attribution, links to original sources
- **Functionality**: Returns 5 real recipes from web search

## Proposed Changes

### 1. Update Recipe Interface

**Files to modify:**

- `src/types/recipe.ts`
- `src/lib/openai.ts`

**Changes:**

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
  source?: string;
  url?: string; // NEW: Link to original recipe
}
```

### 2. Update OpenAI Model Configuration

**File:** `src/lib/openai.ts`

**Changes:**

- Change model from `'gpt-4o-mini'` to `'gpt-4'`
- Add browsing capability configuration
- Update system prompts to instruct model to search the web

### 3. Update `generateRecipeByDish` Function

**File:** `src/lib/openai.ts`

**Changes:**

- Update system prompt to request web search for real recipes
- Add `url` field to JSON structure
- Update source tracking to show actual website names
- Increase `max_tokens` to accommodate web search results

**Updated System Prompt:**

```
You are a recipe finder with web browsing capability. Search the web for real recipes based on dish name provided.

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Recipe Name",
    "description": "Brief description from the original recipe",
    "ingredients": [
      {"name": "ingredient name", "quantity": "amount", "unit": "unit"},
      ...
    ],
    "instructions": [
      "Step 1",
      "Step 2",
      ...
    ],
    "prepTime": "15 min",
    "cookTime": "30 min",
    "servings": 4,
    "difficulty": "Easy",
    "source": "AllRecipes.com",  // Actual website name
    "url": "https://www.allrecipes.com/..."  // Direct link to recipe
  },
  ...
]

Requirements:
- Search the web for 5 different real recipes from established cooking websites
- Each recipe should be from a different source (e.g., AllRecipes, Food Network, Bon Appétit, Epicurious, Serious Eats)
- Extract complete ingredient lists with quantities and units
- Extract full cooking instructions
- Include prep time, cook time, servings, and difficulty from the original recipe
- Set source to the actual website name (e.g., "AllRecipes.com", "Food Network")
- Include the direct URL to the original recipe
- Return ONLY valid JSON array, no additional text
```

### 4. Update `recommendRecipesByIngredients` Function

**File:** `src/lib/openai.ts`

**Changes:**

- Update system prompt to request web search for real recipes
- Add `url` field to JSON structure
- Update source tracking to show actual website names

**Updated System Prompt:**

```
You are a recipe finder with web browsing capability. Search the web for real recipes using the provided ingredients.

Return ONLY a JSON array with this exact structure:
[
  {
    "name": "Recipe Name",
    "description": "Brief description from the original recipe",
    "ingredients": [
      {"name": "ingredient name", "quantity": "amount", "unit": "unit"},
      ...
    ],
    "instructions": [
      "Step 1",
      "Step 2",
      ...
    ],
    "prepTime": "15 min",
    "cookTime": "30 min",
    "servings": 4,
    "difficulty": "Easy",
    "source": "AllRecipes.com",  // Actual website name
    "url": "https://www.allrecipes.com/..."  // Direct link to recipe
  },
  ...
]

Requirements:
- Search the web for 5 different real recipes using the provided ingredients
- Each recipe should be from a different source (e.g., AllRecipes, Food Network, Bon Appétit, Epicurious, Serious Eats)
- Use all or most of the provided ingredients
- Extract complete ingredient lists with quantities and units
- Extract full cooking instructions
- Include prep time, cook time, servings, and difficulty from the original recipe
- Set source to the actual website name (e.g., "AllRecipes.com", "Food Network")
- Include the direct URL to the original recipe
- Return ONLY valid JSON array, no additional text
```

### 5. Update RecipeCard Component

**File:** `src/components/RecipeTab.tsx`

**Changes:**

- Make recipe name clickable if URL is available
- Add external link icon (e.g., `ExternalLink` from lucide-react)
- Update source display to show actual website names
- Add hover state to indicate clickable links

**Updated RecipeCard:**

```tsx
import { ExternalLink } from "lucide-react"; // Add to imports

// In RecipeCard component:
<div className="flex-1">
  {recipe.url ? (
    <a
      href={recipe.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
      onClick={(e) => e.stopPropagation()}
    >
      <h4 className="text-lg font-semibold hover:text-primary transition-colors flex items-center gap-2">
        {recipe.name}
        <ExternalLink className="w-4 h-4" />
      </h4>
    </a>
  ) : (
    <h4 className="text-lg font-semibold">{recipe.name}</h4>
  )}
  {recipe.source && (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
      <ChefHat className="w-3 h-3" />
      <span>{recipe.source}</span>
    </div>
  )}
  <p className="text-sm text-muted-foreground line-clamp-2">
    {recipe.description}
  </p>
</div>;
```

### 6. Update RecipeDetail Component

**File:** `src/components/RecipeDetail.tsx`

**Changes:**

- Add "View Original Recipe" button if URL is available
- Display source information prominently
- Link to external recipe website

**Add to RecipeDetail:**

```tsx
{
  recipe.url && (
    <Button asChild variant="outline" className="w-full mt-4">
      <a
        href={recipe.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        View Original Recipe on {recipe.source}
      </a>
    </Button>
  );
}
```

## Implementation Steps

### Step 1: Update Type Definitions

1. Add `url?: string` field to Recipe interface in `src/types/recipe.ts`
2. Add `url?: string` field to Recipe interface in `src/lib/openai.ts`

### Step 2: Update OpenAI Configuration

1. Change model from `'gpt-4o-mini'` to `'gpt-4'` in both functions
2. Update system prompts to request web search
3. Add URL field to JSON structure
4. Update source tracking requirements

### Step 3: Update RecipeCard Component

1. Add `ExternalLink` icon to imports
2. Make recipe name clickable if URL is available
3. Add external link icon to recipe name
4. Update source display styling

### Step 4: Update RecipeDetail Component

1. Add "View Original Recipe" button
2. Display source information prominently
3. Link to external recipe website

### Step 5: Test Implementation

1. Test dish search with various queries
2. Verify recipes are from real websites
3. Test clicking recipe names opens external links
4. Test "View Original Recipe" button
5. Verify source information is displayed correctly
6. Test ingredients search with web results

## Technical Considerations

### API Cost

- **GPT-4 with browsing**: Higher cost than GPT-4o-mini
- **Web search**: Additional tokens for browsing results
- **Recommendation**: Monitor API usage and consider caching

### Performance

- **Web search**: Slower than AI generation (requires browsing)
- **Loading states**: Ensure clear loading indicators
- **Error handling**: Handle web search failures gracefully

### Reliability

- **Website availability**: Some recipes may be from sites that are down
- **Link rot**: URLs may become outdated over time
- **Fallback**: Consider keeping AI generation as backup option

### User Experience

- **External links**: Users navigate away from app
- **Attribution**: Clear source attribution builds trust
- **Variety**: Multiple sources provide diverse options

## Edge Cases to Handle

1. **No web results**: Fallback to AI-generated recipes
2. **Invalid URLs**: Validate URLs before displaying
3. **Missing source data**: Display "Unknown source" instead of undefined
4. **Duplicate recipes**: Deduplicate results from same source
5. **Rate limiting**: Handle API rate limits gracefully

## Future Enhancements

1. **Source filtering**: Allow users to filter by preferred recipe sources
2. **Recipe ratings**: Display ratings from original websites
3. **Recipe images**: Display images from original recipes
4. **Recipe reviews**: Show user reviews from source websites
5. **Offline mode**: Cache popular recipes for offline access
6. **Recipe collections**: Save favorite recipes with source attribution

## Success Criteria

✅ GPT-4 with browsing is configured
✅ Web search returns 5 real recipes
✅ Each recipe has a valid URL
✅ Source information shows actual website names
✅ Recipe names are clickable links
✅ "View Original Recipe" button works
✅ No breaking changes to existing functionality
✅ Error handling for web search failures
✅ Fallback to AI generation if needed

## Security Considerations

1. **External links**: Use `rel="noopener noreferrer"` for security
2. **URL validation**: Validate URLs before displaying
3. **XSS prevention**: Sanitize user inputs
4. **API keys**: Keep OpenAI API key secure

## Testing Checklist

- [ ] Dish search returns 5 real recipes
- [ ] Each recipe has valid URL
- [ ] Source names are accurate (e.g., "AllRecipes.com")
- [ ] Clicking recipe name opens external link
- [ ] "View Original Recipe" button works
- [ ] Ingredients search returns real recipes
- [ ] Loading states display correctly
- [ ] Error handling works for web search failures
- [ ] Fallback to AI generation works if needed
- [ ] Build completes without TypeScript errors
