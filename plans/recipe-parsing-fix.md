# Recipe Parsing Fix - Implementation Plan

## Problem Statement

The recipe parsing functionality in `src/lib/openai.ts` fails to parse recipes from AI responses due to several issues:

- Greedy regex matching captures invalid JSON
- No validation of parsed recipe data structure
- Poor error messages that don't help with debugging
- No fallback strategies for different AI response formats

## Root Causes

1. **Greedy Regex**: `/\[[\s\S]*\]/` matches from first `[` to last `]` in entire content
2. **No JSON Validation**: No validation to ensure parsed data matches `Recipe` interface
3. **Tool Call Handling**: When AI makes tool calls, `content` field might be empty
4. **Poor Error Messages**: Generic errors don't help with debugging
5. **No Fallback Strategies**: Only one parsing method used

## Solution Design

### 1. Multiple JSON Extraction Methods

Implement a function `extractJSONFromResponse()` that tries multiple extraction strategies in order:

````typescript
function extractJSONFromResponse(content: string): string | null {
  // Strategy 1: Extract from code blocks (```json ... ```)
  // Strategy 2: Find JSON array with proper bracket matching (non-greedy)
  // Strategy 3: Try parsing entire content as JSON
  // Return first successful extraction or null
}
````

**Strategies in order:**

1. **Code Block Extraction**: Look for `json ... ` or `...` blocks
2. **Non-greedy Array Matching**: Use `/\[[^\]]*(?:\[[^\]]*\][^\]]*)*\]/s` to match properly nested arrays
3. **Full Content Parsing**: Try parsing entire content as JSON

### 2. Recipe Data Validation

Implement a function `validateRecipe()` to ensure each recipe has required fields:

```typescript
function validateRecipe(recipe: any): recipe is Recipe {
  // Check required fields: name, description, ingredients, instructions
  // Check ingredients is array of valid RecipeIngredient objects
  // Check instructions is array of strings
  // Validate optional fields if present
  // Return true if valid, false otherwise
}
```

**Validation Rules:**

- Required fields: `name` (string), `description` (string), `ingredients` (array), `instructions` (array)
- `ingredients` must be array of objects with `name` (string), optional `quantity` and `unit`
- `instructions` must be array of strings
- Optional fields: `prepTime`, `cookTime`, `servings`, `difficulty`, `source`, `url`

### 3. Comprehensive Error Handling

Implement detailed error messages:

```typescript
function parseRecipesFromAIResponse(content: string): Recipe[] {
  // Try extraction strategies
  // If extraction fails: "Failed to extract JSON from AI response"
  // If JSON.parse fails: "Failed to parse JSON: [error message]"
  // If validation fails: "Invalid recipe structure: [details]"
  // Log raw response for debugging
  // Return array of valid recipes (partial success)
}
```

**Error Message Examples:**

- "Failed to extract JSON from AI response. Raw content: [first 200 chars]"
- "Failed to parse JSON: Unexpected token } at position 123"
- "Invalid recipe structure: Recipe at index 2 missing required field 'name'"
- "Parsed 3 out of 5 recipes successfully. Invalid recipes at indices: 1, 4"

### 4. Tool Call Handling

Improve tool call handling:

```typescript
if (message.tool_calls && message.tool_calls.length > 0) {
  // Log tool call details for debugging
  console.log("AI requested tool calls:", message.tool_calls);
  // If content is empty, throw specific error
  if (!content || content.trim() === "") {
    throw new Error(
      "AI requested tool execution but no response content provided",
    );
  }
}
```

## Implementation Steps

### Step 1: Create Helper Functions

Create utility functions in `src/lib/openai.ts`:

1. `extractJSONFromResponse(content: string): string | null`
2. `validateRecipe(recipe: any): recipe is Recipe`
3. `validateRecipeArray(recipes: any[]): Recipe[]`

### Step 2: Update `generateRecipeByDish()`

Replace current parsing logic with new robust parsing:

```typescript
const content = message.content || "";

// Log raw response for debugging
console.log("Raw AI response:", content);

// Extract JSON using multiple strategies
const jsonString = extractJSONFromResponse(content);
if (!jsonString) {
  throw new Error("Failed to extract JSON from AI response");
}

// Parse JSON
let parsedRecipes: any[];
try {
  parsedRecipes = JSON.parse(jsonString);
} catch (error) {
  throw new Error(
    `Failed to parse JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
  );
}

// Validate and filter recipes
const validRecipes = validateRecipeArray(parsedRecipes);
if (validRecipes.length === 0) {
  throw new Error("No valid recipes found in AI response");
}

// Log partial success if applicable
if (validRecipes.length < parsedRecipes.length) {
  console.warn(
    `Parsed ${validRecipes.length} out of ${parsedRecipes.length} recipes successfully`,
  );
}

// Add IDs and return
return validRecipes.map((recipe, index) => ({
  ...recipe,
  id: `recipe-${Date.now()}-${index}`,
}));
```

### Step 3: Update `recommendRecipesByIngredients()`

Apply same parsing logic as `generateRecipeByDish()`.

### Step 4: Update Error Messages in UI

Update error display in `RecipeTab.tsx` to show more detailed errors:

```typescript
catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Failed to generate recipes';
  setError(errorMessage);
  toast({
    title: 'Error',
    description: errorMessage,
    variant: 'destructive'
  });
}
```

## Testing Strategy

### Test Cases

1. **Valid JSON in code block**: AI returns `json [...]`
2. **Valid JSON without code block**: AI returns `[...]` directly
3. **Invalid JSON structure**: AI returns malformed JSON
4. **Missing required fields**: Recipe missing `name` or `ingredients`
5. **Partial success**: Some recipes valid, some invalid
6. **Empty response**: AI returns empty content
7. **Tool call with no content**: AI requests tool execution but provides no content

### Expected Behavior

- Valid responses: Parse successfully, return all recipes
- Partial success: Return valid recipes, log warning about invalid ones
- Invalid responses: Throw descriptive error with details
- Empty/tool call responses: Throw specific error message

## Files to Modify

1. `src/lib/openai.ts` - Main implementation
2. `src/components/RecipeTab.tsx` - Error display improvements (optional)

## Benefits

1. **More Robust**: Handles multiple AI response formats
2. **Better Debugging**: Detailed error messages and logging
3. **Partial Success**: Returns valid recipes even if some are invalid
4. **Type Safety**: Validates data matches TypeScript interfaces
5. **User Experience**: Clear error messages help users understand issues

## Backward Compatibility

This change is backward compatible:

- Function signatures remain the same
- Return type remains `Recipe[]`
- Only internal implementation changes
- Error messages become more descriptive but still throw `Error`

## Future Enhancements

1. **Tool Execution**: Implement actual web_search tool execution
2. **Retry Logic**: Retry failed requests with different prompts
3. **Caching**: Cache successful recipe results
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Fallback Models**: Use cheaper model if primary model fails
