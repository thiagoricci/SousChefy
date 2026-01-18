import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Trash2, Clock, ShoppingBag } from 'lucide-react';
import { type ShoppingItem } from './ShoppingList';
import { type SavedList } from '@/types/shopping';
import { type SavedRecipe } from '@/types/recipe';
import { SavedRecipesCard } from './SavedRecipesCard';

interface HistoryTabProps {
  history: SavedList[];
  savedRecipes: SavedRecipe[];
  onLoadList: (listId: string) => void;
  onClearHistory: () => void;
  onDeleteList: (listId: string) => void;
  onViewRecipe: (recipe: SavedRecipe) => void;
  onAddRecipeToShoppingList: (recipe: SavedRecipe) => void;
  onDeleteRecipe: (recipeId: string) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  savedRecipes,
  onLoadList,
  onClearHistory,
  onDeleteList,
  onViewRecipe,
  onAddRecipeToShoppingList,
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

  const getItemPreview = (items: ShoppingItem[]) => {
    const previewItems = items.slice(0, 3);
    const preview = previewItems.map(item => item.name).join(', ');
    const remaining = items.length - previewItems.length;
    return remaining > 0 ? `${preview} +${remaining} more` : preview;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 md:p-6 lg:p-8 shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-primary" />
          <h3 className="text-lg md:text-xl font-bold">Saved Lists</h3>
          {history.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {history.length}
            </span>
          )}
        </div>
        {history.length > 0 && (
          <Button
            onClick={onClearHistory}
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl self-start sm:self-auto"
            aria-label="Clear all saved shopping lists from history"
          >
            <span className="hidden sm:inline">Clear History</span>
            <span className="sm:hidden">Clear All</span>
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
          <h4 className="text-lg font-semibold mb-2">No saved lists yet</h4>
          <p className="text-muted-foreground text-sm max-w-xs">
            Your shopping lists will be automatically saved here when you click "Stop Adding"
          </p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3 max-h-96 overflow-y-auto pr-1 md:pr-2">
          {history.map((list) => (
            <div
              key={list.id}
              className="group relative p-3 md:p-4 bg-muted/50 rounded-xl hover:bg-muted transition-all duration-300 border hover:border-primary/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onLoadList(list.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                    <span className="font-semibold text-sm md:text-base">
                      {list.items.length} item{list.items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground truncate mb-1">
                    {getItemPreview(list.items)}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(list.updatedAt)}</span>
                  </div>
                </div>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteList(list.id);
                  }}
                  variant="ghost"
                  size="sm"
                  className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-1 h-8 w-8 flex-shrink-0"
                  aria-label={`Delete list with ${list.items.length} items`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      </Card>

      {/* Saved Recipes Section */}
      <SavedRecipesCard
        savedRecipes={savedRecipes}
        onViewRecipe={onViewRecipe}
        onAddToShoppingList={onAddRecipeToShoppingList}
        onDeleteRecipe={onDeleteRecipe}
      />
    </div>
  );
};
