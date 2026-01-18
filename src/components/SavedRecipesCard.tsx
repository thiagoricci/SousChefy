import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Trash2, Clock, ChefHat, ShoppingCart, Eye } from 'lucide-react';
import type { SavedRecipe } from '@/types/recipe';

interface SavedRecipesCardProps {
  savedRecipes: SavedRecipe[];
  onViewRecipe: (recipe: SavedRecipe) => void;
  onAddToShoppingList: (recipe: SavedRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export const SavedRecipesCard: React.FC<SavedRecipesCardProps> = ({
  savedRecipes,
  onViewRecipe,
  onAddToShoppingList,
  onDeleteRecipe,
}) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getIngredientPreview = (ingredients: typeof savedRecipes[0]['ingredients']) => {
    const previewItems = ingredients.slice(0, 3);
    const preview = previewItems.map(item => item.name).join(', ');
    const remaining = ingredients.length - previewItems.length;
    return remaining > 0 ? `${preview} +${remaining} more` : preview;
  };

  return (
    <Card className="p-4 md:p-6 lg:p-8 shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <ChefHat className="w-5 h-5 text-primary" />
          <h3 className="text-lg md:text-xl font-bold">Saved Recipes</h3>
          {savedRecipes.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {savedRecipes.length}
            </span>
          )}
        </div>
      </div>

      {savedRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <ChefHat className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-semibold mb-2">No saved recipes yet</h4>
          <p className="text-muted-foreground text-sm max-w-xs">
            Save your favorite recipes for quick access later
          </p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto pr-1 md:pr-2">
          {savedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="group relative p-3 md:p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all duration-300 border hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                    <span className="font-semibold text-sm md:text-base truncate">
                      {recipe.name}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate mb-1">
                    {getIngredientPreview(recipe.ingredients)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <Clock className="w-3 h-3" />
                    <span>Saved {formatDate(recipe.savedAt)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => onViewRecipe(recipe)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs flex-shrink-0"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      onClick={() => onAddToShoppingList(recipe)}
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-xs flex-shrink-0"
                    >
                      <ShoppingCart className="w-3 h-3 mr-1" />
                      Add to List
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => onDeleteRecipe(recipe.id)}
                  variant="ghost"
                  size="sm"
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 h-8 w-8 flex-shrink-0"
                  aria-label={`Delete recipe ${recipe.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
