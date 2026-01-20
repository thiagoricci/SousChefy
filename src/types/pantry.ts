export interface PantryItem {
  id: string;
  userId: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  category?: string | null;
  addedAt: string;
  expiresAt?: string | null;
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

export type PantryCategory =
  | "produce"
  | "dairy"
  | "protein"
  | "grains"
  | "canned"
  | "frozen"
  | "spices"
  | "oils"
  | "condiments"
  | "beverages"
  | "snacks"
  | "baking"
  | "other";
