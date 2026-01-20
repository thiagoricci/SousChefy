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

export interface PantryRecipe {
  id: string;
  name: string;
  description: string;
  ingredientsUsedFromPantry: PantryIngredient[];
  missingIngredients: PantryIngredient[];
  instructions: string[];
  estimatedTime: string;
  difficulty: string;
  pantryCoverage: number; // Percentage of ingredients from pantry
}

export interface PantryIngredient {
  name: string;
  quantity?: string;
  unit?: string;
}

export interface StreamingPantryRecipeCallback {
  (recipes: PantryRecipe[]): void;
}

/**
 * Generate recipes based on pantry ingredients using OpenAI API
 */
export async function generateRecipesFromPantry(
  pantryItems: Array<{ name: string; quantity?: number; unit?: string }>,
  onRecipe?: StreamingPantryRecipeCallback,
): Promise<PantryRecipe[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  // Format pantry items for the prompt
  const pantryList = pantryItems
    .map((item) => {
      if (item.quantity && item.unit) {
        return `${item.quantity} ${item.unit} ${item.name}`;
      } else if (item.quantity) {
        return `${item.quantity} ${item.name}`;
      }
      return item.name;
    })
    .join(', ');

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
          content: `You are a smart recipe generator. Generate 5 recipes using primarily the ingredients in the user's pantry.

CRITICAL: You MUST return ONLY valid JSON objects. No conversational text, no explanations, no markdown formatting.

Return each recipe as a separate JSON object on its own line, like this:
{"name": "Recipe Name", "description": "Brief description", "ingredientsUsedFromPantry": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "missingIngredients": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "instructions": ["Step 1", "Step 2"], "estimatedTime": "30 min", "difficulty": "Easy", "pantryCoverage": 80}
{"name": "Recipe Name 2", "description": "Brief description", "ingredientsUsedFromPantry": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "missingIngredients": [{"name": "ingredient", "quantity": "amount", "unit": "unit"}], "instructions": ["Step 1", "Step 2"], "estimatedTime": "30 min", "difficulty": "Easy", "pantryCoverage": 75}
...

Requirements:
- Generate 5 different recipes using the provided pantry ingredients
- Prioritize recipes that use the MOST pantry ingredients
- Include complete ingredient lists for both pantry and missing items
- Include full cooking instructions
- Include estimated cooking time and difficulty level
- Calculate pantryCoverage as a percentage (0-100) of total ingredients that come from pantry
- Include realistic quantities for missing ingredients
- Return each recipe as a separate JSON object on its own line
- No additional text before or after JSON objects`
        },
        {
          role: 'user',
          content: `Generate 5 recipes using these pantry ingredients: ${pantryList}`
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

  const allRecipes: PantryRecipe[] = [];

  // Stream recipes as they arrive
  for await (const recipes of streamPantryRecipesFromResponse(response)) {
    const recipesWithIds = recipes.map((recipe, index) => ({
      ...recipe,
      id: `pantry-recipe-${Date.now()}-${allRecipes.length + index}`,
    }));

    allRecipes.push(...recipesWithIds);

    if (onRecipe) {
      onRecipe([...allRecipes]);
    }
  }

  return allRecipes;
}

/**
 * Parse streaming response for pantry recipes
 */
async function* streamPantryRecipesFromResponse(
  response: Response,
): AsyncGenerator<PantryRecipe[], void, unknown> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let contentBuffer = '';
  const seenRecipes = new Set<string>();
  let totalObjectsFound = 0;
  let validObjectsFound = 0;
  let invalidObjectsFound = 0;

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
              contentBuffer += content;

              // Try to extract JSON objects from accumulated content
              const jsonObjects = extractJSONObjects(contentBuffer);
              if (jsonObjects.length > 0) {
                totalObjectsFound += jsonObjects.length;

                const validRecipes = jsonObjects.filter((obj) => {
                  const isValid = isValidPantryRecipe(obj);
                  if (!isValid) {
                    invalidObjectsFound++;
                    console.log('[Pantry Recipe Validation Failed]', {
                      object: obj,
                      reason: 'Does not match PantryRecipe structure'
                    });
                  }
                  return isValid;
                });

                validObjectsFound = validRecipes.length;

                // Filter out recipes we've already sent
                const newRecipes = validRecipes.filter(
                  (recipe: PantryRecipe) => {
                    const recipeKey = `${recipe.name}-${recipe.description}`;
                    if (seenRecipes.has(recipeKey)) {
                      return false;
                    }
                    seenRecipes.add(recipeKey);
                    return true;
                  },
                );

                if (newRecipes.length > 0) {
                  console.log('[Pantry Recipe Stream]', {
                    totalFound: totalObjectsFound,
                    validFound: validObjectsFound,
                    invalidFound: invalidObjectsFound,
                    newRecipes: newRecipes.length,
                    recipeNames: newRecipes.map(r => r.name)
                  });
                  yield newRecipes;
                }
              }
            }
          } catch (error) {
            console.error('[Pantry Recipe Parse Error]', error);
            continue;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
    console.log('[Pantry Recipe Generation Complete]', {
      totalObjectsFound,
      validObjectsFound,
      invalidObjectsFound,
      finalRecipes: seenRecipes.size
    });
  }
}

