import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { VoiceButton } from './VoiceButton';
import { ShoppingList, type ShoppingItem } from './ShoppingList';
import { HistoryTab } from './HistoryTab';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mic, Square, Type } from 'lucide-react';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { ShoppingCart, Plus, RotateCcw, Save } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';
import { isValidGroceryItem, findBestMatch } from '@/data/groceryItems';
import { saveCurrentList, loadCurrentList, saveHistory, loadHistory } from '@/lib/storage';
import { type SavedList } from '@/types/shopping';
import groceryHero from '@/assets/grocery-hero.jpg';

type AppMode = 'adding' | 'shopping' | 'idle';
type InputMode = 'voice' | 'text';

export const GroceryApp: React.FC = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [mode, setMode] = useState<AppMode>('idle');
  const [history, setHistory] = useState<SavedList[]>([]);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [hasStartedShopping, setHasStartedShopping] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [autoStopTimeoutRef, setAutoStopTimeoutRef] = useState<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState('current');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [textInput, setTextInput] = useState('');
  const [isTextAdding, setIsTextAdding] = useState(false);
  const { toast } = useToast();
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);
  const completionProcessedRef = useRef(false);

  // State for accumulating speech input
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');

  // Debounced transcript for processing
  const debouncedTranscript = useDebounce(accumulatedTranscript, 500);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Start adding items with 'a' key
      if (e.key === 'a' && mode === 'idle') {
        e.preventDefault();
        handleStartAddingItems();
      }

      // Start shopping with 's' key
      if (e.key === 's' && mode === 'idle' && items.length > 0) {
        e.preventDefault();
        handleStartShopping();
      }

      // Stop current action with 'Escape' key
      if (e.key === 'Escape' && mode !== 'idle') {
        e.preventDefault();
        if (mode === 'adding') {
          handleStopAddingItems();
        } else if (mode === 'shopping') {
          handleStopShopping();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, items.length]);

  // Ensure microphones are stopped when mode changes to idle
  useEffect(() => {
    if (mode === 'idle' && !isTransitioning) {
      // Clear auto-stop timeout
      if (autoStopTimeoutRef) {
        clearTimeout(autoStopTimeoutRef);
        setAutoStopTimeoutRef(null);
      }

      // Stop any active recognition when mode becomes idle (more aggressive)
      addItemsRecognition.stopListening();
      shoppingRecognition.stopListening();

      // Additional safety stops for mobile devices
      setTimeout(() => {
        addItemsRecognition.stopListening();
        shoppingRecognition.stopListening();
      }, 50);

      setTimeout(() => {
        addItemsRecognition.stopListening();
        shoppingRecognition.stopListening();
      }, 150);

      // Additional safety: clear any accumulated transcript when idle
      setAccumulatedTranscript('');
    }
  }, [mode, autoStopTimeoutRef, isTransitioning]);

  // Ensure microphones are stopped on component mount (page refresh/load)
  useEffect(() => {
    // Stop any active microphones when component mounts (more aggressive)
    addItemsRecognition.stopListening();
    shoppingRecognition.stopListening();

    // Additional safety stops for mobile devices
    setTimeout(() => {
      addItemsRecognition.stopListening();
      shoppingRecognition.stopListening();
    }, 50);

    setTimeout(() => {
      addItemsRecognition.stopListening();
      shoppingRecognition.stopListening();
    }, 150);

    // Also ensure mode is idle on mount
    if (mode !== 'idle') {
      setMode('idle');
    }
  }, []); // Empty dependency array means this runs only on mount

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

  // Save current list to localStorage whenever items change (including empty state)
  useEffect(() => {
    saveCurrentList(items);
  }, [items]);

  // Save history to localStorage whenever history changes (including empty state)
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

  // Speech recognition for adding items
  const addItemsRecognition = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    timeout: 3000, // 3 seconds - balanced timeout for natural speech
    onResult: (transcript, isFinal) => {
      if (transcript.trim()) {
        const lowerTranscript = transcript.toLowerCase().trim();
        const stopPhrases = ["that's it", "done", "finished", "list complete", "stop", "finish", "that's all", "all done", "i'm done", "complete"];

        if (stopPhrases.some(phrase => lowerTranscript.includes(phrase))) {
          handleStopAddingItems();
          return;
        }

         // Accumulate the transcript for processing
         if (isFinal) {
           setAccumulatedTranscript(prev => prev + ' ' + transcript.trim());
         }
      }
    },
    onEnd: () => {
      // The onEnd will be called when speech recognition ends for any reason
      // We don't need to do anything here because:
      // 1. If user manually stopped, handleStopAddingItems was already called
      // 2. If it stopped due to timeout, the mode will still be 'adding' and user can restart
      // 3. We don't want automatic mode changes that might confuse the user
    },
    onError: (error) => {
      console.error('Speech recognition error:', error);

      // Don't automatically stop for no-speech errors - they're not critical
      if (error === 'no-speech' && mode === 'adding') {
        console.log('No speech detected, continuing to listen...');
        return;
      }

      toast({
        title: "Voice Recognition Error",
        description: "Please try again or check microphone permissions.",
        variant: "destructive",
      });
    },
  });
  
  const handleStopAddingItems = () => {
    if (isButtonDisabled || isTransitioning) return; // Prevent rapid clicking and transitions

    setIsTransitioning(true); // Start transition

    // Clear auto-stop timeout
    if (autoStopTimeoutRef) {
      clearTimeout(autoStopTimeoutRef);
      setAutoStopTimeoutRef(null);
    }

    // Immediately stop the recognition with multiple fallback methods
    addItemsRecognition.stopListening();
    setIsButtonDisabled(true); // Disable button during transition

    // Force stop multiple times to ensure it actually stops (more aggressive for mobile)
    setTimeout(() => addItemsRecognition.stopListening(), 25);
    setTimeout(() => addItemsRecognition.stopListening(), 50);
    setTimeout(() => addItemsRecognition.stopListening(), 75);
    setTimeout(() => addItemsRecognition.stopListening(), 100);
    setTimeout(() => addItemsRecognition.stopListening(), 150);
    setTimeout(() => addItemsRecognition.stopListening(), 200);
    setTimeout(() => addItemsRecognition.stopListening(), 300);

    // Then update the mode
    setMode('idle');

    // Clear any accumulated transcript to prevent further processing
    setAccumulatedTranscript('');

    // Also reset the recognition transcript
    addItemsRecognition.resetTranscript();

    // Auto-save the list to history when stopping adding items
    if (items.length > 0) {
      saveToListHistory();
    }

    // End transition after ensuring microphone is stopped
    setTimeout(() => {
      setIsTransitioning(false);
      setIsButtonDisabled(false);
    }, 500);
  };
  

  // Speech recognition for shopping mode
  const shoppingRecognition = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    timeout: 0, // No timeout - shopping mode can run indefinitely
    onResult: (transcript, isFinal) => {
      if (isFinal && transcript.trim()) {
        checkOffItems(transcript.trim());
      }
    },
    onError: (error) => {
      console.error('Shopping mode error:', error);
      toast({
        title: "Voice Recognition Error",
        description: "Please try again or check microphone permissions.",
        variant: "destructive",
      });
    },
  });
  
  const checkOffItems = useCallback((transcript: string) => {
    const spokenWords = transcript.toLowerCase().split(' ');

    // Find matching items with more precise matching
    const matchedItems = items.filter(item => {
      if (item.completed) return false;

      const itemName = item.name.toLowerCase();

      // Check for exact word matches first
      const itemWords = itemName.split(' ');
      const exactWordMatch = spokenWords.some(spokenWord =>
        itemWords.some(itemWord => itemWord === spokenWord)
      );

      // Check for partial matches (but more strict than before)
      const partialMatch = spokenWords.some(spokenWord =>
        itemName.includes(spokenWord) && spokenWord.length > 2
      );

      // Check for compound item matches
      const compoundMatch = spokenWords.some(spokenWord =>
        spokenWord.includes(itemName) && itemName.includes(' ')
      );

      return exactWordMatch || partialMatch || compoundMatch;
    });

    if (matchedItems.length > 0) {
      setItems(prev => {
        const updatedItems = prev.map(item =>
          matchedItems.some(matched => matched.id === item.id)
            ? { ...item, completed: true }
            : item
        );

        return updatedItems;
      });
    }
  }, [items]);

  // Function to extract quantity and unit from item name
  const extractQuantity = useCallback((itemName: string): { quantity: number | undefined, unit: string | undefined, itemName: string } => {
    // Match patterns like "2 apples", "three bananas", "a dozen eggs", "1lb chicken"
    const quantityPatterns = [
      /^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*(.+)$/, // "2 apples" or "1.5lb chicken" (more flexible with decimals)
      /^(one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)$/i, // "three bananas"
      /^(a\s+dozen|a\s+pair|a\s+few)\s+(.+)$/i, // "a dozen eggs"
    ];
    
    for (const pattern of quantityPatterns) {
      const match = itemName.match(pattern);
      if (match) {
        let quantity: number | undefined;
        let unit: string | undefined;
        
        if (pattern === quantityPatterns[0]) {
          // Numeric quantity with optional unit
          quantity = parseFloat(match[1]);
          unit = match[2] || undefined; // Unit is optional
          return { quantity, unit, itemName: match[3] };
        } else if (pattern === quantityPatterns[1]) {
          // Word quantity
          const wordToNumber: Record<string, number> = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
          };
          quantity = wordToNumber[match[1].toLowerCase()];
          return { quantity, unit: undefined, itemName: match[2] };
        } else if (pattern === quantityPatterns[2]) {
          // Special quantities
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
    // Normalize the transcript
    let normalized = transcript.toLowerCase().trim();
    
    // Remove common filler words and phrases
    const fillerWords = [
      'i need', 'i want', 'get me', 'buy', 'purchase', 'pick up',
      'we need', 'let me get', 'can you add', 'add to the list',
      'put on the list', 'write down', 'remember to get'
    ];
    
    fillerWords.forEach(filler => {
      normalized = normalized.replace(new RegExp(`^${filler}\\s+`, 'i'), '');
      normalized = normalized.replace(new RegExp(`\\s+${filler}\\s+`, 'gi'), ' ');
    });
    
    // Enhanced separators for natural speech
    const separators = [
      // Conjunctions
      /\s+and\s+/gi,
      /\s+also\s+/gi,
      /\s+plus\s+/gi,
      /\s+as well as\s+/gi,
      /\s+along with\s+/gi,
      
      // Sequential words
      /\s+then\s+/gi,
      /\s+next\s+/gi,
      /\s+after that\s+/gi,
      
      // Quantity transitions
      /\s+some\s+/gi,
      /\s+a few\s+/gi,
      /\s+couple of\s+/gi,
      
      // Punctuation
      /,\s*/g,
      /;\s*/g,
      
      // Numbers (when they start a new item)
      /\s+(?=\d+\s+)/g,
      
      // Pauses in speech (multiple periods or spaces)
      /\.{2,}/g,
      /\s{3,}/g
    ];
    
    // Apply all separators first
    let parsedItems = [normalized];
    separators.forEach(separator => {
      parsedItems = parsedItems.flatMap(item =>
        item.split(separator).filter(part => part.trim().length > 0)
      );
    });
    
    // If no separators found and we have multiple words, try space separation
    if (parsedItems.length === 1 && parsedItems[0].includes(' ')) {
      const words = parsedItems[0].split(' ').filter(word => word.trim());
      
      // Common grocery items and compound words that should stay together
      const compoundItems = [
        'ice cream', 'olive oil', 'peanut butter', 'orange juice', 'apple juice',
        'ground beef', 'chicken breast', 'hot dogs', 'potato chips', 'corn flakes',
        'green beans', 'sweet potato', 'bell pepper', 'black beans', 'brown rice',
        'whole wheat', 'greek yogurt', 'coconut milk', 'almond milk', 'soy sauce',
        'maple syrup', 'baking soda', 'vanilla extract', 'cream cheese', 'cottage cheese',
        'hand soap', 'toilet paper', 'paper towels'
      ];
      
      // Process words to identify compounds and individual items
      const processedItems: string[] = [];
      let i = 0;
      
      while (i < words.length) {
        // Check for compound items (2 words)
        if (i < words.length - 1) {
          const twoWordPhrase = `${words[i]} ${words[i + 1]}`;
          if (compoundItems.includes(twoWordPhrase)) {
            processedItems.push(twoWordPhrase);
            i += 2;
            continue;
          }
        }
        
        // Add single word
        processedItems.push(words[i]);
        i++;
      }
      
      parsedItems = processedItems;
    }
    
    // Use comprehensive grocery item database for validation
    
    // Non-grocery words to filter out
    const nonGroceryWords = [
      // Articles & determiners
      'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'our',
      
      // Conjunctions
      'and', 'or', 'but', 'so', 'yet', 'for', 'nor',
      
      // Prepositions
      'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'without', 'from',
      'up', 'down', 'over', 'under', 'above', 'below', 'between', 'through',
      
      // Verbs (common speech verbs)
      'was', 'were', 'is', 'are', 'am', 'be', 'been', 'being', 'have', 'has',
      'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'might',
      'can', 'get', 'getting', 'got', 'need', 'needed', 'want', 'wanted',
      'buy', 'buying', 'bought', 'pick', 'picking', 'picked', 'take', 'taking',
      'took', 'put', 'putting', 'add', 'adding', 'added', 'go', 'going', 'went',
      
      // Thinking/filler words
      'um', 'uh', 'er', 'ah', 'well', 'like', 'you know', 'i mean', 'actually',
      'basically', 'literally', 'really', 'very', 'quite', 'pretty', 'sort of',
      'kind of', 'thinking', 'thought', 'think', 'about', 'maybe', 'perhaps',
      
      // Pronouns
      'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      
      // Adverbs
      'also', 'too', 'very', 'really', 'quite', 'rather', 'pretty', 'more', 'most',
      'less', 'least', 'much', 'many', 'few', 'little', 'enough', 'too much',
      
      // Quantity words (when standalone)
      'some', 'any', 'all', 'every', 'each', 'both', 'either', 'neither',
      'several', 'many', 'much', 'few', 'little', 'more', 'most', 'less', 'least',
      
      // Time/sequence words
      'now', 'then', 'next', 'first', 'second', 'last', 'finally', 'after',
      'before', 'during', 'while', 'when', 'where', 'why', 'how',
      
      // Common non-grocery phrases
      'lets see', 'let me see', 'what else', 'thats it', 'that is it', 'im done',
      'i am done', 'thats all', 'that is all', 'nothing else', 'no more',
      'stop', 'finish', 'end', 'complete', 'done', 'okay', 'alright', 'right'
    ];
    
    // Clean up and filter items
    const cleanedItems = parsedItems
      .map(item => {
        let cleaned = item.trim();
        
        // Remove leading articles but preserve quantities
        // Only remove articles that are not part of a quantity pattern
        if (!/^\d/.test(cleaned) && !/^(one|two|three|four|five|six|seven|eight|nine|ten|a dozen|a pair|a few)/i.test(cleaned)) {
          cleaned = cleaned.replace(/^(a|an|the)\s+/i, '');
        }
        
        // Remove trailing periods and commas
        cleaned = cleaned.replace(/[.,!?]+$/, '');
        
        // Note: We don't remove standalone numbers at the beginning here
        // because the extractQuantity function handles this
        
        // Remove extra whitespace
        cleaned = cleaned.replace(/\s+/g, ' ').trim();
        
        return cleaned;
      })
      .filter(item => {
        // Filter out empty items and too short items
        if (!item || item.length < 2) return false;
        
        const lowerItem = item.toLowerCase();
        
        // Filter out non-grocery words first
        if (nonGroceryWords.includes(lowerItem)) return false;
        
        // Use comprehensive grocery database for validation
        return isValidGroceryItem(lowerItem);
      });
    
    // Convert to ShoppingItem objects, avoiding duplicates
    const newItems: ShoppingItem[] = cleanedItems
      .map(itemName => {
        // First extract quantity and unit information
        const { quantity, unit, itemName: nameWithoutQuantity } = extractQuantity(itemName);
        const finalName = nameWithoutQuantity || itemName;
        
        // Use the best match from our database for consistency
        const bestMatch = findBestMatch(finalName) || finalName;
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1),
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
        
        // Show toast notifications immediately
        if (itemsToAdd.length > 0) {
          // Use setTimeout to defer the toast to avoid render cycle issues
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
    } else if (cleanedItems.length === 0) {
      // Show no items recognized toast
      setTimeout(() => {
        toast({
          title: "No items recognized",
          description: "Try speaking more clearly or use words like 'and' between items",
          variant: "destructive",
        });
      }, 0);
    }
  }, [extractQuantity, toast]);

  // Process the debounced transcript
  useEffect(() => {
    if (debouncedTranscript.trim() && mode === 'adding') {
      parseAndAddItems(debouncedTranscript.trim());
      setAccumulatedTranscript(''); // Clear the accumulated transcript after processing
    }
  }, [debouncedTranscript, parseAndAddItems, mode]);

  // Handle toast notifications for completed items
  useEffect(() => {
    const completedItems = items.filter(item => item.completed);
    const allCompleted = items.length > 0 && items.every(item => item.completed);
    
    if (completedItems.length > 0 && !allCompleted) {
      // Show toast for individual items being completed
      const newlyCompleted = completedItems.filter(item => {
        // This is a simple check - in a real app you might track previous state
        return true; // For now, show toast for any completed items
      });

      if (newlyCompleted.length > 0) {
        setTimeout(() => {
          toast({
            title: "Item found!",
            description: `Checked off: ${newlyCompleted.map(i => i.name).join(', ')}`,
          });
        }, 0);
      }
    } else if (allCompleted && items.length > 0 && !completionProcessedRef.current) {
      // Stop any active speech recognition when shopping is complete
      if (mode === 'shopping') {
        shoppingRecognition.stopListening();
      }

      // Mark that we've processed completion to prevent looping
      completionProcessedRef.current = true;

      // Show completion toasts
      setTimeout(() => {
        playSuccessSound();
        toast({
          title: "🎉 Shopping Complete!",
          description: "Congratulations! You've completed your shopping list!",
        });

        // Add a special celebration effect
        setTimeout(() => {
          toast({
            title: "🎊 Well Done! 🎊",
            description: "You've successfully completed your shopping list!",
            duration: 5000,
          });

          // Clear the list and reset state after showing celebration messages
          setTimeout(() => {
            setItems([]);
            setMode('idle');
            setHasStartedShopping(false);
            completionProcessedRef.current = false;
          }, 3000);
        }, 1000);
      }, 0);
    }
  }, [items, toast, mode, shoppingRecognition]);

  // Play success sound
  const playSuccessSound = () => {
    try {
      // Create a more celebratory sound using Web Audio API
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Play a sequence of notes for a celebratory effect
      const playNote = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Create an envelope for the sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Play a celebratory chord progression
      const now = audioContext.currentTime;
      playNote(523.25, now, 0.2); // C
      playNote(659.25, now + 0.1, 0.2); // E
      playNote(783.99, now + 0.2, 0.3); // G
      playNote(1046.50, now + 0.3, 0.5); // C (octave)
    } catch (error) {
      console.error('Could not play success sound:', error);
    }
  };

  const handleStartAddingItems = () => {
    if (isButtonDisabled) return; // Prevent rapid clicking

    if (!addItemsRecognition.isSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    // Stop any active recognition before starting new one
    if (mode === 'shopping') {
      shoppingRecognition.stopListening();
    }

    // Clear any existing auto-stop timeout
    if (autoStopTimeoutRef) {
      clearTimeout(autoStopTimeoutRef);
      setAutoStopTimeoutRef(null);
    }

    setMode('adding');
    setIsButtonDisabled(true); // Disable button during transition
    addItemsRecognition.resetTranscript();

    // Add a small delay to ensure previous recognition is fully stopped
    setTimeout(() => {
      addItemsRecognition.startListening();

      // Set auto-stop timeout to prevent no-speech errors
      const timeout = setTimeout(() => {
        if (mode === 'adding') {
          console.log('Auto-stopping due to no speech detected');
          handleStopAddingItems();
          toast({
            title: "No Speech Detected",
            description: "Stopped listening automatically. Click 'Add Items' to try again.",
          });
        }
      }, 3000); // 3 seconds of no speech

      setAutoStopTimeoutRef(timeout);
      setIsButtonDisabled(false); // Re-enable button after starting
    }, 100);
  };

  const handleTextInputSubmit = useCallback(() => {
    if (textInput.trim()) {
      parseAndAddItems(textInput.trim());
      setTextInput('');
    }
  }, [textInput, parseAndAddItems]);

  const handleStartTextAdding = () => {
    setIsTextAdding(true);
    setTextInput('');
  };

  const handleStopTextAdding = () => {
    setIsTextAdding(false);
    // Save to history (same as voice mode)
    if (items.length > 0) {
      saveToListHistory();
    }
    setTextInput('');
  };

  const handleStartShopping = () => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Add some items to your list first!",
        variant: "destructive",
      });
      return;
    }

    if (!shoppingRecognition.isSupported) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    // Prevent starting if already transitioning
    if (isTransitioning) return;

    setIsTransitioning(true); // Start transition

    // Stop any active recognition before starting new one
    if (mode === 'adding') {
      addItemsRecognition.stopListening();
    }

    // Wait for microphone to be fully stopped before starting shopping
    setTimeout(() => {
      setMode('shopping');
      setHasStartedShopping(true);
      shoppingRecognition.resetTranscript();

      // Add another delay to ensure previous recognition is fully stopped
      setTimeout(() => {
        shoppingRecognition.startListening();
        setIsTransitioning(false); // End transition
      }, 100);
    }, 300); // Wait 300ms for microphone to fully stop
  };

  const handleStopShopping = () => {
    if (isTransitioning) return;

    setIsTransitioning(true); // Start transition

    // Stop the microphone immediately with multiple fallback methods
    shoppingRecognition.stopListening();
    setTimeout(() => shoppingRecognition.stopListening(), 25);
    setTimeout(() => shoppingRecognition.stopListening(), 50);
    setTimeout(() => shoppingRecognition.stopListening(), 75);
    setTimeout(() => shoppingRecognition.stopListening(), 100);
    setTimeout(() => shoppingRecognition.stopListening(), 150);
    setTimeout(() => shoppingRecognition.stopListening(), 200);
    setTimeout(() => shoppingRecognition.stopListening(), 300);

    // Update the state
    setMode('idle');
    setHasStartedShopping(false);

    // End transition after ensuring microphone is stopped
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);
  };

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
    // Stop any active microphones first
    if (mode === 'adding') {
      addItemsRecognition.stopListening();
    } else if (mode === 'shopping') {
      shoppingRecognition.stopListening();
    }

    // Update the state
    setItems([]);
    setHasStartedShopping(false);
    setMode('idle');
    setEditingListId(null); // Clear editing state when clearing list

    // Explicitly clear localStorage to ensure data is removed
    localStorage.removeItem('voice-shopper-current-list');
  };

  // Save current list to history
  const saveToListHistory = () => {
    if (items.length > 0) {
      const now = Date.now();

      if (editingListId) {
        // Update existing list
        setHistory(prev => prev.map(list =>
          list.id === editingListId
            ? { ...list, items: [...items], updatedAt: now }
            : list
        ));
        toast({
          title: "List Updated",
          description: "Your shopping list has been updated.",
        });
      } else {
        // Create new list
        const newList: SavedList = {
          id: generateId(),
          items: [...items],
          createdAt: now,
          updatedAt: now,
        };
        setHistory(prev => [newList, ...prev.slice(0, 9)]);
        toast({
          title: "List Saved",
          description: "Your shopping list has been saved to history.",
        });
      }
    }
  };

  // Load list from history
  const loadFromHistory = (listId: string) => {
    const list = history.find(l => l.id === listId);
    if (list) {
      setItems(list.items);
      setEditingListId(listId); // Track that we're editing this list
      setActiveTab('current'); // Switch to current list tab
      toast({
        title: "List Loaded",
        description: "Shopping list loaded from history.",
      });
    }
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    setEditingListId(null); // Clear editing state when clearing history
    // Explicitly clear localStorage to ensure data is removed
    localStorage.removeItem('voice-shopper-history');
    toast({
      title: "History Cleared",
      description: "Shopping list history has been cleared.",
    });
  };

  // Delete a specific list from history
  const deleteList = (listId: string) => {
    setHistory(prev => prev.filter(list => list.id !== listId));

    // If we deleted the list we were editing, clear the editing state
    if (editingListId === listId) {
      setEditingListId(null);
    }

    toast({
      title: "List Deleted",
      description: "Shopping list has been removed from history.",
    });
  };

  const getCurrentTranscript = () => {
    if (mode === 'adding') return addItemsRecognition.transcript;
    if (mode === 'shopping') return shoppingRecognition.transcript;
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-subtle p-2 md:p-3">
      <div className="max-w-2xl mx-auto space-y-3 md:space-y-4">
        {/* Header with Instructions, Add Items, and Start Shopping buttons */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Button
              onClick={() => setShowInstructions(!showInstructions)}
              variant="outline"
              size="lg"
              className="px-4 py-3 text-sm font-medium rounded-xl border-primary/20 transition-none"
            >
              Instructions
            </Button>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center flex-1 mt-6 md:mt-8 mb-6 md:mb-8">
              Voice Shopper
            </h1>

            {/* Spacer for consistent header layout */}
            <div className="w-[140px]"></div>
          </div>

          <div className="flex flex-col items-center space-y-4">
            {/* Microphone status indicator */}
            {mode === 'adding' && (
              <div className="flex items-center gap-2 text-sm text-red-600 font-medium animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                🎤 Listening for items...
              </div>
            )}

            {/* Input Mode Toggle */}
            <div className="flex justify-center gap-2 w-full max-w-md">
              <Button
                variant={inputMode === 'voice' ? 'default' : 'outline'}
                onClick={() => {
                  setInputMode('voice');
                  setIsTextAdding(false); // Exit text adding mode
                  // Stop voice recognition if switching from text to voice
                  if (mode === 'adding') {
                    handleStopAddingItems();
                  }
                }}
                className="flex-1"
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice
              </Button>
              <Button
                variant={inputMode === 'text' ? 'default' : 'outline'}
                onClick={() => {
                  setInputMode('text');
                  // Stop voice recognition if switching from voice to text
                  if (mode === 'adding') {
                    handleStopAddingItems();
                  }
                }}
                className="flex-1"
              >
                <Type className="w-4 h-4 mr-2" />
                Text
              </Button>
            </div>

            {/* Text Input Mode - Not Adding */}
            {inputMode === 'text' && !isTextAdding && (
              <div className="flex justify-center">
                <Button
                  onClick={handleStartTextAdding}
                  variant="default"
                  size="lg"
                  className="px-6 py-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium bg-blue-500 hover:bg-blue-600"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Items
                </Button>
              </div>
            )}

            {/* Text Input Mode - Adding */}
            {inputMode === 'text' && isTextAdding && (
              <div className="space-y-3 w-full max-w-md mx-auto">
                {/* Stop Adding Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleStopTextAdding}
                    variant="default"
                    size="lg"
                    className="px-6 py-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium bg-red-500 hover:bg-red-600"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop Adding
                  </Button>
                </div>

                {/* Text Input Field */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Type items (e.g., apples, bananas, milk)"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTextInputSubmit();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleTextInputSubmit} disabled={!textInput.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Voice Mode - Add Items button */}
            {inputMode === 'voice' && (
              <div className="flex justify-center">
                <Button
                  onClick={mode === 'adding' ? handleStopAddingItems : handleStartAddingItems}
                  variant="default"
                  size="lg"
                  disabled={isButtonDisabled || isTransitioning}
                  className={cn(
                    "px-6 py-3 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium",
                    mode === 'adding'
                      ? "bg-red-500 hover:bg-red-600"  // Red when actively listening
                      : "bg-blue-500 hover:bg-blue-600",  // Blue when ready to start
                    (isButtonDisabled || isTransitioning) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {mode === 'adding' ? (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      Stop Adding
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5 mr-2" />
                      Add Items
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Start/Stop Shopping button - positioned below Add Items */}
            {items.length > 0 && !hasStartedShopping && (
              <Button
                onClick={handleStartShopping}
                variant="outline"
                size="lg"
                disabled={isTransitioning}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-xl border-primary/20 transition-all duration-200",
                  // Light green when ready to shop
                  mode === 'idle' && items.length > 0 && !hasStartedShopping
                    ? "bg-green-100 text-green-800 border-green-300 hover:bg-green-200 hover:text-green-900"
                    : "hover:bg-blue-500 hover:text-white hover:border-blue-500",
                  isTransitioning && "opacity-50 cursor-not-allowed"
                )}
              >
                🛒 Start Shopping
              </Button>
            )}

            {hasStartedShopping && (
              <Button
                onClick={handleStopShopping}
                variant="outline"
                size="lg"
                disabled={isTransitioning}
                className={cn(
                  "px-4 py-3 text-sm font-medium rounded-xl border-primary/20 transition-all duration-200",
                  // Dark green when actively shopping
                  hasStartedShopping
                    ? "bg-green-600 text-white border-green-600 hover:bg-green-700"
                    : "hover:bg-red-500 hover:text-white hover:border-red-500",
                  isTransitioning && "opacity-50 cursor-not-allowed"
                )}
              >
                ⏹️ Stop Shopping
              </Button>
            )}

            {/* Show completed state when all items are done */}
            {items.length > 0 && items.every(item => item.completed) && !hasStartedShopping && (
              <Button
                variant="outline"
                size="lg"
                className="px-4 py-3 text-sm font-medium bg-green-600 text-white border-green-600 rounded-xl transition-all duration-200"
                disabled
              >
                ✅ Shopping Complete!
              </Button>
            )}

          </div>
        </div>

        {/* Instructions - Only show when toggled */}
        {showInstructions && (
          <Card className="p-4 md:p-6 lg:p-8 shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg md:text-xl font-bold">How to use Voice Shopper</h2>
              <Button
                onClick={() => setShowInstructions(false)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive p-1"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-bold text-sm md:text-lg">1</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg">Choose Input Mode</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">Toggle between Voice or Text input</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-bold text-sm md:text-lg">2</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg">Add Items with Voice</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">Press "Add Items" and speak your grocery list naturally</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-bold text-sm md:text-lg">3</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg">Add Items with Text</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">Click "Add Items", type items separated by commas or "and", then click "Stop Adding" to save</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-bold text-sm md:text-lg">4</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg">Natural Speech Patterns</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">Say "apples and bananas" or "milk, bread, eggs"</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-bold text-sm md:text-lg">5</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg">Start Shopping</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">Press "Start Shopping" to begin voice check-off</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 md:gap-3">
                <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <span className="text-primary font-bold text-sm md:text-lg">6</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base md:text-lg">Voice Check-off</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">Say item names while shopping to cross them off</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
            <TabsTrigger value="current" className="rounded-xl">
              Current List
              {items.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {items.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl">
              History
              {history.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {history.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-0">
            {/* Shopping List */}
            <ShoppingList
              items={items}
              onToggleItem={handleToggleItem}
              onRemoveItem={handleRemoveItem}
              mode={mode}
              hasStartedShopping={hasStartedShopping}
              className="animate-slide-up"
            />
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
