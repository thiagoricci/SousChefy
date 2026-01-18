import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
