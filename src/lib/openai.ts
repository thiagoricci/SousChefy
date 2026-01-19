// OpenAI API integration for recipe search

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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
  url?: string;
}

export interface RecipeIngredient {
  name: string;
  quantity?: string;
  unit?: string;
}

export interface StreamingRecipeCallback {
  (recipes: Recipe[]): void;
}

/**
 * Quick check if string looks like valid JSON structure
 */
function isValidJSONStructure(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) || typeof parsed === 'object';
  } catch {
    return false;
  }
}

/**
 * Extract JSON from AI response using multiple strategies
 */
function extractJSONFromResponse(content: string): string | null {
  // Strategy 1: Extract from code blocks (```json ... ``` or ``` ... ```)
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    const extracted = codeBlockMatch[1].trim();
    return extracted;
  }

  // Strategy 2: Find JSON array with proper bracket matching (non-greedy)
  // This regex matches outermost array by counting brackets
  const arrayMatch = findJSONArray(content);
  if (arrayMatch) {
    return arrayMatch;
  }

  // Strategy 3: Try parsing entire content as JSON
  const trimmedContent = content.trim();
  if (trimmedContent.startsWith('[') || trimmedContent.startsWith('{')) {
    return trimmedContent;
  }

  // Strategy 4: Try to find JSON after conversational text
  // Look for pattern like "Here's the JSON:" or similar
  const jsonIntroMatch = content.match(/(?:json|response|result|data|output)[\s:]*([\s\S]*?)(?:\n\n|\n[A-Z]|\n\d+\.|$)/i);
  if (jsonIntroMatch) {
    const potentialJson = jsonIntroMatch[1].trim();
    if ((potentialJson.startsWith('[') || potentialJson.startsWith('{')) && isValidJSONStructure(potentialJson)) {
      return potentialJson;
    }
  }

  // Strategy 5: Try to extract any JSON-like structure from the content
  const anyJsonMatch = content.match(/[\[\{][\s\S]*?[\]\}]/);
  if (anyJsonMatch && isValidJSONStructure(anyJsonMatch[0])) {
    return anyJsonMatch[0];
  }

  return null;
}

/**
 * Find the first complete JSON array in the content
 */
function findJSONArray(content: string): string | null {
  let depth = 0;
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '[') {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
    } else if (char === ']') {
      depth--;
      if (depth === 0 && startIndex !== -1) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (startIndex !== -1 && endIndex !== -1) {
    return content.substring(startIndex, endIndex);
  }

  return null;
}

/**
 * Validate that an object is a valid RecipeIngredient
 */
function isValidRecipeIngredient(obj: any): obj is RecipeIngredient {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.name === 'string' &&
    obj.name.trim().length > 0 &&
    (obj.quantity === undefined || typeof obj.quantity === 'string') &&
    (obj.unit === undefined || typeof obj.unit === 'string')
  );
}

/**
 * Validate that an object is a valid Recipe
 */
