import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ShoppingList, type ShoppingItem } from './ShoppingList';
import { HistoryTab } from './HistoryTab';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ArrowLeft } from 'lucide-react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn, generateId } from '@/lib/utils';
import { isValidGroceryItem, findBestMatch } from '@/data/groceryItems';
import { saveCurrentList, loadCurrentList, saveHistory, loadHistory } from '@/lib/storage';
import { type SavedList } from '@/types/shopping';

type ViewMode = 'editing' | 'shopping';

export const GroceryApp: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [history, setHistory] = useState<SavedList[]>([]);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editing');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [activeTab, setActiveTab] = useState('make-list');
  const { toast } = useToast();
  const completionProcessedRef = useRef(false);

  // Load current list and history from localStorage on component mount
  useEffect(() => {
    const savedList = loadCurrentList();
    if (savedList && savedList.length > 0) {
      setItems(savedList);
    }

    const savedHistory = loadHistory();
    if (savedHistory && savedHistory.length > 0) {
      setHistory(savedHistory);
    }
  }, []);

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


  const handleTextInputSubmit = useCallback(() => {
    if (textInput.trim()) {
      parseAndAddItems(textInput.trim());
      setTextInput('');
    }
  }, [textInput, parseAndAddItems]);

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

    // Switch to shopping mode (list is already auto-saved to current storage)
    setViewMode('shopping');
    setActiveTab('make-list');
    
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

      setTimeout(() => {
        playSuccessSound();
        
        // Save completed list to history
        const now = Date.now();
        const completedList: SavedList = {
          id: generateId(),
          items: [...items],
          createdAt: now,
          updatedAt: now,
        };
        setHistory(prev => [completedList, ...prev.slice(0, 9)]);
        
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
  }, [items, viewMode]);

  // Play success sound
  const playSuccessSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
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
      setActiveTab('make-list');
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
  const deleteList = (listId: string) => {
    setHistory(prev => prev.filter(list => list.id !== listId));

    if (editingListId === listId) {
      setEditingListId(null);
    }

    toast({
      title: "List Deleted",
      description: "Shopping list has been removed from history.",
    });
  };

  const completedCount = items.filter(item => item.completed).length;
  const progressPercent = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-subtle p-2 md:p-3">
      <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
        {/* Header */}
        <div className="text-center py-4 md:py-6">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            Grocerli
          </h1>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6 h-12 md:h-auto">
            <TabsTrigger value="make-list" className="rounded-xl min-h-[44px] md:min-h-0 text-sm md:text-base">
              Make a List
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl min-h-[44px] md:min-h-0 text-sm md:text-base">
              History
              {history.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {history.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="make-list" className="mt-0">
            {viewMode === 'editing' ? (
              // Editing Mode
              <div className="space-y-4">
                {/* Description */}
                <div className="text-center">
                  <p className="text-lg md:text-xl font-semibold text-muted-foreground">
                    Make a list
                  </p>
                </div>

                {/* Input Field */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Type items..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTextInputSubmit();
                      }
                    }}
                    className="h-12 md:h-14 text-base bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                  />
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

                {/* Input Field - Allow adding items while shopping */}
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Add more items..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTextInputSubmit();
                      }
                    }}
                    className="h-12 md:h-14 text-base bg-gray-100 border-2 border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-gray-400"
                  />
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
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            {/* History Tab */}
            <HistoryTab
              history={history}
              onLoadList={loadFromHistory}
              onClearHistory={clearHistory}
              onDeleteList={deleteList}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
