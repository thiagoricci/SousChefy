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

export interface SavedRecipe extends Recipe {
  savedAt: number;
}

export interface RecipeSearchMode {
  type: 'dish' | 'ingredients';
  query: string;
}

export type RecipeState =
  | 'idle'
  | 'searching'
  | 'results'
  | 'viewing'
  | 'error';
