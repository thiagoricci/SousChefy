import { apiClient } from './api'
import type { ShoppingItem } from '@/components/ShoppingList'
import type { ListCreationItem } from '@/types/chefai'

export interface CreateListRequest {
  name: string
  items: ShoppingItem[]
  isActive?: boolean
}

export interface UpdateListRequest {
  name?: string
  items?: ShoppingItem[]
  isActive?: boolean
}

export interface AddItemsToListRequest {
  listId: string
  items: ListCreationItem[]
  clearExisting?: boolean
}

export interface DeleteItemsFromListRequest {
  listId: string
  itemNames: string[]
}

export const listsApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/lists')
    return response.data
  },

  getActive: async () => {
    const response = await apiClient.get('/api/lists/active')
    return response.data
  },

  create: async (data: CreateListRequest) => {
    const response = await apiClient.post('/api/lists', data)
    return response.data
  },

  update: async (id: string, data: UpdateListRequest) => {
    const response = await apiClient.put(`/api/lists/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/lists/${id}`)
  },

  addItemsToList: async (data: AddItemsToListRequest) => {
    const response = await apiClient.post('/api/lists/items', data)
    return response.data
  },

  deleteItemsFromList: async (data: DeleteItemsFromListRequest) => {
    const response = await apiClient.delete('/api/lists/items', { data })
    return response.data
  }
}
