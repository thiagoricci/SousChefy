import { apiClient } from './api'
import type { SavedRecipe } from '@/types/recipe'

export interface CreateRecipeRequest {
  name: string
  ingredients: RecipeIngredient[]
  instructions: string[]
  servings?: number
  prepTime?: number
  cookTime?: number
}

export interface UpdateRecipeRequest {
  name?: string
  ingredients?: RecipeIngredient[]
  instructions?: string[]
  servings?: number
  prepTime?: number
  cookTime?: number
}

export interface RecipeIngredient {
  name: string
  quantity?: string
  unit?: string
}

export const recipesApi = {
  getAll: async () => {
    const response = await apiClient.get('/api/recipes')
    return response.data
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/api/recipes/${id}`)
    return response.data
  },

  create: async (data: CreateRecipeRequest) => {
    const response = await apiClient.post('/api/recipes', data)
    return response.data
  },

  update: async (id: string, data: UpdateRecipeRequest) => {
    const response = await apiClient.put(`/api/recipes/${id}`, data)
    return response.data
  },

  delete: async (id: string) => {
    await apiClient.delete(`/api/recipes/${id}`)
  }
}
