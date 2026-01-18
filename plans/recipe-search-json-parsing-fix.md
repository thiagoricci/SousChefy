# Recipe Search JSON Parsing Fix

## Issue

When users tried to find recipes by ingredients, they encountered the error:

```
Failed to extract JSON from AI response. The AI may have returned text instead of JSON, or the JSON format was not recognized.
```

## Root Cause Analysis

The error occurred in `parseRecipesFromAIResponse` function when `extractJSONFromResponse` returned `null`. Main issues identified:

1. **Deprecated Model**: Using `gpt-4-turbo-preview` which may have changed behavior or been deprecated
2. **Weak System Prompt**: The prompt asked for "ONLY JSON" but OpenAI sometimes added conversational text
3. **Limited JSON Extraction**: Only handled 3 specific formats, missing edge cases
4. **No Debugging**: No way to see what the AI actually returned
5. **Insufficient Error Handling**: Limited error messages made debugging difficult

## Solution Implemented

### 1. Updated OpenAI Model

- **Changed from**: `gpt-4-turbo-preview`
- **Changed to**: `gpt-4o-mini`
- **Benefits**: Faster, cheaper, more reliable, better at following JSON instructions

### 2. Strengthened System Prompts

- Added explicit code block requirement: `\`\`\`json ... \`\`\``
- Added "CRITICAL" emphasis on JSON-only output
- Provided clear example of expected format
- Removed ambiguous language that allowed conversational text

**Example of new prompt structure:**

```
CRITICAL: You MUST return ONLY a valid JSON array. No conversational text, no explanations, no markdown formatting outside of JSON.

Return the JSON array wrapped in code blocks like this:
\`\`\`json
[
  {
    "name": "Recipe Name",
    ...
  }
]
\`\`\`
```

### 3. Enhanced JSON Extraction Logic

Added 5 extraction strategies (up from 3):

**Strategy 1**: Extract from code blocks

````typescript
const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
````

**Strategy 2**: Find JSON array with bracket matching

```typescript
const arrayMatch = findJSONArray(content);
```

**Strategy 3**: Direct JSON at start of content

```typescript
if (trimmedContent.startsWith('[') || trimmedContent.startsWith('{'))
```

**Strategy 4**: Extract JSON after conversational text

```typescript
const jsonIntroMatch = content.match(
  /(?:json|response|result|data|output)[\s:]*([\s\S]*?)(?:\n\n|\n[A-Z]|\n\d+\.|$)/i,
);
```

**Strategy 5**: Find any JSON-like structure

```typescript
const anyJsonMatch = content.match(/[\[\{][\s\S]*?[\]\}]/);
```

### 4. Added Comprehensive Debug Logging

- Logs all extraction attempts
- Shows raw content preview
- Indicates which strategy succeeded
- Logs full content when all strategies fail
- Only active in development mode (`import.meta.env.DEV`)

**Example debug output:**

```
[OpenAI Debug] Attempting to extract JSON from response
[OpenAI Debug] Raw content length: 1234
[OpenAI Debug] Content preview: Here are 5 recipes using chicken...
[OpenAI Debug] Strategy 1 (code block): SUCCESS
[OpenAI Debug] Successfully parsed 5 valid recipe(s)
```

### 5. Improved Error Handling

- Added detailed error messages with context
- Logs raw response when parsing fails
- Shows extracted JSON string when JSON parsing fails
- Warns about invalid recipe indices
- Provides full context for debugging

**Error improvements:**

```typescript
const errorText = await response.text();
const error = new Error(
  `OpenAI API error: ${response.statusText} - ${errorText}`,
);
```

### 6. Added Response Validation

- Quick JSON structure validation before parsing
- Validates parsed data is an array
- Warns about invalid recipes without failing
- Provides detailed validation feedback

## Files Modified

### `src/lib/openai.ts`

- Added debug mode constant
- Added `isValidJSONStructure` helper function
- Enhanced `extractJSONFromResponse` with 5 strategies
- Updated `generateRecipeByDish` function
  - Changed model to `gpt-4o-mini`
  - Strengthened system prompt
  - Added error text logging
- Updated `recommendRecipesByIngredients` function
  - Changed model to `gpt-4o-mini`
  - Strengthened system prompt
  - Added error text logging
- Enhanced `parseRecipesFromAIResponse` with comprehensive logging
- Improved error messages throughout

## Testing Recommendations

### Manual Testing Steps

1. **Test ingredient-based search:**
   - Enter ingredients: "chicken, rice, vegetables"
   - Verify recipes load successfully
   - Check browser console for debug logs

2. **Test dish-based search:**
   - Enter dish name: "Chicken Stir Fry"
   - Verify recipes load successfully
   - Check browser console for debug logs

3. **Test error scenarios:**
   - Try with very few ingredients
   - Try with unusual ingredient combinations
   - Verify helpful error messages appear

4. **Check debug logs:**
   - Open browser DevTools Console
   - Look for `[OpenAI Debug]` messages
   - Verify extraction strategy used
   - Check for any warnings

### Expected Behavior

**Success Case:**

- Recipes load within 2-5 seconds
- Debug logs show successful extraction
- No errors in console
- Recipes displayed with all details

**Failure Case (if still occurs):**

- Debug logs show which strategies were attempted
- Full AI response logged to console
- Clear error message displayed to user
- Console shows exactly what went wrong

## Benefits of This Fix

1. **More Reliable JSON Parsing**: 5 strategies vs 3, handles more edge cases
2. **Better Debugging**: Can see exactly what AI returns when things go wrong
3. **Improved Model**: `gpt-4o-mini` is more reliable for JSON output
4. **Stronger Prompts**: Explicit code block requirement reduces conversational text
5. **Better Error Messages**: Users get clearer feedback when things fail
6. **Development Support**: Debug logs help identify issues quickly

## Future Improvements

1. **Add Retry Logic**: If JSON extraction fails, retry with modified prompt
2. **JSON Mode**: Use OpenAI's JSON mode if available in API
3. **Response Caching**: Cache successful responses to reduce API calls
4. **Rate Limiting**: Implement proper rate limiting for API calls
5. **Fallback to Manual Entry**: Allow users to manually enter recipes if AI fails

## Rollback Plan

If issues arise from this fix:

1. Revert to `gpt-4-turbo-preview` model
2. Remove debug logging
3. Simplify extraction to original 3 strategies
4. Revert system prompts to original version

To rollback, restore previous version of `src/lib/openai.ts` from git history.
