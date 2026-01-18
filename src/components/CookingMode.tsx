import React, { useState, useCallback, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, CheckCircle2, Circle, ChevronRight, ChevronLeft, Clock, UtensilsCrossed } from 'lucide-react';
import { TimerDisplay } from './TimerDisplay';
import type { Recipe } from '@/types/recipe';
import type { SavedRecipe } from '@/types/recipe';
import { cn } from '@/lib/utils';

interface CookingModeProps {
  recipes: SavedRecipe[];
  onBack: () => void;
  onComplete: () => void;
}

interface CookingState {
  recipe: SavedRecipe | null;
  currentStep: number;
  completedSteps: number[];
}

export const CookingMode: React.FC<CookingModeProps> = ({
  recipes,
  onBack,
  onComplete,
}) => {
  const [cookingState, setCookingState] = useState<CookingState>({
    recipe: null,
    currentStep: 0,
    completedSteps: [],
  });

  const [showTimer, setShowTimer] = useState(false);

  // Select a recipe to cook
  const handleSelectRecipe = useCallback((recipe: SavedRecipe) => {
    setCookingState({
      recipe,
      currentStep: 0,
      completedSteps: [],
    });
  }, []);

  // Go to next step
  const handleNextStep = useCallback(() => {
    if (!cookingState.recipe) return;

    setCookingState((prev) => {
      const newCompletedSteps = [...prev.completedSteps, prev.currentStep];
      const nextStep = prev.currentStep + 1;

      // Check if all steps are complete
      if (nextStep >= cookingState.recipe!.instructions.length) {
        onComplete();
        return prev;
      }

      return {
        ...prev,
        currentStep: nextStep,
        completedSteps: newCompletedSteps,
      };
    });
  }, [cookingState.recipe, onComplete]);

  // Go to previous step
  const handlePreviousStep = useCallback(() => {
    setCookingState((prev) => ({
      ...prev,
      currentStep: Math.max(0, prev.currentStep - 1),
    }));
  }, []);

  // Go to specific step
  const handleGoToStep = useCallback((stepIndex: number) => {
    setCookingState((prev) => ({
      ...prev,
      currentStep: stepIndex,
    }));
  }, []);

  // Mark current step as complete
  const handleMarkComplete = useCallback(() => {
    if (!cookingState.recipe) return;

    setCookingState((prev) => {
      if (prev.completedSteps.includes(prev.currentStep)) {
        // Unmark
        return {
          ...prev,
          completedSteps: prev.completedSteps.filter((s) => s !== prev.currentStep),
        };
      }

      // Mark complete
      const newCompletedSteps = [...prev.completedSteps, prev.currentStep];
      const nextStep = prev.currentStep + 1;

      // Auto-advance if this is the last step
      if (nextStep >= cookingState.recipe!.instructions.length) {
        onComplete();
        return {
          ...prev,
          completedSteps: newCompletedSteps,
        };
      }

      return {
        ...prev,
        completedSteps: newCompletedSteps,
        currentStep: nextStep,
      };
    });
  }, [cookingState.recipe, onComplete]);

  // Calculate progress
  const progress = cookingState.recipe
    ? (cookingState.completedSteps.length / cookingState.recipe.instructions.length) * 100
    : 0;

  // Recipe Selection Screen
  if (!cookingState.recipe) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="h-10 px-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h2 className="text-xl md:text-2xl font-bold flex-1">
            Choose a Recipe
          </h2>
        </div>

        {/* Recipe List */}
        {recipes.length === 0 ? (
          <Card className="p-8 text-center">
            <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Saved Recipes</h3>
            <p className="text-muted-foreground text-sm">
              Save some recipes first, then come back here to cook them!
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recipes.map((recipe) => (
              <Card
                key={recipe.id}
                className="p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50"
                onClick={() => handleSelectRecipe(recipe)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{recipe.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {recipe.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {recipe.servings && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{recipe.servings}</span>
                          <span>servings</span>
                        </div>
                      )}
                      {recipe.instructions.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{recipe.instructions.length}</span>
                          <span>steps</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Cooking Screen
  const currentInstruction = cookingState.recipe.instructions[cookingState.currentStep];
  const isLastStep = cookingState.currentStep === cookingState.recipe.instructions.length - 1;
  const isStepComplete = cookingState.completedSteps.includes(cookingState.currentStep);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="h-10 px-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Exit
        </Button>
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold truncate">
            {cookingState.recipe.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Step {cookingState.currentStep + 1} of {cookingState.recipe.instructions.length}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="p-4 shadow-card rounded-xl border-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      {/* Current Step */}
      <Card className={cn(
        "p-6 shadow-card rounded-xl border-0 bg-white/80 backdrop-blur-sm transition-all duration-300",
        isStepComplete && "border-2 border-green-500"
      )}>
        <div className="space-y-4">
          {/* Step Number */}
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300",
              isStepComplete
                ? "bg-green-500 text-white"
                : "bg-primary text-primary-foreground"
            )}>
              {isStepComplete ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                cookingState.currentStep + 1
              )}
            </div>
            <h3 className="text-lg font-semibold flex-1">
              {isStepComplete ? "Step Complete!" : "Current Step"}
            </h3>
            {isStepComplete && (
              <Button
                onClick={() => setCookingState(prev => ({ ...prev, completedSteps: prev.completedSteps.filter(s => s !== prev.currentStep) }))}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Undo
              </Button>
            )}
          </div>

          {/* Instruction */}
          <p className="text-base md:text-lg leading-relaxed">
            {currentInstruction}
          </p>

          {/* Timer Toggle */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowTimer(!showTimer)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Clock className="w-4 h-4 mr-2" />
              {showTimer ? 'Hide Timer' : 'Show Timer'}
            </Button>
          </div>

          {/* Timer */}
          {showTimer && (
            <TimerDisplay
              initialSeconds={300} // Default 5 minutes
              onComplete={() => {
                // Timer completed notification
              }}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handlePreviousStep}
              variant="outline"
              className="flex-1 h-12"
              disabled={cookingState.currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={isStepComplete ? handleNextStep : handleMarkComplete}
              className={cn(
                "flex-1 h-12",
                isStepComplete ? "bg-primary hover:bg-primary/90" : "bg-green-500 hover:bg-green-600"
              )}
            >
              {isStepComplete ? (
                <>
                  Next Step
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Complete
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Step Overview */}
      <Card className="p-4 shadow-card rounded-xl border-0 bg-white/80 backdrop-blur-sm">
        <h4 className="font-semibold mb-3">Step Overview</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {cookingState.recipe.instructions.map((_, index) => {
            const isCompleted = cookingState.completedSteps.includes(index);
            const isCurrent = index === cookingState.currentStep;

            return (
              <button
                key={index}
                onClick={() => handleGoToStep(index)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all duration-200",
                  isCurrent && "bg-primary/10 border border-primary/30",
                  isCompleted && "bg-green-50",
                  !isCurrent && !isCompleted && "hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
                  isCompleted && "bg-green-500 text-white",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCurrent && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={cn(
                  "text-sm flex-1 truncate",
                  isCurrent && "font-medium",
                  isCompleted && "line-through text-muted-foreground"
                )}>
                  Step {index + 1}
                </span>
                {isCurrent && (
                  <Circle className="w-2 h-2 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
