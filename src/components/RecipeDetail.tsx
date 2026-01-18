import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Clock, Users, ChefHat, ShoppingCart, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Recipe, RecipeIngredient } from '@/types/recipe';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onAddToShoppingList: (ingredients: RecipeIngredient[]) => void;
  onSaveRecipe?: () => void;
  isSaved?: boolean;
}

export const RecipeDetail: React.FC<RecipeDetailProps> = ({
  recipe,
  onBack,
  onAddToShoppingList,
  onSaveRecipe,
  isSaved = false
}) => {
  return (
    <div className="space-y-4">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={onBack}
        className="w-full"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Search
      </Button>

      {/* Recipe Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-4 flex-1">
            <h2 className="text-2xl font-bold">{recipe.name}</h2>
            <p className="text-muted-foreground">{recipe.description}</p>

            {recipe.source && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                <ChefHat className="w-4 h-4" />
                <span>Source: {recipe.source}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-4 text-sm">
              {recipe.prepTime && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>Prep: {recipe.prepTime}</span>
                </div>
              )}
              {recipe.cookTime && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  <span>Cook: {recipe.cookTime}</span>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-5 h-5" />
                  <span>{recipe.servings} servings</span>
                </div>
              )}
              {recipe.difficulty && (
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  <span className="font-medium">{recipe.difficulty}</span>
                </div>
              )}
            </div>
          </div>
          {onSaveRecipe && (
            <Button
              onClick={onSaveRecipe}
              variant="outline"
              size="sm"
              className="flex-shrink-0 h-10 px-3"
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
      </Card>

      {/* Ingredients */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Ingredients</h3>
        <ul className="space-y-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
              <span className="flex-1">
                <span className="font-medium">{ingredient.name}</span>
                {ingredient.quantity && (
                  <span className="text-muted-foreground ml-2">
                    {ingredient.quantity}
                    {ingredient.unit && ` ${ingredient.unit}`}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Instructions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Instructions</h3>
        <ol className="space-y-4">
          {recipe.instructions.map((instruction, index) => (
            <li key={index} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                {index + 1}
              </span>
              <p className="flex-1 pt-1">{instruction}</p>
            </li>
          ))}
        </ol>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onSaveRecipe && (
          <Button
            onClick={onSaveRecipe}
            variant="outline"
            size="lg"
            className="h-14 text-base"
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-5 h-5 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Bookmark className="w-5 h-5 mr-2" />
                Save Recipe
              </>
            )}
          </Button>
        )}
        <Button
          onClick={() => onAddToShoppingList(recipe.ingredients)}
          size="lg"
          className="flex-1 h-14 text-base"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to List
        </Button>
      </div>
    </div>
  );
};
