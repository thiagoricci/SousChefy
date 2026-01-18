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
  source?: string;
  url?: string;
}

export interface RecipeIngredient {
  name: string;
  quantity?: string;
  unit?: string;
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
  if (obj.source !== undefined && typeof obj.source !== 'string') {
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
 * Generate 5 real recipes by dish name using OpenAI API
 */
export async function generateRecipeByDish(dishName: string): Promise<Recipe[]> {
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
      messages: [
        {
          role: 'system',
          content: `You are a recipe finder. Generate 5 real recipes based on the dish name provided.

CRITICAL: You MUST return ONLY a valid JSON array. No conversational text, no explanations, no markdown formatting outside the JSON.

Return the JSON array wrapped in code blocks like this:
\`\`\`json
[
  {
    "name": "Recipe Name",
    "description": "Brief description of the recipe",
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
    "source": "AllRecipes.com",
    "url": "https://www.allrecipes.com/..."
  },
  ...
]
\`\`\`

Requirements:
- Generate 5 different real recipes
- Each recipe should be from a different source (e.g., AllRecipes, Food Network, Bon Appétit, Epicurious, Serious Eats)
- Include complete ingredient lists with quantities and units
- Include full cooking instructions
- Include prep time, cook time, servings, and difficulty
- Set source to actual website name (e.g., "AllRecipes.com", "Food Network")
- Include a realistic URL to a recipe page
- Return ONLY the JSON array in code blocks, no additional text before or after`
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

  const data = await response.json();
  const message = data.choices[0].message;
  const content = message.content || '';

  if (!content.trim()) {
    throw new Error('OpenAI API returned empty response');
  }

  // Parse and validate recipes
  const recipes = parseRecipesFromAIResponse(content, 'generateRecipeByDish');

  // Add IDs to all recipes
  return recipes.map((recipe, index) => ({
    ...recipe,
    id: `recipe-${Date.now()}-${index}`
  }));
}

/**
 * Recommend real recipes based on ingredients using OpenAI API
 */
export async function recommendRecipesByIngredients(ingredients: string[]): Promise<Recipe[]> {
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
      messages: [
        {
          role: 'system',
          content: `You are a recipe finder. Generate 5 real recipes using the provided ingredients.

CRITICAL: You MUST return ONLY a valid JSON array. No conversational text, no explanations, no markdown formatting outside the JSON.

Return the JSON array wrapped in code blocks like this:
\`\`\`json
[
  {
    "name": "Recipe Name",
    "description": "Brief description of the recipe",
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
    "source": "AllRecipes.com",
    "url": "https://www.allrecipes.com/..."
  },
  ...
]
\`\`\`

Requirements:
- Generate 5 different real recipes using the provided ingredients
- Each recipe should be from a different source (e.g., AllRecipes, Food Network, Bon Appétit, Epicurious, Serious Eats)
- Use all or most of the provided ingredients
- Include complete ingredient lists with quantities and units
- Include full cooking instructions
- Include prep time, cook time, servings, and difficulty
- Set source to actual website name (e.g., "AllRecipes.com", "Food Network")
- Include a realistic URL to a recipe page
- Return ONLY the JSON array in code blocks, no additional text before or after`
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

  const data = await response.json();
  const message = data.choices[0].message;
  const content = message.content || '';

  if (!content.trim()) {
    throw new Error('OpenAI API returned empty response');
  }

  // Parse and validate recipes
  const recipes = parseRecipesFromAIResponse(content, 'recommendRecipesByIngredients');

  // Add IDs to recipes
  return recipes.map((recipe, index) => ({
    ...recipe,
    id: `recipe-${Date.now()}-${index}`
  }));
}
