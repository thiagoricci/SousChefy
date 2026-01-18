# SousChefy - Product Documentation

## Why This Project Exists

SousChefy addresses a common everyday problem: creating and managing shopping lists while keeping your hands free. Traditional shopping list apps require manual typing or tapping, which can be inconvenient when your hands are full or when you're multitasking. By leveraging modern browser-native speech recognition, SousChefy transforms the shopping list experience into a seamless, voice-controlled workflow.

## Problems It Solves

1. **Hands-Free Shopping List Creation**: Users can create shopping lists without touching their device - perfect for when cooking, cleaning, or when hands are occupied
2. **Natural Language Input**: No need to learn specific commands - users can speak naturally as they would to another person
3. **Multi-Item Recognition**: The app intelligently parses multiple items from a single speech input using natural separators like "and", "also", "plus"
4. **Quantity Support**: Handles both numeric quantities ("2 apples") and word quantities ("a dozen eggs", "three bananas")
5. **Shopping Mode**: Once the list is created, users can check off items hands-free while shopping by simply speaking item names
6. **Mobile Optimization**: Special handling for mobile devices to ensure smooth speech recognition operation

## How It Should Work

### User Flow

1. **Landing Page**: Users arrive at a welcoming landing page with a clear call-to-action to start using the app
2. **Add Items Mode**:
   - User clicks "Add Items" button
   - Microphone activates (with visual feedback - red pulsing indicator)
   - User speaks naturally: "I need apples, bananas, milk, and bread"
   - App parses speech and adds items to the list
   - User clicks "Stop Adding" when finished
3. **Review List**: Items are displayed organized by category with appropriate emojis
4. **Shopping Mode**:
   - User clicks "Start Shopping"
   - App listens for item names
   - When user says "apples", the app checks off apples from the list
   - Visual feedback shows progress (completed vs remaining items)
5. **Completion**: When all items are checked off, celebration sound plays and congratulatory message appears

### Voice Recognition Features

- **Natural Language Processing**: Supports conversational patterns with filler words ("I need", "get me", "buy")
- **Smart Separators**: Recognizes "and", "also", "plus", "then", commas, and pauses
- **Quantity Extraction**: Parses numeric and word-based quantities with optional units
- **Compound Item Recognition**: Handles multi-word items like "peanut butter", "orange juice"
- **Grocery Database**: Comprehensive database of 200+ grocery items across 14 categories for validation
- **Fuzzy Matching**: Finds best matches for spoken items to ensure consistency

### Shopping List Features

- **Category Organization**: Items automatically grouped by category (Fruits, Vegetables, Proteins, etc.)
- **Visual Emojis**: Each item displays an appropriate emoji for quick visual identification
- **Progress Tracking**: Shows completed count and remaining items
- **History Management**: Save and reload previous shopping lists (up to 10 lists)
- **Manual Controls**: Users can also manually toggle items or remove them

### ChefAI Features

- **Voice and Text Input**: Users can interact with ChefAI using either voice or text input
- **Shopping List Management**: ChefAI can add or remove items from the shopping list
- **Recipe Generation**: ChefAI can generate recipes based on ingredients or dish names
- **Recipe Saving**: Users can ask ChefAI to save recipes to their collection
- **Recipe Suggestions**: ChefAI can suggest recipe ideas when users ask "What can I cook?"
- **Automatic Tab Switching**: When ChefAI generates recipes, the app automatically switches to the Recipe tab
- **Streaming Responses**: Real-time streaming of ChefAI responses for immediate feedback
- **Shopping History Access**: ChefAI can reference past shopping lists for personalized recommendations
- **External Recipe Display**: Recipes from ChefAI are displayed in the Recipe tab with clear source indicators

## User Experience Goals

### Primary Goals

1. **Simplicity**: The interface should be intuitive and require minimal learning
2. **Speed**: Users should be able to create a shopping list in under 30 seconds
3. **Reliability**: Speech recognition should work consistently across different accents and speech patterns
4. **Accessibility**: Full keyboard navigation and screen reader support
5. **Mobile-First**: Optimized for mobile devices where voice input is most valuable

### Success Metrics

- **Speech Recognition Accuracy**: 90%+ accuracy for common grocery items
- **Task Completion Time**: Average time to create a 10-item list under 45 seconds
- **User Satisfaction**: Positive feedback on natural language understanding
- **Error Recovery**: Graceful handling of unrecognized items with helpful feedback

### Design Principles

1. **Clear Visual Feedback**: Users always know what mode they're in (Adding, Shopping, Idle)
2. **Forgiving Input**: The app should understand variations in speech patterns
3. **Fast Response**: Microphone should stop within 3 seconds when requested
4. **Clean Interface**: Minimal visual clutter with focus on the shopping list
5. **Celebratory Moments**: Positive reinforcement when tasks are completed

## Target Users

- **Busy Parents**: Need to quickly create lists while managing children
- **Home Cooks**: Want to add ingredients while cooking without stopping
- **Multi-Taskers**: Need to create lists while doing other activities
- **Accessibility Users**: Benefit from voice-first interface
- **Mobile Users**: Primary use case is on smartphones/tablets

## Key Differentiators

1. **Browser-Native Speech Recognition**: No API keys or cloud services required
2. **Natural Language Understanding**: No need to learn specific commands
3. **Dual-Mode Operation**: Separate modes for adding and shopping
4. **Comprehensive Grocery Database**: Built-in validation for 200+ items
5. **Mobile-Optimized**: Special handling for mobile speech recognition quirks
