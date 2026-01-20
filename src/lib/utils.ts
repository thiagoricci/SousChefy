import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GROCERY_ITEMS_SET, ALL_GROCERY_ITEMS } from '@/data/groceryItems';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a unique ID for shopping lists
 * Uses timestamp + random string for uniqueness
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Strip JSON code blocks from text for display purposes
 * Returns the text without JSON blocks, but preserves them for processing
 * This is used to hide technical JSON from users while still allowing it to be parsed
 */
export function stripJsonBlocks(text: string): string {
  // Remove all ```json...``` code blocks (with or without language identifier)
  // Handles variations like: ```json, ``` JSON, ```js, or just ```
  const withoutJsonBlocks = text.replace(/```(?:json|js|javascript)?\s*[\s\S]*?\s*```/g, '');
  
  // Clean up any extra whitespace that might be left
  return withoutJsonBlocks.trim();
}

/**
 * Streaming filter that removes JSON code blocks in real-time
 * This is used during streaming to prevent JSON from ever being displayed
 * Returns filtered text that should be shown to user
 */
export function filterJsonStreaming(currentText: string, newChunk: string): string {
  const combined = currentText + newChunk;
  return stripJsonBlocks(combined);
}

// Function to find best matching grocery item
export const findBestMatch = (item: string): string | null => {
  const normalized = item.toLowerCase().trim();

  // Direct match
  if (GROCERY_ITEMS_SET.has(normalized)) {
    return normalized;
  }

  // Find partial matches and return most specific one
  const matches = ALL_GROCERY_ITEMS.filter(groceryItem => {
    // Handle plurals (e.g., "apples" matches "apple")
    if (normalized.endsWith('s') && groceryItem === normalized.slice(0, -1)) {
      return true;
    }
    if (groceryItem.endsWith('s') && normalized === groceryItem.slice(0, -1)) {
      return true;
    }

    // Handle compound items (e.g., "greek yogurt" contains "yogurt")
    if (normalized.includes(' ') || groceryItem.includes(' ')) {
      const normalizedWords = normalized.split(' ');
      const groceryWords = groceryItem.split(' ');

      // Check if all words in grocery item are present in normalized item
      if (groceryWords.every(word => normalizedWords.includes(word))) {
        return true;
      }

      // Check if all words in normalized item are present in grocery item
      if (normalizedWords.every(word => groceryWords.includes(word))) {
        return true;
      }
    }

    return false;
  });

  // Return longest match (most specific)
  if (matches.length > 0) {
    return matches.reduce((longest, current) =>
      current.length > longest.length ? current : longest
    );
  }

  return null;
};
