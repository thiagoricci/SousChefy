import { type ShoppingItem } from '@/components/ShoppingList';

export interface SavedList {
  id: string;              // Unique identifier (timestamp + random string)
  items: ShoppingItem[];   // The shopping items
  createdAt: number;       // Timestamp when list was created
  updatedAt: number;       // Timestamp when list was last modified
}
