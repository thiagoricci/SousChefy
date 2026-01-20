import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { findBestMatch } from '@/data/groceryItems';
import { pantryApi } from '@/lib/pantry-api';
import { generateRecipesFromPantry, classifyPantryItem } from '@/lib/openai';
import type { PantryItem, PantryRecipe, PantryCategory } from '@/types/pantry';
import type { ShoppingItem } from './ShoppingList';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Sparkles, Plus, Package, Clock, ChefHat, AlertCircle, RefreshCw, CheckCircle2, BookOpen, ShoppingCart, Check, X, Edit2 } from 'lucide-react';

interface PantryTabProps {
  onAddMissingIngredients: (ingredients: ShoppingItem[]) => void;
}

export const PantryTab: React.FC<PantryTabProps> = ({ onAddMissingIngredients }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [generatedRecipes, setGeneratedRecipes] = useState<PantryRecipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [recipeGenerationError, setRecipeGenerationError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState('');
  
  // Edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editQuantityUnit, setEditQuantityUnit] = useState('');
  
  // Load pantry items on mount
  useEffect(() => {
    if (user) {
      pantryApi.getAll()
        .then(items => {
          setPantryItems(items);
        })
        .catch(error => {
          console.error('Failed to load pantry items:', error);
          toast({
            title: 'Error',
            description: 'Failed to load pantry items.',
            variant: 'destructive',
          });
        });
    }
  }, [user, toast]);
  
  // Add item to pantry
  const handleAddItem = useCallback(async () => {
    const trimmedName = itemName.trim();
    if (!trimmedName) {
      toast({
        title: 'Error',
        description: 'Please enter an item name.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check for duplicate
    const isDuplicate = pantryItems.some(item =>
      item.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      toast({
        title: 'Error',
        description: 'This item is already in your pantry.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsClassifying(true);
      
      // Classify item using AI
      const category = await classifyPantryItem(trimmedName);
      
      const newItem = await pantryApi.create({
        name: trimmedName,
        quantity: itemQuantity ? parseFloat(itemQuantity) : undefined,
        unit: itemUnit || undefined,
        category: category,
      });
      
      setPantryItems(prev => [...prev, newItem]);
      
      // Clear form
      setItemName('');
      setItemQuantity('');
      setItemUnit('');
      
      toast({
        title: 'Item Added',
        description: `${trimmedName} added to your pantry as ${category}.`,
      });
    } catch (error: any) {
      console.error('Failed to add pantry item:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to add item to pantry.',
        variant: 'destructive',
      });
    } finally {
      setIsClassifying(false);
    }
  }, [itemName, itemQuantity, itemUnit, pantryItems, toast]);
  
  // Delete item from pantry
  const handleDeleteItem = useCallback(async (id: string) => {
    try {
      await pantryApi.delete(id);
      setPantryItems(prev => prev.filter(item => item.id !== id));
      toast({
        title: 'Item Removed',
        description: 'Item removed from your pantry.',
      });
    } catch (error: any) {
      console.error('Failed to delete pantry item:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove item from pantry.',
        variant: 'destructive',
      });
    }
  }, [toast]);
  
  // Edit item handlers
  const handleEditItem = useCallback((id: string, name: string, quantityUnit?: string) => {
    setEditingItemId(id);
    setEditValue(name);
    setEditQuantityUnit(quantityUnit || '');
  }, []);
  
  const handleCancelEdit = useCallback(() => {
    setEditingItemId(null);
    setEditValue('');
    setEditQuantityUnit('');
  }, []);
  
  const handleSaveEdit = useCallback(async (id: string) => {
    try {
      // Parse quantity and unit from free text input
      let numericQuantity: number | undefined = undefined;
      let finalUnit: string | undefined = undefined;
      
      if (editQuantityUnit && editQuantityUnit.trim()) {
        const quantityPatterns = [
          /^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/,
          /^(one|two|three|four|five|six|seven|eight|nine|ten)$/i,
        ];
        
        for (const pattern of quantityPatterns) {
          const match = editQuantityUnit.trim().match(pattern);
          if (match) {
            if (pattern === quantityPatterns[0]) {
              numericQuantity = parseFloat(match[1]);
              finalUnit = match[2] || undefined;
            } else if (pattern === quantityPatterns[1]) {
              const wordToNumber: Record<string, number> = {
                'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
              };
              numericQuantity = wordToNumber[match[1].toLowerCase()];
            }
            break;
          }
        }
      }
      
      const updatedItem = await pantryApi.update(id, {
        name: editValue,
        quantity: numericQuantity,
        unit: finalUnit,
      });
      
      setPantryItems(prev => prev.map(item =>
        item.id === id ? updatedItem : item
      ));
      
      handleCancelEdit();
      
      toast({
        title: 'Item Updated',
        description: 'Pantry item updated successfully.',
      });
    } catch (error: any) {
      console.error('Failed to update pantry item:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.message || 'Failed to update item.',
        variant: 'destructive',
      });
    }
  }, [editValue, editQuantityUnit, toast, handleCancelEdit]);
  
  // Generate recipes from pantry
  const handleGenerateRecipes = useCallback(async () => {
    if (pantryItems.length === 0) {
      toast({
        title: 'No Items',
        description: 'Add some items to your pantry first.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedRecipes([]);
    setRecipeGenerationError(null);
    setDebugInfo(null);

    try {
      console.log('[Pantry Generation] Starting with items:', pantryItems);

      const recipes = await generateRecipesFromPantry(pantryItems);

      console.log('[Pantry Generation] Received recipes:', recipes);
      console.log('[Pantry Generation] Recipe count:', recipes.length);

      setGeneratedRecipes(recipes);

      if (recipes.length === 0) {
        setRecipeGenerationError(
          'No recipes could be generated. The AI may have returned invalid data. Please try again or add more ingredients to your pantry.'
        );
        toast({
          title: 'No Recipes Generated',
          description: 'Unable to generate recipes. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Recipes Generated',
          description: `Found ${recipes.length} recipes you can make!`,
        });
      }
    } catch (error: any) {
      console.error('[Pantry Generation] Error:', error);

      const errorMessage = error.message || 'Failed to generate recipes.';
      setRecipeGenerationError(errorMessage);

      setDebugInfo({
        pantryItemCount: pantryItems.length,
        pantryItems: pantryItems.map(i => i.name),
        error: errorMessage,
        timestamp: new Date().toISOString()
      });

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [pantryItems, toast]);
  
  // Add missing ingredients to shopping list
  const handleAddMissingToShoppingList = useCallback((recipe: PantryRecipe) => {
    if (recipe.missingIngredients.length === 0) {
      toast({
        title: 'No Missing Items',
        description: 'You have all the ingredients for this recipe!',
      });
      return;
    }
    
    const shoppingItems: ShoppingItem[] = recipe.missingIngredients.map(ing => {
      const bestMatch = findBestMatch(ing.name);
      const displayName = bestMatch || ing.name;
      let numericQuantity: number | undefined = undefined;
      if (ing.quantity) {
        const parsed = parseFloat(ing.quantity);
        if (!isNaN(parsed)) {
          numericQuantity = parsed;
        }
      }
      return {
        id: Math.random().toString(36).substr(2,9),
        name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        completed: false,
        quantity: numericQuantity || undefined,
        unit: ing.unit || undefined,
      };
    });
    
    onAddMissingIngredients(shoppingItems);
    
    toast({
      title: 'Added to Shopping List',
      description: `Added ${shoppingItems.length} missing ingredients to your list.`,
    });
  }, [onAddMissingIngredients, toast]);
  
  // Get pantry coverage badge color
  const getCoverageBadge = (coverage: number) => {
    if (coverage >= 80) {
      return <Badge className="bg-green-500 hover:bg-green-600">{coverage}% Match</Badge>;
    } else if (coverage >= 50) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{coverage}% Match</Badge>;
    } else {
      return <Badge className="bg-red-500 hover:bg-red-600">{coverage}% Match</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-lg md:text-xl font-semibold text-muted-foreground">
          My Pantry
        </p>
        <p className="text-sm text-muted-foreground mt-1">
        </p>
      </div>
      
      {/* Add Item Form */}
      <Card className="shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add to Pantry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-row gap-2 justify-center">
            <Input
              type="text"
              placeholder="Qty & unit (e.g., 2 kg, 500g, 1 dozen)"
              value={itemQuantity && itemUnit ? `${itemQuantity} ${itemUnit}` : itemQuantity || itemUnit}
              onChange={(e) => {
                const value = e.target.value;
                const quantityPattern = /^(\d+(?:\.\d+)?)\s*(.*)$/;
                const match = value.match(quantityPattern);
                if (match) {
                  setItemQuantity(match[1]);
                  setItemUnit(match[2].trim() || '');
                } else {
                  setItemQuantity(value);
                  setItemUnit('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
              className="h-10 md:h-12 text-sm w-24 md:w-28 shrink-0"
            />
            <Input
              type="text"
              placeholder="Item name..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem();
                }
              }}
              className="h-10 md:h-12 text-sm flex-[0.6] min-w-0"
            />
          </div>
          
          <Button
            onClick={handleAddItem}
            disabled={!itemName.trim() || isClassifying}
            className="w-full"
          >
            {isClassifying ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Classifying...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Generate Recipes Button */}
      {pantryItems.length > 0 && (
        <Button
          onClick={handleGenerateRecipes}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Sparkles className="w-5 h-5 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Recipes from Pantry
            </>
          )}
        </Button>
      )}

      {/* Loading State */}
      {isGenerating && (
        <Card className="shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
            <p className="text-lg font-semibold mb-2">
              Generating Recipes...
            </p>
            <p className="text-sm text-muted-foreground">
              Analyzing your pantry ingredients and finding the best recipes
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Pantry Items */}
      {pantryItems.length > 0 && (
        <Card className="p-6 md:p-8 shadow-card rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="space-y-3">
            {pantryItems.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 animate-slide-up bg-background border-border hover:border-primary/30"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {editingItemId === item.id ? (
                  // Edit mode - show input fields with save/cancel buttons
                  <div className="flex-1 flex gap-2 flex-wrap">
                    <Input
                      type="text"
                      value={editQuantityUnit || ''}
                      onChange={(e) => setEditQuantityUnit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(item.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      placeholder="Qty & unit (e.g., 2 kg, 500g)"
                      className="w-44 h-10 text-sm [&::placeholder]:text-gray-500"
                    />
                    <Input
                      type="text"
                      value={editValue || ''}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(item.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                      autoFocus
                      className="h-10 text-base flex-1 min-w-[150px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSaveEdit(item.id)}
                      className="bg-green-500 hover:bg-green-600 h-10 px-3"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="h-10 px-3"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  // Normal display mode
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-lg font-semibold text-foreground">
                      {item.name}
                    </span>
                    {(item.quantity || item.unit) && (
                      <span className="text-sm text-muted-foreground px-2">
                        {item.quantity}{item.unit ? ` ${item.unit}` : ''}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Only show edit/delete buttons when not editing */}
                {editingItemId !== item.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const quantityUnit = item.quantity && item.unit
                          ? `${item.quantity} ${item.unit}`
                          : item.quantity?.toString() || '';
                        handleEditItem(item.id, item.name, quantityUnit);
                      }}
                      className="flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-destructive/10 p-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
                      aria-label="Edit item"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-3 md:p-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-6 h-6 md:w-5 md:h-5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Generated Recipes */}
      {generatedRecipes.length > 0 && (
        <Card className="shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Recipes You Can Make ({generatedRecipes.length})
            </CardTitle>
            <CardDescription>
              Based on your pantry items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {generatedRecipes.map(recipe => (
                  <Card key={recipe.id} className="border border-border/50 hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1 flex items-center gap-2">
                            {recipe.name}
                            {getCoverageBadge(recipe.pantryCoverage)}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {recipe.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {recipe.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <ChefHat className="w-4 h-4" />
                          {recipe.difficulty}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Ingredients from Pantry */}
                      {recipe.ingredientsUsedFromPantry.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm font-semibold mb-2 text-green-700 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            From Your Pantry ({recipe.ingredientsUsedFromPantry.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {recipe.ingredientsUsedFromPantry.map((ing, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                                {ing.name}
                                {ing.quantity && ` (${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''})`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Ingredients */}
                      {recipe.missingIngredients.length > 0 && (
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-sm font-semibold mb-2 text-orange-700 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Missing ({recipe.missingIngredients.length})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {recipe.missingIngredients.map((ing, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100">
                                {ing.name}
                                {ing.quantity && ` (${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''})`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Instructions Preview */}
                      {recipe.instructions.length > 0 && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm font-semibold mb-2 text-muted-700 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Instructions
                          </p>
                          <ol className="space-y-2 text-sm">
                            {recipe.instructions.slice(0, 3).map((instruction, idx) => (
                              <li key={idx} className="flex gap-2">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                                  {idx + 1}
                                </span>
                                <span className="flex-1 line-clamp-2">{instruction}</span>
                              </li>
                            ))}
                            {recipe.instructions.length > 3 && (
                              <li className="text-sm text-muted-foreground italic">
                                ...and {recipe.instructions.length - 3} more steps
                              </li>
                            )}
                          </ol>
                        </div>
                      )}

                      {/* Add Missing to List Button */}
                      {recipe.missingIngredients.length > 0 && (
                        <Button
                          onClick={() => handleAddMissingToShoppingList(recipe)}
                          className="w-full"
                          variant="default"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Add Missing to Shopping List
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Error Fallback UI */}
      {recipeGenerationError && !isGenerating && (
        <Card className="shadow-card rounded-xl md:rounded-2xl border-0 bg-red-50/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-red-900">
                    Unable to Generate Recipes
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {recipeGenerationError}
                  </p>
                </div>

                <div className="space-y-2 text-sm text-red-800">
                  <p className="font-medium">Possible reasons:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Not enough ingredients in your pantry</li>
                    <li>Ingredients don't form recognizable recipes</li>
                    <li>AI service temporarily unavailable</li>
                    <li>Invalid data format from AI</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setRecipeGenerationError(null);
                      setDebugInfo(null);
                      handleGenerateRecipes();
                    }}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button
                    onClick={() => setRecipeGenerationError(null)}
                    variant="outline"
                  >
                    Dismiss
                  </Button>
                </div>

                {debugInfo && (
                  <details className="mt-3">
                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                      Debug Information
                    </summary>
                    <pre className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-48">
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {pantryItems.length === 0 && (
        <Card className="shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold mb-2">
              Your pantry is empty
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add ingredients you have at home to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