function isValidRecipe(obj: any): obj is Recipe {
  // Check required fields
  if (
    typeof obj !== 'object' ||
    obj === null ||
    typeof obj.name !== 'string' ||
    obj.name.trim().length === 0 ||
    typeof obj.description !== 'string' ||
    !Array.isArray(obj.ingredients) ||
    !Array.isArray(obj.instructions)
  ) {
    return false;
  }

  // Validate ingredients array
  if (obj.ingredients.length === 0) {
    return false;
  }

  for (const ingredient of obj.ingredients) {
    if (!isValidRecipeIngredient(ingredient)) {
      return false;
    }
  }

  // Validate instructions array
  if (obj.instructions.length === 0) {
    return false;
  }

  for (const instruction of obj.instructions) {
    if (typeof instruction !== 'string' || instruction.trim().length === 0) {
      return false;
    }
  }

  // Validate optional fields if present
  if (obj.prepTime !== undefined && typeof obj.prepTime !== 'string') {
    return false;
  }
  if (obj.cookTime !== undefined && typeof obj.cookTime !== 'string') {
    return false;
  }
  if (obj.servings !== undefined && typeof obj.servings !== 'number') {
    return false;
  }
  if (obj.difficulty !== undefined && typeof obj.difficulty !== 'string') {
    return false;
  }
  if (obj.url !== undefined && typeof obj.url !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validate and filter recipe array, returning only valid recipes
 */
function validateRecipeArray(recipes: any[]): { valid: Recipe[]; invalidIndices: number[] } {
  const valid: Recipe[] = [];
  const invalidIndices: number[] = [];

  recipes.forEach((recipe, index) => {
    if (isValidRecipe(recipe)) {
      valid.push(recipe);
    } else {
      invalidIndices.push(index);
    }
  });

  return { valid, invalidIndices };
}

/**
 * Parse recipes from AI response with comprehensive error handling
 */
function parseRecipesFromAIResponse(content: string, functionName: string): Recipe[] {
  // Extract JSON using multiple strategies
  const jsonString = extractJSONFromResponse(content);
  if (!jsonString) {
    throw new Error(
      'Failed to extract JSON from AI response. ' +
      'The AI may have returned text instead of JSON, or JSON format was not recognized.'
    );
  }

  // Parse JSON
  let parsedRecipes: any[];
  try {
    parsedRecipes = JSON.parse(jsonString);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse JSON: ${errorMessage}`);
  }

  // Validate that parsed data is an array
  if (!Array.isArray(parsedRecipes)) {
    throw new Error(
      `Expected JSON array but got ${typeof parsedRecipes}. ` +
      'The AI may have returned a single object instead of an array.'
    );
  }

  // Validate and filter recipes
  const { valid, invalidIndices } = validateRecipeArray(parsedRecipes);

  if (valid.length === 0) {
    throw new Error(
      'No valid recipes found in AI response. ' +
      'All recipes were missing required fields or had invalid data structure.'
    );
  }

  return valid;
}

/**
 * Parse streaming response and extract recipes incrementally
 */
async function* streamRecipesFromResponse(response: Response): AsyncGenerator<Recipe[], void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let contentBuffer = '';
  const seenRecipes = new Set<string>();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      
      // Parse SSE (Server-Sent Events) format
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          // Skip [DONE] marker
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              // Accumulate content
              contentBuffer += content;
              
              // Try to extract JSON objects from accumulated content
              // Look for complete JSON objects (not arrays)
              const jsonObjects = extractJSONObjects(contentBuffer);
              if (jsonObjects.length > 0) {
                const { valid } = validateRecipeArray(jsonObjects);
                
                // Filter out recipes we've already sent
                const newRecipes = valid.filter(recipe => {
                  const recipeKey = `${recipe.name}-${recipe.description}`;
                  if (seenRecipes.has(recipeKey)) {
                    return false;
                  }
                  seenRecipes.add(recipeKey);
                  return true;
                });

                if (newRecipes.length > 0) {
                  yield newRecipes;
                }
              }
            }
          } catch {
            // Invalid JSON in this chunk, continue
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Extract individual JSON objects from content
 */
function extractJSONObjects(content: string): any[] {
  const objects: any[] = [];
  let depth = 0;
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];

    if (char === '{') {
      if (depth === 0) {
        startIndex = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && startIndex !== -1) {
        endIndex = i + 1;
        const jsonString = content.substring(startIndex, endIndex);
        try {
          const obj = JSON.parse(jsonString);
          if (typeof obj === 'object' && obj !== null) {
            objects.push(obj);
          }
        } catch {
          // Invalid JSON, skip
        }
        startIndex = -1;
        endIndex = -1;
      }
    }
  }

  return objects;
}

/**
 * Generate 5 real recipes by dish name using OpenAI API with streaming
 */
export async function generateRecipeByDish(
  dishName: string,
  onRecipe?: StreamingRecipeCallback
): Promise<Recipe[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are a recipe finder. Generate 5 real recipes based on dish name provided.

CRITICAL: You MUST return ONLY valid JSON objects. No conversational text, no explanations, no markdown formatting.

Return each recipe as a separate JSON object on its own line, like this:
{"name": "Recipe Name", "description": "Brief description", "ingredients": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "instructions": ["Step 1", "Step 2"], "prepTime": "15 min", "cookTime": "30 min", "servings": 4, "difficulty": "Easy", "url": "https://..."}
{"name": "Recipe Name 2", "description": "Brief description", "ingredients": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "instructions": ["Step 1", "Step 2"], "prepTime": "15 min", "cookTime": "30 min", "servings": 4, "difficulty": "Easy", "url": "https://..."}
...

Requirements:
- Generate 5 different real recipes
- Include complete ingredient lists with quantities and units
- Include full cooking instructions
- Include prep time, cook time, servings, and difficulty
- Include a realistic URL to a recipe page
- Return each recipe as a separate JSON object on its own line
- No additional text before or after the JSON objects`
        },
        {
          role: 'user',
          content: `Generate 5 real recipes for: ${dishName}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
  }

  const allRecipes: Recipe[] = [];

  // Stream recipes as they arrive
  for await (const recipes of streamRecipesFromResponse(response)) {
    const recipesWithIds = recipes.map((recipe, index) => ({
      ...recipe,
      id: `recipe-${Date.now()}-${allRecipes.length + index}`
    }));
    
    allRecipes.push(...recipesWithIds);
    
    if (onRecipe) {
      onRecipe([...allRecipes]);
    }
  }

  return allRecipes;
}

/**
 * Recommend real recipes based on ingredients using OpenAI API with streaming
 */
export async function recommendRecipesByIngredients(
  ingredients: string[],
  onRecipe?: StreamingRecipeCallback
): Promise<Recipe[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  const response = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are a recipe finder. Generate 5 real recipes using the provided ingredients.

CRITICAL: You MUST return ONLY valid JSON objects. No conversational text, no explanations, no markdown formatting outside the JSON.

Return each recipe as a separate JSON object on its own line, like this:
{"name": "Recipe Name", "description": "Brief description", "ingredients": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "instructions": ["Step 1", "Step 2"], "prepTime": "15 min", "cookTime": "30 min", "servings": 4, "difficulty": "Easy", "url": "https://..."}
{"name": "Recipe Name 2", "description": "Brief description", "ingredients": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "instructions": ["Step 1", "Step 2"], "prepTime": "15 min", "cookTime": "30 min", "servings": 4, "difficulty": "Easy", "url": "https://..."}
...

Requirements:
- Generate 5 different real recipes using the provided ingredients
- Use all or most of the provided ingredients
- Include complete ingredient lists with quantities and units
- Include full cooking instructions
- Include prep time, cook time, servings, and difficulty
- Include a realistic URL to a recipe page
- Return each recipe as a separate JSON object on its own line
- No additional text before or after the JSON objects`
        },
        {
          role: 'user',
          content: `Generate 5 real recipes using these ingredients: ${ingredients.join(', ')}`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
  }

  const allRecipes: Recipe[] = [];

  // Stream recipes as they arrive
  for await (const recipes of streamRecipesFromResponse(response)) {
    const recipesWithIds = recipes.map((recipe, index) => ({
      ...recipe,
      id: `recipe-${Date.now()}-${allRecipes.length + index}`
    }));
    
    allRecipes.push(...recipesWithIds);
    
    if (onRecipe) {
      onRecipe([...allRecipes]);
    }
  }

  return allRecipes;
}
