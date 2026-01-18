import { type ShoppingItem } from '@/components/ShoppingList';
import { type SavedList } from '@/types/shopping';
import { type SavedRecipe } from '@/types/recipe';

const STORAGE_KEYS = {
  CURRENT_LIST: 'grocerli-current-list',
  HISTORY: 'grocerli-history',
  SAVED_RECIPES: 'grocerli-saved-recipes',
  AUTH_TOKEN: 'voice-shopper-auth-token',
} as const;

// ============ LOCAL STORAGE (Active List Only) ============

/**
 * Save the current active list to localStorage
 * Also triggers background sync to database
 */
export const saveCurrentList = (items: ShoppingItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_LIST, JSON.stringify(items));
    // Background sync to database
    syncActiveListToDB(items).catch(console.error);
  } catch (error) {
    console.error('Failed to save current list to localStorage:', error);
  }
};

/**
 * Load the current active list from localStorage
 */
export const loadCurrentList = (): ShoppingItem[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_LIST);
    if (stored) {
      return JSON.parse(stored) as ShoppingItem[];
    }
  } catch (error) {
    console.error('Failed to load current list from localStorage:', error);
  }
  return null;
};

// ============ AUTHENTICATION ============

/**
 * Set authentication token
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Get authentication token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Clear authentication token
 */
export const clearAuthToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// ============ DATABASE OPERATIONS (History, Recipes, Preferences) ============

/**
 * Sync active list to database (background)
 */
async function syncActiveListToDB(items: ShoppingItem[]): Promise<void> {
  if (!isAuthenticated()) return;

  try {
    const token = getAuthToken();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // If items are empty, check if there's an active list to delete
    if (!items || items.length === 0) {
      try {
        // Get the active list
        const activeListResponse = await fetch(`${API_BASE_URL}/api/lists/active`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (activeListResponse.ok) {
          const activeList = await activeListResponse.json();
          // If active list exists, delete it
          if (activeList) {
            await fetch(`${API_BASE_URL}/api/lists/${activeList.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            console.log('Deleted empty active list from database');
          }
        }
      } catch (error) {
        console.error('Failed to delete active list:', error);
      }
      return;
    }

    // Sync non-empty list to database
    const response = await fetch(`${API_BASE_URL}/api/lists/active`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      throw new Error('Failed to sync active list');
    }
  } catch (error) {
    console.error('Failed to sync active list to database:', error);
  }
}

/**
 * Save list to history (database)
 */
export async function saveListToHistory(items: ShoppingItem[]): Promise<string> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  const token = getAuthToken();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const response = await fetch(`${API_BASE_URL}/api/lists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: `Shopping List ${new Date().toLocaleDateString()}`,
      items,
      isActive: false
    })
  });

  if (!response.ok) {
    throw new Error('Failed to save list to history');
  }

  const data = await response.json();
  return data.id;
}

/**
 * Load list history from database
 */
export async function loadListHistory(): Promise<SavedList[]> {
  if (!isAuthenticated()) {
    return [];
  }

  try {
    const token = getAuthToken();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_BASE_URL}/api/lists`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load history');
    }

    const lists = await response.json();
    return lists.map((list: any) => ({
      id: list.id,
      items: list.items,
      name: list.name,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    }));
  } catch (error) {
    console.error('Failed to load history from database:', error);
    return [];
  }
}

/**
 * Delete list from database
 */
export async function deleteList(listId: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  const token = getAuthToken();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const response = await fetch(`${API_BASE_URL}/api/lists/${listId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete list');
  }
}

/**
 * Save recipe to database
 */
export async function saveRecipeToDB(recipe: SavedRecipe): Promise<string> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  const token = getAuthToken();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const response = await fetch(`${API_BASE_URL}/api/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(recipe)
  });

  if (!response.ok) {
    throw new Error('Failed to save recipe');
  }

  const data = await response.json();
  return data.id;
}

/**
 * Load recipes from database
 */
export async function loadRecipesFromDB(): Promise<SavedRecipe[]> {
  if (!isAuthenticated()) {
    return [];
  }

  try {
    const token = getAuthToken();
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    const response = await fetch(`${API_BASE_URL}/api/recipes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load recipes');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to load recipes from database:', error);
    return [];
  }
}

/**
 * Delete recipe from database
 */
export async function deleteRecipeFromDB(recipeId: string): Promise<void> {
  if (!isAuthenticated()) {
    throw new Error('Not authenticated');
  }

  const token = getAuthToken();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const response = await fetch(`${API_BASE_URL}/api/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete recipe');
  }
}

// ============ FALLBACK: LOCAL STORAGE (for offline/unauthenticated) ============

/**
 * Save history to localStorage (fallback)
 */
export const saveHistory = (history: SavedList[]): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
  }
};

/**
 * Load history from localStorage (fallback)
 * Handles migration from old format (ShoppingItem[][]) to new format (SavedList[])
 */
export const loadHistory = (): SavedList[] | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (stored) {
      const parsed = JSON.parse(stored);

      // Migration: Handle old format (ShoppingItem[][]) and convert to SavedList[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Check if first element is a SavedList (has id property)
        if ('id' in parsed[0]) {
          return parsed as SavedList[];
        } else {
          // Migrate old format to new format
          const migrated: SavedList[] = parsed.map((items: ShoppingItem[], index: number) => ({
            id: `migrated-${Date.now()}-${index}`,
            items: items,
            createdAt: Date.now() - (index * 1000), // Stagger timestamps
            updatedAt: Date.now(),
          }));
          // Save migrated data
          localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(migrated));
          return migrated;
        }
      }
    }
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
  }
  return null;
};

/**
 * Save a recipe to localStorage (fallback)
 */
export const saveRecipe = (recipe: SavedRecipe): void => {
  try {
    const existing = loadRecipes();
    const updated = [recipe, ...existing].slice(0, 10); // Keep max 10 recipes
    localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recipe to localStorage:', error);
  }
};

/**
 * Load all saved recipes from localStorage (fallback)
 */
export const loadRecipes = (): SavedRecipe[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SAVED_RECIPES);
    if (stored) {
      return JSON.parse(stored) as SavedRecipe[];
    }
  } catch (error) {
    console.error('Failed to load recipes from localStorage:', error);
  }
  return [];
};

/**
 * Delete a specific recipe from localStorage (fallback)
 */
export const deleteRecipe = (recipeId: string): void => {
  try {
    const existing = loadRecipes();
    const updated = existing.filter(recipe => recipe.id !== recipeId);
    localStorage.setItem(STORAGE_KEYS.SAVED_RECIPES, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete recipe from localStorage:', error);
  }
};

/**
 * Clear all stored data from localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_LIST);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SAVED_RECIPES);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
};
