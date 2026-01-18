import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ShoppingList, type ShoppingItem } from './ShoppingList';
import { HistoryTab } from './HistoryTab';
import { RecipeTab } from './RecipeTab';
import { RecipeDetail } from './RecipeDetail';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ArrowLeft, Edit2, LogOut } from 'lucide-react';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn, generateId } from '@/lib/utils';
import { isValidGroceryItem, findBestMatch } from '@/data/groceryItems';
import { saveCurrentList, loadCurrentList, saveHistory, loadHistory, loadRecipes, deleteRecipe } from '@/lib/storage';
import { listsApi } from '@/lib/lists-api';
import { recipesApi } from '@/lib/recipes-api';
import { type SavedList } from '@/types/shopping';
import { type RecipeIngredient, type SavedRecipe, type Recipe } from '@/types/recipe';
import { BottomNavigation, type ViewType } from './BottomNavigation';
import { CookingMode } from './CookingMode';

// Unit options for quantity selection
const UNIT_OPTIONS = [
  { value: 'none', label: 'Unit' },
  { value: 'whole', label: 'Whole' },
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

type ViewMode = 'editing' | 'shopping';

export const GroceryApp: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [history, setHistory] = useState<SavedList[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editing');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [itemUnit, setItemUnit] = useState<string>('none');
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const completionProcessedRef = useRef(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Load current list, history, and saved recipes from localStorage on component mount
  useEffect(() => {
    const savedList = loadCurrentList();
    if (savedList && savedList.length > 0) {
      setItems(savedList);
    }

    const savedHistory = loadHistory();
    if (savedHistory && savedHistory.length > 0) {
      setHistory(savedHistory);
    }

    const recipes = loadRecipes();
    if (recipes && recipes.length > 0) {
      setSavedRecipes(recipes);
    }
  }, []);

  // Load recipes from database when user is authenticated
  useEffect(() => {
    if (user) {
      recipesApi.getAll()
        .then(dbRecipes => {
          // Convert database recipes to SavedRecipe format with savedAt timestamp
          const savedRecipesWithTimestamp: SavedRecipe[] = dbRecipes.map((dbRecipe: any) => ({
            id: dbRecipe.id,
            name: dbRecipe.name,
            description: '',
            ingredients: dbRecipe.ingredients,
            instructions: dbRecipe.instructions,
            servings: dbRecipe.servings,
            prepTime: dbRecipe.prepTime?.toString(),
            cookTime: dbRecipe.cookTime?.toString(),
            savedAt: new Date(dbRecipe.createdAt).getTime()
          }));
          setSavedRecipes(savedRecipesWithTimestamp);
        })
        .catch(error => {
          console.error('Failed to load recipes from database:', error);
          // Fallback to localStorage recipes
          const localRecipes = loadRecipes();
          if (localRecipes && localRecipes.length > 0) {
            setSavedRecipes(localRecipes);
          }
        });
    }
  }, [user]);

  // Load lists from database when user is authenticated
  useEffect(() => {
    if (user) {
      listsApi.getAll()
        .then(dbLists => {
          // Convert database lists to SavedList format
          const savedListsWithTimestamp: SavedList[] = dbLists.map((dbList: any) => ({
            id: dbList.id,
            name: dbList.name,
            items: dbList.items,
            createdAt: new Date(dbList.createdAt).getTime(),
            updatedAt: new Date(dbList.updatedAt).getTime()
          }));
          setHistory(savedListsWithTimestamp);
        })
        .catch(error => {
          console.error('Failed to load lists from database:', error);
          // Fallback to localStorage lists
          const localHistory = loadHistory();
          if (localHistory && localHistory.length > 0) {
            setHistory(localHistory);
          }
        });
    }
  }, [user]);

  // Save current list to localStorage whenever items change
  useEffect(() => {
    saveCurrentList(items);
  }, [items]);

  // Save history to localStorage whenever history changes
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  // Reset completion flag when items change from non-completed state
  useEffect(() => {
    const allCompleted = items.length > 0 && items.every(item => item.completed);
    if (!allCompleted) {
      completionProcessedRef.current = false;
    }
  }, [items]);


  // Function to extract quantity and unit from item name
  const extractQuantity = useCallback((itemName: string): { quantity: number | undefined, unit: string | undefined, itemName: string } => {
    const quantityPatterns = [
      /^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*(.+)$/,
      /^(one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)$/i,
      /^(a\s+dozen|a\s+pair|a\s+few)\s+(.+)$/i,
    ];

    for (const pattern of quantityPatterns) {
      const match = itemName.match(pattern);
      if (match) {
        let quantity: number | undefined;
        let unit: string | undefined;

        if (pattern === quantityPatterns[0]) {
          quantity = parseFloat(match[1]);
          unit = match[2] || undefined;
          return { quantity, unit, itemName: match[3] };
        } else if (pattern === quantityPatterns[1]) {
          const wordToNumber: Record<string, number> = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
          };
          quantity = wordToNumber[match[1].toLowerCase()];
          return { quantity, unit: undefined, itemName: match[2] };
        } else if (pattern === quantityPatterns[2]) {
          const specialQuantities: Record<string, number> = {
            'a dozen': 12, 'a pair': 2, 'a few': 3
          };
          quantity = specialQuantities[match[1].toLowerCase()];
          return { quantity, unit: undefined, itemName: match[2] };
        }
      }
    }

    return { quantity: undefined, unit: undefined, itemName };
  }, []);

  // Enhanced parsing function for natural speech patterns
  const parseAndAddItems = useCallback((transcript: string) => {
    let normalized = transcript.toLowerCase().trim();

    const fillerWords = [
      'i need', 'i want', 'get me', 'buy', 'purchase', 'pick up',
      'we need', 'let me get', 'can you add', 'add to the list',
      'put on the list', 'write down', 'remember to get'
    ];

    fillerWords.forEach(filler => {
      normalized = normalized.replace(new RegExp(`^${filler}\\s+`, 'i'), '');
      normalized = normalized.replace(new RegExp(`\\s+${filler}\\s+`, 'gi'), ' ');
    });

    const separators = [
      /\s+and\s+/gi,
      /\s+also\s+/gi,
      /\s+plus\s+/gi,
      /\s+as well as\s+/gi,
      /\s+along with\s+/gi,
      /\s+then\s+/gi,
      /\s+next\s+/gi,
      /\s+after that\s+/gi,
      /\s+some\s+/gi,
      /\s+a few\s+/gi,
      /\s+couple of\s+/gi,
      /,\s*/g,
      /;\s*/g,
      /\s+(?=\d+\s+)/g,
      /\.{2,}/g,
      /\s{3,}/g
    ];

    let parsedItems = [normalized];
    separators.forEach(separator => {
      parsedItems = parsedItems.flatMap(item =>
        item.split(separator).filter(part => part.trim().length > 0)
      );
    });

    if (parsedItems.length === 1 && parsedItems[0].includes(' ')) {
      const words = parsedItems[0].split(' ').filter(word => word.trim());

      const compoundItems = [
        'ice cream', 'olive oil', 'peanut butter', 'orange juice', 'apple juice',
        'ground beef', 'chicken breast', 'hot dogs', 'potato chips', 'corn flakes',
        'green beans', 'sweet potato', 'bell pepper', 'black beans', 'brown rice',
        'whole wheat', 'greek yogurt', 'coconut milk', 'almond milk', 'soy sauce',
        'maple syrup', 'baking soda', 'vanilla extract', 'cream cheese', 'cottage cheese',
        'hand soap', 'toilet paper', 'paper towels'
      ];

      const processedItems: string[] = [];
      let i = 0;

      while (i < words.length) {
        if (i < words.length - 1) {
          const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
          if (compoundItems.includes(twoWordPhrase)) {
            processedItems.push(twoWordPhrase);
            i += 2;
            continue;
          }
        }

        processedItems.push(words[i]);
        i++;
      }

      parsedItems = processedItems;
    }

    const nonGroceryWords = [
      'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'our',
      'and', 'or', 'but', 'so', 'yet', 'for', 'nor',
      'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'without', 'from',
      'up', 'down', 'over', 'under', 'above', 'below', 'between', 'through',
      'was', 'were', 'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'might',
      'can', 'get', 'getting', 'got', 'need', 'needed', 'want', 'wanted',
      'buy', 'buying', 'bought', 'pick', 'picking', 'picked', 'take', 'taking',
      'took', 'put', 'putting', 'add', 'adding', 'added', 'go', 'going', 'went',
      'um', 'uh', 'er', 'ah', 'well', 'like', 'you know', 'i mean', 'actually',
      'basically', 'literally', 'really', 'very', 'quite', 'pretty', 'sort of',
      'kind of', 'thinking', 'thought', 'think', 'about', 'maybe', 'perhaps',
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'also', 'too', 'very', 'really', 'quite', 'rather', 'pretty', 'more', 'most',
      'less', 'least', 'much', 'many', 'few', 'little', 'enough', 'too much',
      'some', 'any', 'all', 'every', 'each', 'both', 'either', 'neither',
      'several', 'many', 'much', 'few', 'little', 'more', 'most', 'less', 'least',
      'now', 'then', 'next', 'first', 'second', 'last', 'finally', 'after',
      'before', 'during', 'while', 'when', 'where', 'why', 'how',
      'lets see', 'let me see', 'what else', 'thats it', 'that is it', 'im done',
      'i am done', 'thats all', 'that is all', 'nothing else', 'no more',
      'stop', 'finish', 'end', 'complete', 'done', 'okay', 'alright', 'right'
    ];

    const cleanedItems = parsedItems
      .map(item => {
        let cleaned = item.trim();

        if (!/^\d/.test(cleaned) && !/^(one|two|three|four|five|six|seven|eight|nine|ten|a dozen|a pair|a few)/i.test(cleaned)) {
          cleaned = cleaned.replace(/^(a|an|the)\s+/i, '');
        }

        cleaned = cleaned.replace(/[.,!?]+$/, '');
        cleaned = cleaned.replace(/\s+/g, ' ').trim();

        return cleaned;
      })
      .filter(item => {
        if (!item || item.length < 2) return false;

        const lowerItem = item.toLowerCase();

        if (nonGroceryWords.includes(lowerItem)) return false;

        // Allow all items, not just those in the grocery database
        return true;
      });

    const newItems: ShoppingItem[] = cleanedItems
      .map(itemName => {
        const { quantity, unit, itemName: nameWithoutQuantity } = extractQuantity(itemName);
        const finalName = nameWithoutQuantity || itemName;

        // Try to find best match in database, otherwise use the item name as-is
        const bestMatch = findBestMatch(finalName);
        const displayName = bestMatch || finalName;

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          completed: false,
          quantity: quantity || undefined,
          unit: unit || undefined,
        };
      });

    if (newItems.length > 0) {
      setItems(prevItems => {
        const itemsToAdd = newItems.filter(newItem =>
          !prevItems.some(existing => existing.name.toLowerCase() === newItem.name.toLowerCase())
        );

        if (itemsToAdd.length > 0) {
          setTimeout(() => {
            toast({
              title: `Added ${itemsToAdd.length} item${itemsToAdd.length > 1 ? "s" : ""}`,
              description: itemsToAdd.map(item =>
                item.quantity ? `${item.quantity}x ${item.name}` : item.name
              ).join(", "),
            });
          }, 0);
        }

        return [...prevItems, ...itemsToAdd];
      });
    }
  }, [extractQuantity, toast]);


  // Add raw item without any parsing or validation
  const addRawItem = useCallback((rawText: string) => {
    const trimmed = rawText.trim();
    
    // Skip empty input
    if (!trimmed) return;
    
    // Capitalize first letter only
    const displayName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    // Check for duplicate (case-insensitive)
    const isDuplicate = items.some(item =>
      item.name.toLowerCase() === displayName.toLowerCase()
    );
    
    if (isDuplicate) {
      toast({
        title: "Item Already Exists",
        description: `"${displayName}" is already in your list.`,
        variant: "destructive",
      });
      return;
    }
    
    // Create new item with exact text
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: displayName,
      completed: false,
      quantity: undefined,
      unit: undefined,
    };
    
    // Add to list
    setItems(prev => [...prev, newItem]);
    
    // Show success toast
    toast({
      title: "Item Added",
      description: `Added "${displayName}" to your list.`,
    });
  }, [items, toast]);


  const handleTextInputSubmit = useCallback(() => {
    const itemName = textInput.trim();
    const qtyValue = itemQuantity.trim();
    const unitValue = itemUnit.trim();
    
    if (!itemName) return;
    
    // Find best match in database
    const bestMatch = findBestMatch(itemName);
    const displayName = bestMatch || itemName;
    
    // Check for duplicate (case-insensitive)
    const isDuplicate = items.some(item =>
      item.name.toLowerCase() === displayName.toLowerCase()
    );
    
    if (isDuplicate) {
      toast({
        title: "Item Already Exists",
        description: `"${displayName}" is already in your list.`,
        variant: "destructive",
      });
      return;
    }
    
    // Convert quantity to number if provided
    let numericQuantity: number | undefined = undefined;
    if (qtyValue) {
      const parsed = parseFloat(qtyValue);
      if (!isNaN(parsed)) {
        numericQuantity = parsed;
      }
    }
    
    // Handle unit (empty string or "none" means undefined)
    const finalUnit = unitValue && unitValue !== 'none' ? unitValue : undefined;
    
    // Create new item
    const newItem: ShoppingItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      completed: false,
      quantity: numericQuantity || undefined,
      unit: finalUnit,
    };
    
    // Add to list
    setItems(prev => [...prev, newItem]);
    
    // Show success toast
    toast({
      title: "Item Added",
      description: numericQuantity
        ? `${numericQuantity}${finalUnit ? ` ${finalUnit} ` : ' '}${displayName}`
        : displayName,
    });
    
    // Clear inputs
    setTextInput('');
    setItemQuantity('');
    setItemUnit('none');
  }, [textInput, itemQuantity, itemUnit, items, toast]);

  // Handler for adding recipe ingredients to shopping list
  const handleAddRecipeIngredients = useCallback((ingredients: RecipeIngredient[]) => {
    const newItems: ShoppingItem[] = ingredients
      .map(ingredient => {
        // Use the ingredient name directly from recipe data
        const finalName = ingredient.name;
        const bestMatch = findBestMatch(finalName);
        const displayName = bestMatch || finalName;

        // Convert string quantity to number if possible
        let numericQuantity: number | undefined = undefined;
        if (ingredient.quantity) {
          const parsed = parseFloat(ingredient.quantity);
          if (!isNaN(parsed)) {
            numericQuantity = parsed;
          }
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
          completed: false,
          quantity: numericQuantity || undefined,
          unit: ingredient.unit || undefined,
        };
      });

    setItems(prevItems => {
      const itemsToAdd = newItems.filter(newItem =>
        !prevItems.some(existing => existing.name.toLowerCase() === newItem.name.toLowerCase())
      );

      if (itemsToAdd.length > 0) {
        setTimeout(() => {
          toast({
            title: `Added ${itemsToAdd.length} ingredient${itemsToAdd.length > 1 ? "s" : ""}`,
            description: itemsToAdd.map(item => {
              if (item.quantity) {
                return `${item.quantity}${item.unit ? ` ${item.unit} ` : ' '}${item.name}`;
              }
              return item.name;
            }).join(", "),
          });
        }, 0);
      }

      return [...prevItems, ...itemsToAdd];
    });

    // Switch to home view
    setActiveView('home');
  }, [toast]);

  const handleToggleItem = (id: string) => {
    setItems(prev => {
      const updatedItems = prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      );

      return updatedItems;
    });
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // Handle editing an item
  const handleEditItem = useCallback((id: string, newName: string, newQuantity?: string, newUnit?: string) => {
    // If this is the first click on an item, enter edit mode
    if (editingItemId === null || editingItemId !== id) {
      setEditingItemId(id);
      setEditValue(newName);
      setEditQuantity(newQuantity || '');
      setEditUnit(newUnit || 'none');
      return;
    }

    // If already editing, save the changes
    const trimmed = newName.trim();
    if (!trimmed) {
      toast({
        title: "Cannot Save",
        description: "Item name cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    // Capitalize first letter only
    const displayName = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    // Check for duplicate (excluding current item)
    const isDuplicate = items.some(item =>
      item.id !== id && item.name.toLowerCase() === displayName.toLowerCase()
    );

    if (isDuplicate) {
      toast({
        title: "Item Already Exists",
        description: `"${displayName}" is already in your list.`,
        variant: "destructive",
      });
      return;
    }

    // Parse quantity
    let numericQuantity: number | undefined = undefined;
    if (newQuantity && newQuantity.trim()) {
      const parsed = parseFloat(newQuantity.trim());
      if (!isNaN(parsed)) {
        numericQuantity = parsed;
      }
    }

    // Handle unit (empty string or "none" means undefined)
    const finalUnit = newUnit && newUnit.trim() && newUnit !== 'none' ? newUnit.trim() : undefined;

    // Update item
    setItems(prev => prev.map(item =>
      item.id === id
        ? { ...item, name: displayName, quantity: numericQuantity, unit: finalUnit }
        : item
    ));

    // Exit edit mode
    setEditingItemId(null);
    setEditValue('');
    setEditQuantity('');
    setEditUnit('');

    toast({
      title: "Item Updated",
      description: `Changed to "${displayName}".`,
    });
  }, [editingItemId, items, toast]);

  // Handle canceling edit
  const handleCancelEdit = useCallback(() => {
    setEditingItemId(null);
    setEditValue('');
    setEditQuantity('');
    setEditUnit('none');
  }, []);

  const handleClearList = () => {
    setItems([]);
    setEditingListId(null);
    localStorage.removeItem('voice-shopper-current-list');
  };

  const handleDone = () => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Add some items to your list first!",
        variant: "destructive",
      });
      return;
    }

    // Switch to shopping mode (list is already auto-saved to localStorage)
    setViewMode('shopping');
    setActiveView('home');

    toast({
      title: "Ready to Shop!",
      description: "Your list is ready. Check off items as you shop.",
    });
  };

  const handleBackToEdit = () => {
    setViewMode('editing');
  };

  // Handle completion celebration
  useEffect(() => {
    const allCompleted = items.length > 0 && items.every(item => item.completed);
    
    if (allCompleted && viewMode === 'shopping' && !completionProcessedRef.current) {
      completionProcessedRef.current = true;
      
      setTimeout(async () => {
        playSuccessSound();
        
        // Save completed list to database when shopping is done
        if (user) {
          try {
            const now = Date.now();
            
            // Get current active list
            const activeList = await listsApi.getActive();
            
            if (activeList) {
              // Deactivate active list instead of creating a new one
              await listsApi.update(activeList.id, {
                isActive: false,
                items: [...items],  // Save with completion status
                name: activeList.name  // Keep original name
              });
              
              // Save to history (localStorage) with database ID
              const completedList: SavedList = {
                id: activeList.id,
                items: [...items],
                createdAt: new Date(activeList.createdAt).getTime(),
                updatedAt: now,
              };
              
              // Save to localStorage
              setHistory(prev => [completedList, ...prev.slice(0, 9)]);
            } else {
              // Fallback: Create new list if no active list exists
              const dbList = await listsApi.create({
                name: `Shopping List - ${new Date(now).toLocaleDateString()}`,
                items: [...items],
                isActive: false
              });
              
              const completedList: SavedList = {
                id: dbList.id,
                items: [...items],
                createdAt: now,
                updatedAt: now,
              };
              
              setHistory(prev => [completedList, ...prev.slice(0, 9)]);
            }
          } catch (error) {
            console.error('Failed to save list to database:', error);
            
            // Fallback to localStorage only
            const now = Date.now();
            const completedList: SavedList = {
              id: generateId(),
              items: [...items],
              createdAt: now,
              updatedAt: now,
            };
            
            // Save to localStorage
            setHistory(prev => [completedList, ...prev.slice(0, 9)]);
          }
        } else {
          // Unauthenticated user - save to localStorage only
          const now = Date.now();
          const completedList: SavedList = {
            id: generateId(),
            items: [...items],
            createdAt: now,
            updatedAt: now,
          };
          
          // Save to localStorage
          setHistory(prev => [completedList, ...prev.slice(0, 9)]);
        }
        
        toast({
          title: "🎉 Shopping Complete!",
          description: "Congratulations! Your list has been saved to history.",
        });
        
        setTimeout(() => {
          toast({
            title: "🎊 Well Done! 🎊",
            description: "You've successfully completed your shopping list!",
            duration: 5000,
          });
          
          setTimeout(() => {
            setItems([]);
            setViewMode('editing');
            completionProcessedRef.current = false;
          }, 3000);
        }, 1000);
      }, 0);
    }
  }, [items, viewMode, toast, user]);

  // Play success sound
  const playSuccessSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioContextClass();

      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      playNote(523.25, now, 0.2);
      playNote(659.25, now + 0.1, 0.2);
      playNote(783.99, now + 0.2, 0.3);
      playNote(1046.50, now + 0.3, 0.5);
    } catch (error) {
      console.error('Could not play success sound:', error);
    }
  };

  // Load list from history
  const loadFromHistory = (listId: string) => {
    const list = history.find(l => l.id === listId);
    if (list) {
      // Reset all items to not completed state
      const resetItems = list.items.map(item => ({
        ...item,
        completed: false
      }));
      setItems(resetItems);
      setEditingListId(listId);
      setActiveView('home');
      setViewMode('editing');
      toast({
        title: "List Loaded",
        description: "Shopping list loaded from history.",
      });
    }
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    setEditingListId(null);
    localStorage.removeItem('voice-shopper-history');
    toast({
      title: "History Cleared",
      description: "Shopping list history has been cleared.",
    });
  };

  // Delete a specific list from history
  const deleteList = useCallback(async (listId: string) => {
    console.log('Attempting to delete list:', listId);

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete lists from database.",
        variant: "destructive",
      });
      setHistory(prev => prev.filter(list => list.id !== listId));
      if (editingListId === listId) {
        setEditingListId(null);
      }
      return;
    }

    try {
      console.log('Calling listsApi.delete with listId:', listId);
      // Try to delete from database
      await listsApi.delete(listId);
      console.log('Successfully deleted list from database:', listId);

      // Success - update local state
      setHistory(prev => prev.filter(list => list.id !== listId));

      if (editingListId === listId) {
        setEditingListId(null);
      }

      toast({
        title: "List Deleted",
        description: "Shopping list has been removed from history.",
      });
    } catch (error: any) {
      console.error('Failed to delete list from database:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status
      });

      // Handle different error types
      if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete this list.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Authentication Failed",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 404) {
        toast({
          title: "List Removed",
          description: "List was already deleted from the server.",
        });
      } else {
        toast({
          title: "Delete Failed",
          description: `Failed to delete list from database: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      }

      // Still delete from localStorage as fallback
      setHistory(prev => prev.filter(list => list.id !== listId));

      if (editingListId === listId) {
        setEditingListId(null);
      }
    }
  }, [editingListId, toast, user]);

  // Handle saving a recipe
  const handleSaveRecipe = useCallback(async (recipe: SavedRecipe) => {
    const existingIndex = savedRecipes.findIndex(r => r.id === recipe.id);
    if (existingIndex >= 0) {
      toast({
        title: "Already Saved",
        description: "This recipe is already in your saved recipes.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert string time to number if present
      const prepTime = recipe.prepTime ? parseInt(recipe.prepTime) : undefined;
      const cookTime = recipe.cookTime ? parseInt(recipe.cookTime) : undefined;

      const dbRecipe = await recipesApi.create({
        name: recipe.name,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        servings: recipe.servings,
        prepTime,
        cookTime
      });

      // Create saved recipe with database ID
      const savedRecipe: SavedRecipe = {
        ...recipe,
        id: dbRecipe.id, // Use database CUID ID instead of AI-generated ID
        savedAt: Date.now()
      };

      setSavedRecipes(prev => [savedRecipe, ...prev]);
      toast({
        title: "Recipe Saved",
        description: `"${recipe.name}" has been saved to your recipes.`,
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.response?.data?.error || 'Failed to save recipe. Please try again.',
        variant: 'destructive',
      });
    }
  }, [savedRecipes, toast]);

  // Handle viewing a saved recipe
  const handleViewRecipe = useCallback((recipe: SavedRecipe) => {
    setSelectedRecipe(recipe);
    setActiveView('search');
  }, []);

  // Handle adding saved recipe ingredients to shopping list
  const handleAddRecipeToShoppingList = useCallback((recipe: SavedRecipe) => {
    handleAddRecipeIngredients(recipe.ingredients);
    toast({
      title: "Added to List",
      description: `Added ${recipe.ingredients.length} ingredients from "${recipe.name}" to your shopping list.`
    });
  }, [handleAddRecipeIngredients, toast]);

  // Handle deleting a saved recipe
  const handleDeleteRecipe = useCallback(async (recipeId: string) => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to delete recipes from database.",
        variant: "destructive",
      });
      // Still delete from localStorage
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
      return;
    }

    try {
      // Try to delete from database
      await recipesApi.delete(recipeId);
      // Success - update local state
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
      toast({
        title: "Recipe Deleted",
        description: "Recipe has been removed from your saved recipes.",
      });
    } catch (error: any) {
      console.error('Failed to delete recipe from database:', error);

      // Handle different error types
      if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete this recipe. It may belong to another account.",
          variant: "destructive",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Authentication Failed",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        // Redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 404) {
        toast({
          title: "Recipe Not Found",
          description: "This recipe may have already been deleted.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Delete Failed",
          description: "Failed to delete recipe from database. Please try again.",
          variant: "destructive",
        });
      }

      // Still delete from localStorage as fallback
      setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    }
  }, [toast, user]);

  const completedCount = items.filter(item => item.completed).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-subtle p-2 md:p-3">
      <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between py-4 md:py-6 relative">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
              Hi {user?.name || user?.email}, welcome!
            </h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        {/* Main Content Area */}
        <div className="pb-20 md:pb-4">
          {activeView === 'home' && (
            <div className="space-y-4 animate-fade-in">
              {viewMode === 'editing' ? (
                // Editing Mode
                <div className="space-y-4">
                  {/* Description */}
                  <div className="text-center">
                    <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                      Make a list
                    </p>
                  </div>

                  {/* Input Fields */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="text"
                      placeholder="Item name..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTextInputSubmit();
                        }
                      }}
                      className="h-12 md:h-14 text-base bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 flex-1 [&::placeholder]:text-gray-500"
                    />
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTextInputSubmit();
                          }
                        }}
                        min="0"
                        step="0.5"
                        className="h-12 md:h-14 w-24 text-base bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 [&::placeholder]:text-gray-500"
                      />
                      <Select
                        value={itemUnit}
                        onValueChange={setItemUnit}
                      >
                        <SelectTrigger className="h-12 md:h-14 w-36 bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 [&_[data-placeholder]]:text-gray-500 [&_span]:text-gray-500">
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
                      <Button
                        onClick={handleTextInputSubmit}
                        disabled={!textInput.trim()}
                        className="h-12 md:h-14 px-6"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Done Button */}
                  {items.length > 0 && (
                    <div className="flex justify-center">
                      <Button
                        onClick={handleDone}
                        size="lg"
                        className="px-8 py-3 md:py-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium bg-blue-500 hover:bg-blue-600 min-h-[48px] md:min-h-0"
                      >
                        Start Shopping
                      </Button>
                    </div>
                  )}

                  {/* Shopping List */}
                  <ShoppingList
                    items={items}
                    onToggleItem={handleToggleItem}
                    onRemoveItem={handleRemoveItem}
                    onEditItem={handleEditItem}
                    onCancelEdit={handleCancelEdit}
                    editingItemId={editingItemId}
                    editValue={editValue}
                    editQuantity={editQuantity}
                    editUnit={editUnit}
                    onEditValueChange={setEditValue}
                    onEditQuantityChange={setEditQuantity}
                    onEditUnitChange={setEditUnit}
                    viewMode="editing"
                    className="animate-slide-up"
                  />
                </div>
              ) : (
                // Shopping Mode
                <div className="space-y-4">
                  {/* Shopping Mode Header */}
                  <div className="text-center">
                    <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                      Shopping Mode
                    </p>
                  </div>

                  {/* Input Fields - Allow adding items while shopping */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type="text"
                        placeholder="Item name..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTextInputSubmit();
                          }
                        }}
                        className="h-12 md:h-14 text-base bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 [&::placeholder]:text-gray-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTextInputSubmit();
                          }
                        }}
                        min="0"
                        step="0.5"
                        className="h-12 md:h-14 w-24 text-base bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 [&::placeholder]:text-gray-500"
                      />
                      <Select
                        value={itemUnit}
                        onValueChange={setItemUnit}
                      >
                        <SelectTrigger className="h-12 md:h-14 w-36 bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400 [&_[data-placeholder]]:text-gray-500 [&_span]:text-gray-500">
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
                      <Button
                        onClick={handleTextInputSubmit}
                        disabled={!textInput.trim()}
                        className="h-12 md:h-14 px-6"
                      >
                        Add
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {items.length > 0 && (
                    <Card className="p-4 md:p-6 shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Progress: {completedCount}/{items.length} items completed
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </Card>
                  )}

                  {/* Shopping List */}
                  <ShoppingList
                    items={items}
                    onToggleItem={handleToggleItem}
                    onRemoveItem={handleRemoveItem}
                    onEditItem={handleEditItem}
                    onCancelEdit={handleCancelEdit}
                    editingItemId={editingItemId}
                    editValue={editValue}
                    editQuantity={editQuantity}
                    editUnit={editUnit}
                    onEditValueChange={setEditValue}
                    onEditQuantityChange={setEditQuantity}
                    onEditUnitChange={setEditUnit}
                    viewMode="shopping"
                    className="animate-slide-up"
                  />

                  {/* Back to List Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={handleBackToEdit}
                      variant="outline"
                      size="lg"
                      className="px-6 py-3 md:py-3 text-sm font-medium rounded-xl border-primary/20 transition-all duration-200 min-h-[48px] md:min-h-0"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to List
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeView === 'search' && (
            <div className="space-y-4 animate-fade-in">
              {/* Recipe Tab */}
              <div className="text-center">
                <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                  AI-Powered Recipes
                </p>
              </div>
              {selectedRecipe ? (
                <RecipeDetail
                  recipe={selectedRecipe}
                  onBack={() => setSelectedRecipe(null)}
                  onAddToShoppingList={handleAddRecipeIngredients}
                  onSaveRecipe={() => handleSaveRecipe(selectedRecipe)}
                  isSaved={savedRecipes.some(r => r.id === selectedRecipe.id)}
                />
              ) : (
                <RecipeTab
                  onAddIngredients={handleAddRecipeIngredients}
                  onSaveRecipe={handleSaveRecipe}
                  isRecipeSaved={(recipeId) => savedRecipes.some(r => r.id === recipeId)}
                />
              )}
            </div>
          )}

          {activeView === 'cooking' && (
            <div className="animate-fade-in">
              <CookingMode
                recipes={savedRecipes}
                onBack={() => {
                  setActiveView('home');
                }}
                onComplete={() => {
                  toast({
                    title: "🎉 Recipe Complete!",
                    description: "You've successfully completed cooking this recipe.",
                  });
                  setActiveView('home');
                }}
              />
            </div>
          )}

          {activeView === 'favorites' && (
            <div className="space-y-4 animate-fade-in">
              {/* History Tab */}
              <HistoryTab
                history={history}
                savedRecipes={savedRecipes}
                onLoadList={loadFromHistory}
                onClearHistory={clearHistory}
                onDeleteList={deleteList}
                onViewRecipe={handleViewRecipe}
                onAddRecipeToShoppingList={handleAddRecipeToShoppingList}
                onDeleteRecipe={handleDeleteRecipe}
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNavigation
          activeView={activeView}
          onViewChange={setActiveView}
          favoritesCount={history.length}
        />
      </div>

    </div>
  );
};
