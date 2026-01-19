import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Search, ChefHat, Utensils, Clock, Users, Loader2, Bookmark, BookmarkCheck } from 'lucide-react';
import { generateRecipeByDish, recommendRecipesByIngredients } from '@/lib/openai';
import type { Recipe, RecipeIngredient, SavedRecipe } from '@/types/recipe';
import { RecipeDetail } from './RecipeDetail';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';

export interface RecipeTabProps {
  onAddIngredients: (ingredients: RecipeIngredient[]) => void;
  onSaveRecipe?: (recipe: SavedRecipe) => void;
  isRecipeSaved?: (recipeId: string) => boolean;
}

export const RecipeTab: React.FC<RecipeTabProps> = ({
  onAddIngredients,
  onSaveRecipe,
  isRecipeSaved
}) => {
  const [searchMode, setSearchMode] = useState<'dish' | 'ingredients'>('dish');
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Debounce search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 800);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      handleSearch();
    }
    // Don't clear results when query is empty - keep them active
  }, [debouncedSearchQuery, searchMode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
  
    setIsLoading(true);
    setIsStreaming(true);
    setError(null);
    setRecipes([]);
    setSelectedRecipe(null);

    try {
      if (searchMode === 'dish') {
        await generateRecipeByDish(searchQuery, (newRecipes) => {
          setRecipes(newRecipes);
        });
      } else {
        const ingredients = searchQuery.split(',').map(i => i.trim()).filter(Boolean);
        await recommendRecipesByIngredients(ingredients, (newRecipes) => {
          setRecipes(newRecipes);
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipes');
      toast({
        title: 'Error',
        description: 'Could not generate recipes. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleAddToShoppingList = (recipe: Recipe) => {
    onAddIngredients(recipe.ingredients);
    toast({
      title: 'Added to List',
      description: `Added ${recipe.ingredients.length} ingredients to your shopping list.`
    });
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    if (onSaveRecipe) {
      const savedRecipe: SavedRecipe = {
        ...recipe,
        savedAt: Date.now()
      };
      onSaveRecipe(savedRecipe);
    }
  };

  if (selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        onAddToShoppingList={() => handleAddToShoppingList(selectedRecipe)}
        onSaveRecipe={() => handleSaveRecipe(selectedRecipe)}
        isSaved={isRecipeSaved ? isRecipeSaved(selectedRecipe.id) : false}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={searchMode === 'dish' ? 'default' : 'outline'}
          onClick={() => setSearchMode('dish')}
          className="flex-1"
        >
          <ChefHat className="w-4 h-4 mr-2" />
          Find by Dish
        </Button>
        <Button
          variant={searchMode === 'ingredients' ? 'default' : 'outline'}
          onClick={() => setSearchMode('ingredients')}
          className="flex-1"
        >
          <Utensils className="w-4 h-4 mr-2" />
          Find by Ingredients
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          type="text"
          placeholder={
            searchMode === 'dish'
              ? 'Enter a dish name (e.g., Chicken Stir Fry)'
              : 'Enter ingredients (e.g., chicken, rice, vegetables)'
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Search Button */}
      <Button
        onClick={handleSearch}
        disabled={isLoading || !searchQuery.trim()}
        className="w-full h-12 text-base"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            {isStreaming ? 'Loading recipes...' : 'Generating...'}
          </>
        ) : (
          'Find Recipes'
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-destructive bg-destructive/10">
          <p className="text-destructive text-sm">{error}</p>
        </Card>
      )}

      {/* Recipe Results */}
      {recipes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            {recipes.length} Recipe{recipes.length > 1 ? 's' : ''} Found
            {isStreaming && (
              <span className="text-muted-foreground text-sm ml-2">
                (Loading more...)
              </span>
            )}
          </h3>
          {recipes.map((recipe, index) => (
            <RecipeCard
              key={`${recipe.name}-${index}`}
              recipe={recipe}
              onSelect={() => handleSelectRecipe(recipe)}
              onSave={() => handleSaveRecipe(recipe)}
              isSaved={isRecipeSaved ? isRecipeSaved(recipe.id) : false}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const RecipeCard: React.FC<{
  recipe: Recipe;
  onSelect: () => void;
  onSave?: () => void;
  isSaved?: boolean;
}> = ({ recipe, onSelect, onSave, isSaved = false }) => (
  <Card
    onClick={onSelect}
    className="p-4 cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50"
  >
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-lg font-semibold">{recipe.name}</h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        </div>
        {onSave && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }}
            variant="outline"
            size="sm"
            className="flex-shrink-0 h-8 w-8 p-0"
            aria-label={`Save recipe ${recipe.name}`}
          >
            {isSaved ? (
              <BookmarkCheck className="w-4 h-4 text-primary" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {recipe.prepTime && (
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{recipe.prepTime}</span>
          </div>
        )}
        {recipe.servings && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} servings</span>
          </div>
        )}
        {recipe.difficulty && (
          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
            {recipe.difficulty}
          </span>
        )}
      </div>
      
      <div className="text-sm text-muted-foreground">
        {recipe.ingredients.length} ingredients
      </div>
    </div>
  </Card>
);
