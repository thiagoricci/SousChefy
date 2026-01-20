import { apiClient } from './api';
import type { PantryItem } from '@/types/pantry';

const PANTRY_API_URL = '/api/pantry';

export const pantryApi = {
  // Get all pantry items
  getAll: async (): Promise<PantryItem[]> => {
    const response = await apiClient.get(PANTRY_API_URL);
    return response.data;
  },

  // Add pantry item
  create: async (
    item: Omit<PantryItem, 'id' | 'userId' | 'addedAt'>,
  ): Promise<PantryItem> => {
    const response = await apiClient.post(PANTRY_API_URL, item);
    return response.data;
  },

  // Update pantry item
  update: async (
    id: string,
    item: Partial<PantryItem>,
  ): Promise<PantryItem> => {
    const response = await apiClient.put(`${PANTRY_API_URL}/${id}`, item);
    return response.data;
  },

  // Delete pantry item
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${PANTRY_API_URL}/${id}`);
  },

  // Clear all pantry items
  clear: async (): Promise<void> => {
    await apiClient.delete(PANTRY_API_URL);
  },
};
