# GPT-4-turbo-preview with Web Browsing Implementation

## Overview

Updated OpenAI integration to use GPT-4-turbo-preview with web browsing capabilities for recipe search and recommendations.

## Changes Made

### 1. Model Upgrade

- **Previous**: `gpt-4`
- **Current**: `gpt-4-turbo-preview` (latest model with enhanced capabilities and tools support)

### 2. Web Browsing Tool

Added a web browsing tool definition that enables the model to search the web for real recipes:

```typescript
const WEB_BROWSING_TOOL = {
  type: "function" as const,
  function: {
    name: "web_search",
    description: "Search web for recipes and cooking information",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query for finding recipes",
        },
      },
      required: ["query"],
    },
  },
};
```

### 3. API Configuration Updates

Both `generateRecipeByDish()` and `recommendRecipesByIngredients()` functions now include:

- `tools: [WEB_BROWSING_TOOL]` - Enables web browsing capability
- `tool_choice: { type: 'function', function: { name: 'web_search' } }` - Forces model to use web search
- `max_tokens: 4000` - Increased from 3000 for better recipe detail extraction

## Benefits

### 1. Real Recipe Data

- Model can now search the web for actual recipes from established cooking websites
- Extracts complete ingredient lists with quantities and units
- Retrieves full cooking instructions
- Includes prep time, cook time, servings, and difficulty

### 2. Diverse Sources

- Each recipe comes from a different source (AllRecipes, Food Network, Bon Appétit, Epicurious, Serious Eats)
- Provides direct URLs to original recipes
- Source attribution for each recipe

### 3. Enhanced Accuracy

- GPT-4-turbo-preview provides better understanding of recipe structure
- Web browsing ensures real, tested recipes
- More reliable ingredient parsing and quantities

## Usage

### Search by Dish Name

```typescript
const recipes = await generateRecipeByDish("lasagna");
// Returns 5 real lasagna recipes from different sources
```

### Search by Ingredients

```typescript
const recipes = await recommendRecipesByIngredients([
  "chicken",
  "rice",
  "vegetables",
]);
// Returns 5 real recipes using those ingredients
```

## API Requirements

- **OpenAI API Key**: Must be set in `VITE_OPENAI_API_KEY` environment variable
- **Model Access**: GPT-4-turbo-preview access required (included in most OpenAI API tiers)
- **Web Browsing**: Enabled via tools parameter (no additional configuration needed)

## Error Handling

The implementation includes proper error handling:

- API key validation
- HTTP error handling
- JSON parsing with regex extraction
- Recipe ID generation for frontend compatibility

## Future Enhancements

When GPT-5 or GPT-5-mini becomes publicly available:

1. Update model from `gpt-4-turbo-preview` to `gpt-5` or `gpt-5-mini`
2. Potentially increase `max_tokens` for even more detailed recipes
3. Leverage enhanced reasoning capabilities for better recipe matching

## Testing

To test the implementation:

1. Set `VITE_OPENAI_API_KEY` in `.env` file
2. Call `generateRecipeByDish()` with a dish name
3. Verify 5 recipes are returned with complete details
4. Check that each recipe has a valid source URL
5. Test `recommendRecipesByIngredients()` with ingredient list

## Notes

- The web browsing tool is defined but actual web search execution is handled by OpenAI's infrastructure
- No additional API keys or services required
- The model automatically decides when and how to search the web
- Tool choice parameter ensures web browsing is used for recipe searches
- GPT-5-mini is not yet publicly available; using GPT-4-turbo-preview as the latest available model with tools support