/**
 * Validate that an object is a valid PantryRecipe
 */
function isValidPantryRecipe(obj: any): obj is PantryRecipe {
  // Check if it's an object
  if (typeof obj !== 'object' || obj === null) {
    console.log('[Validation] Not an object:', obj);
    return false;
  }

  // Check required fields with detailed logging
  const checks = [
    { field: 'name', value: obj.name, type: 'string', required: true },
    { field: 'description', value: obj.description, type: 'string', required: true },
    { field: 'ingredientsUsedFromPantry', value: obj.ingredientsUsedFromPantry, type: 'array', required: true },
    { field: 'missingIngredients', value: obj.missingIngredients, type: 'array', required: true },
    { field: 'instructions', value: obj.instructions, type: 'array', required: true },
    { field: 'estimatedTime', value: obj.estimatedTime, type: 'string', required: true },
    { field: 'difficulty', value: obj.difficulty, type: 'string', required: true },
    { field: 'pantryCoverage', value: obj.pantryCoverage, type: 'number', required: true },
  ];

  for (const check of checks) {
    if (check.required && (check.value === undefined || check.value === null)) {
      console.log(`[Validation] Missing required field: ${check.field}`);
      return false;
    }

    if (check.type === 'string' && typeof check.value !== 'string') {
      console.log(`[Validation] Field ${check.field} is not a string:`, typeof check.value);
      return false;
    }

    if (check.type === 'array' && !Array.isArray(check.value)) {
      console.log(`[Validation] Field ${check.field} is not an array:`, typeof check.value);
      return false;
    }

    if (check.type === 'number' && typeof check.value !== 'number') {
      console.log(`[Validation] Field ${check.field} is not a number:`, typeof check.value);
      return false;
    }
  }

  // Additional validation for string fields
  if (obj.name.trim().length === 0) {
    console.log('[Validation] Name is empty');
    return false;
  }

  // Validate pantryCoverage range
  if (obj.pantryCoverage < 0 || obj.pantryCoverage > 100) {
    console.log('[Validation] Pantry coverage out of range:', obj.pantryCoverage);
    return false;
  }

  // Validate arrays are not empty
  if (obj.ingredientsUsedFromPantry.length === 0 && obj.missingIngredients.length === 0) {
    console.log('[Validation] Both ingredient arrays are empty');
    return false;
  }

  if (obj.instructions.length === 0) {
    console.log('[Validation] Instructions array is empty');
    return false;
  }

  return true;
}

/**
 * Classify a pantry item into a category using OpenAI API
 */
export async function classifyPantryItem(
  itemName: string,
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a pantry item classifier. Classify grocery items into one of these categories:

Categories:
- produce: Fresh fruits and vegetables (apples, carrots, lettuce, tomatoes)
- dairy: Milk, cheese, yogurt, eggs, butter
- protein: Meat, fish, poultry, tofu, beans
- grains: Rice, pasta, bread, oats, flour
- canned: Canned goods (soup, beans, vegetables)
- frozen: Frozen foods (vegetables, meals, fruits)
- spices: Herbs, spices, seasonings, salt, pepper
- oils: Cooking oils, vinegar, dressings
- condiments: Ketchup, mustard, mayo, sauces
- beverages: Water, juice, soda, coffee, tea
- snacks: Chips, crackers, cookies, nuts
- baking: Sugar, baking powder, yeast, chocolate chips
- other: Items that don't fit other categories

CRITICAL: You MUST return ONLY the category name as a plain string. No explanations, no additional text, no JSON formatting.

Example responses:
"produce"
"dairy"
"protein"
"grains"
"canned"
"frozen"
"spices"
"oils"
"condiments"
"beverages"
"snacks"
"baking"
"other"`,
        },
        {
          role: "user",
          content: `Classify this pantry item: ${itemName}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent classification
      max_tokens: 10, // Only need category name
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const category = data.choices?.[0]?.message?.content?.trim();

  // Validate category
  const validCategories: string[] = [
    "produce",
    "dairy",
    "protein",
    "grains",
    "canned",
    "frozen",
    "spices",
    "oils",
    "condiments",
    "beverages",
    "snacks",
    "baking",
    "other",
  ];

  if (!category || !validCategories.includes(category)) {
    console.warn(
      `Invalid category "${category}" returned by AI, defaulting to "other"`,
    );
    return "other";
  }

  return category;
}
