import React from 'react';
import { Card } from '@/components/ui/card';
import {
  Trash2,
  ShoppingCart,
  Check,
  X,
  Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Unit options for quantity selection
const UNIT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'pkg', label: 'Package (pkg)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'cups', label: 'Cups' },
  { value: 'tbsp', label: 'Tablespoons' },
  { value: 'tsp', label: 'Teaspoons' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'large', label: 'Large' },
  { value: 'medium', label: 'Medium' },
  { value: 'small', label: 'Small' },
  { value: 'cloves', label: 'Cloves' },
  { value: 'piece', label: 'Piece' },
  { value: 'garnish', label: 'Garnish' },
  { value: 'serving', label: 'Serving' },
];

export interface ShoppingItem {
  id: string;
  name: string;
  completed: boolean;
  quantity?: number;
  unit?: string;
}

interface ShoppingListProps {
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onEditItem?: (id: string, newName: string, newQuantity?: string) => void;
  onCancelEdit?: () => void;
  editingItemId?: string | null;
  editValue?: string;
  editQuantity?: string;
  onEditValueChange?: (value: string) => void;
  onEditQuantityChange?: (value: string) => void;
  viewMode?: 'editing' | 'shopping';
  className?: string;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({
  items,
  onToggleItem,
  onRemoveItem,
  onEditItem,
  onCancelEdit,
  editingItemId,
  editValue,
  editQuantity,
  editUnit,
  onEditValueChange,
  onEditQuantityChange,
  onEditUnitChange,
  viewMode = 'editing',
  className
}) => {
  if (items.length === 0) {
    return (
      <Card className={cn("p-8 md:p-12 text-center shadow-card rounded-2xl border-0 bg-white/80 backdrop-blur-sm", className)}>
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Empty Shopping List</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              No items in your shopping list yet. Use voice input to add items!
            </p>
          </div>
        </div>
      </Card>
    );
  }


  return (
    <Card className={cn("p-6 md:p-8 shadow-card rounded-2xl border-0 bg-white/80 backdrop-blur-sm", className)}>
      {/* Status Messages - integrated into shopping list card */}
      {viewMode === 'shopping' && (
        <div className="mb-6 -mt-2 -mx-2 px-4 py-3 rounded-t-2xl border-b border-primary/10">
          <div className="flex justify-center">
            <div className="px-4 py-2 rounded-full text-sm font-semibold bg-orange-100 text-orange-800">
              🛒 Shopping Mode
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={viewMode === 'shopping' && editingItemId !== item.id ? () => onToggleItem(item.id) : undefined}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 animate-slide-up",
                    viewMode === 'shopping' && editingItemId !== item.id && "hover:shadow-md cursor-pointer",
                    item.completed
                      ? "bg-secondary/50 border-primary/20"
                      : "bg-background border-border hover:border-primary/30"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {viewMode === 'editing' && editingItemId === item.id ? (
                    // Edit mode - show input fields with save/cancel buttons
                    <div className="flex-1 flex gap-2 flex-wrap">
                      <Input
                        type="number"
                        value={editQuantity || ''}
                        onChange={(e) => onEditQuantityChange && onEditQuantityChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onEditItem && onEditItem(item.id, editValue || '', editQuantity || '', editUnit || '');
                          } else if (e.key === 'Escape') {
                            onCancelEdit && onCancelEdit();
                          }
                        }}
                        placeholder="Qty"
                        min="0"
                        step="0.5"
                        className="w-20 h-10 [&::placeholder]:text-gray-500"
                      />
                      <Select
                        value={editUnit || 'none'}
                        onValueChange={(value) => onEditUnitChange && onEditUnitChange(value)}
                      >
                        <SelectTrigger className="w-32 h-10 [&_[data-placeholder]]:text-gray-500 [&_span]:text-gray-500">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="text"
                        value={editValue || ''}
                        onChange={(e) => onEditValueChange && onEditValueChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onEditItem && onEditItem(item.id, editValue || '', editQuantity || '', editUnit || 'none');
                          } else if (e.key === 'Escape') {
                            onCancelEdit && onCancelEdit();
                          }
                        }}
                        autoFocus
                        className="h-10 text-base flex-1 min-w-[150px]"
                      />
                      <Button
                        size="sm"
                        onClick={() => onEditItem && onEditItem(item.id, editValue || '', editQuantity || '', editUnit || 'none')}
                        className="bg-green-500 hover:bg-green-600 h-10 px-3"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onCancelEdit && onCancelEdit()}
                        className="h-10 px-3"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    // Normal display mode
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-1 flex flex-col justify-center">
                        <span
                          onClick={viewMode === 'editing' ? () => {
                            onEditValueChange && onEditValueChange(item.name);
                            onEditQuantityChange && onEditQuantityChange(item.quantity?.toString() || '');
                            onEditUnitChange && onEditUnitChange(item.unit || 'none');
                            onEditItem && onEditItem(item.id, item.name, item.quantity?.toString() || '', item.unit || 'none');
                          } : undefined}
                          className={cn(
                            "text-lg font-semibold transition-all duration-300 cursor-pointer hover:bg-muted/50 rounded px-2 py-1",
                            viewMode === 'editing' && "",
                            item.completed
                              ? "text-muted-foreground line-through opacity-70"
                              : "text-foreground"
                          )}
                        >
                          {item.name}
                        </span>
                        {(item.quantity || (item.unit && item.unit !== 'none')) && (
                          <span className="text-sm text-muted-foreground px-2">
                            {item.quantity}{item.unit && item.unit !== 'none' ? ` ${item.unit}` : ''}
                          </span>
                        )}
                      </div>
                      {viewMode === 'editing' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            onEditValueChange && onEditValueChange(item.name);
                            onEditQuantityChange && onEditQuantityChange(item.quantity?.toString() || '');
                            onEditUnitChange && onEditUnitChange(item.unit || 'none');
                            onEditItem && onEditItem(item.id, item.name, item.quantity?.toString() || '', item.unit || 'none');
                          }}
                          className="flex-shrink-0 text-muted-foreground hover:text-primary hover:bg-destructive/10 p-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
                          aria-label="Edit item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Only show remove button in editing mode when not editing */}
                  {viewMode === 'editing' && editingItemId !== item.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-3 md:p-2 rounded-xl transition-colors min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-6 h-6 md:w-5 md:h-5" />
                    </Button>
                  )}
                </div>
        ))}
      </div>
      
      {items.length > 0 && (
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary"></div>
            <span className="font-medium">
              {items.filter(item => item.completed).length} of {items.length} completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-voice-listening"></div>
            <span className="font-medium">
              {items.length - items.filter(item => item.completed).length} remaining
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};
