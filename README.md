# 🛒 SousChefy - Smart Grocery Shopping Assistant

A modern grocery shopping application that helps you create and manage shopping lists with ease. Add items manually, discover AI-powered recipes, and enjoy a seamless shopping experience!

![SousChefy Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=SousChefy+Demo)

## ✨ Key Features

### 🎯 **Easy Item Management**

- **Simple Interface**: Type items directly into the input field
- **Quick Entry**: Press Enter to add items instantly
- **Quantity & Unit Support**: Specify amounts with flexible unit options (lbs, oz, kg, cups, etc.)
- **Smart Parsing**: Automatically extracts quantities from your input
- **Duplicate Detection**: Prevents adding the same item twice
- **Edit Items**: Click any item to modify its name, quantity, or unit

### 🍳 **AI-Powered Recipes**

- **Recipe Discovery**: Generate recipes based on ingredients you have
- **Save Recipes**: Keep your favorite recipes for quick access
- **Add Ingredients**: One-click to add all recipe ingredients to your shopping list
- **Recipe Details**: View complete recipes with ingredients and instructions
- **OpenAI Integration**: Powered by GPT for intelligent recipe suggestions

### 🛒 **Dual-Mode Operation**

- **Editing Mode**: Create and manage your shopping list
- **Shopping Mode**: Check off items as you shop with progress tracking
- **Flexible Editing**: Edit item names, quantities, or remove items anytime
- **Add While Shopping**: Continue adding items even in shopping mode

### 🎉 **Enhanced User Experience**

- **Celebration System**: Audio celebration when shopping list is completed
- **Visual Feedback**: Smooth animations and real-time updates
- **Progress Tracking**: Live completion counter and percentage display
- **History Management**: Save and reload previous shopping lists (up to 10 lists)
- **Local Storage**: Your lists and recipes persist between sessions

### 📱 **Modern Interface & PWA**

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Beautiful Animations**: Smooth transitions and micro-interactions
- **Accessibility**: Full keyboard navigation and screen reader support
- **Clean UI**: Streamlined interface with no unnecessary visual clutter
- **Progressive Web App**: Install on your device for offline access
- **Mobile-First**: Optimized touch interactions and mobile layouts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser
- OpenAI API key (for recipe features)

### Installation

1. **Clone the repository**

   ```bash
   git clone <YOUR_GIT_URL>
   cd Grocerli
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

   Or copy from the example:

   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📋 Usage Guide

### Getting Started

1. **Add Items**: Type items in the input field and press Enter
2. **Specify Quantity & Unit**: Use the quantity and unit fields for precise measurements
3. **Edit List**: Click on any item to edit its name, quantity, or unit
4. **Remove Items**: Click the delete button to remove items
5. **Start Shopping**: Click "Start Shopping" when your list is ready
6. **Check Off Items**: Click items to mark them as completed
7. **Complete**: Enjoy the celebration when your list is done!

### Using Recipes

1. **Navigate to Recipes Tab**: Click on "Recipes" in the navigation
2. **Generate Recipe**: Enter ingredients you have and let AI suggest recipes
3. **View Details**: Click on a recipe to see full instructions
4. **Save Recipe**: Save your favorite recipes for quick access
5. **Add to List**: One-click to add all recipe ingredients to your shopping list

### Managing History

1. **Navigate to History Tab**: Click on "History" in the navigation
2. **Load List**: Click on any saved list to reload it
3. **Delete List**: Remove individual lists you no longer need
4. **Clear History**: Remove all saved lists at once

### Tips for Best Results

- **Type clearly** and press Enter to add items
- **Include quantities** naturally: "2 apples", "a dozen eggs"
- **Use units**: Select appropriate units (lbs, cups, pieces, etc.)
- **Use compound words**: "peanut butter", "orange juice"
- **Edit items** by clicking on them to correct mistakes
- **Save time** by using the history tab to reload previous lists
- **Discover recipes** based on ingredients you have at home

### Supported Item Types

- **Fresh Produce**: fruits, vegetables, herbs
- **Dairy**: milk, cheese, yogurt, eggs
- **Bakery**: bread, pastries, baked goods
- **Meat & Seafood**: beef, chicken, fish, seafood
- **Pantry Staples**: canned goods, pasta, rice, beans
- **Beverages**: juices, sodas, water, coffee, tea
- **Household**: cleaning supplies, paper products
- **Personal Care**: toiletries, medications

### Shopping List Features

- **Editing Mode**: Create and modify your shopping list
- **Shopping Mode**: Check off items with progress tracking
- **Item Management**: Edit names, quantities, units, or remove items
- **History**: Save up to 10 completed shopping lists
- **Persistence**: Lists and recipes automatically saved to local storage
- **Recipe Integration**: Add ingredients directly from saved recipes

## 🏗️ Technical Architecture

### Frontend Stack

- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.8.3** - Type-safe development with enhanced developer experience
- **Vite 5.4.19** - Lightning-fast build tool and development server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - High-quality, accessible component library built on Radix UI
- **Lucide React 0.462.0** - Beautiful icon library

### Core Technologies

- **React Hooks** - useState, useEffect, useCallback for state management
- **React Router DOM 6.30.1** - Client-side routing
- **TanStack Query 5.83.0** - Data fetching and caching
- **Local Storage** - Persistent shopping list and recipe history
- **Web Audio API** - Celebration sound effects
- **OpenAI API** - AI-powered recipe generation
- **Vite PWA Plugin 1.2.0** - Progressive Web App support

### Performance Optimizations

- **Debounced Processing** - Optimized input handling
- **Mobile-First** - Responsive design with mobile optimizations
- **Efficient Rendering** - Optimized component updates
- **Clean State Management** - Proper cleanup prevents memory leaks
- **Service Worker Caching** - Offline support and fast loading

## 🎨 Features in Detail

### Text Input System

- **Quantity Extraction**: Automatically detects numeric and word-based quantities
- **Smart Parsing**: Handles "2 apples", "a dozen eggs", "three bananas"
- **Unit Selection**: Choose from 20+ unit options (lbs, oz, kg, cups, tbsp, etc.)
- **Duplicate Prevention**: Warns when trying to add existing items
- **Quick Entry**: Press Enter to add items instantly

### Shopping List Management

- **Edit Items**: Click on any item to modify its name, quantity, or unit
- **Remove Items**: Delete items you no longer need
- **Progress Tracking**: Visual progress bar shows completion status
- **Auto-Save**: Lists automatically saved to local storage
- **Unique List IDs**: Each list has a unique identifier for proper editing

### AI-Powered Recipes

- **Recipe Generation**: Get recipe suggestions based on ingredients you have
- **Recipe Details**: View complete recipes with ingredients and instructions
- **Save Favorites**: Keep your favorite recipes for quick access
- **Add to List**: One-click to add all recipe ingredients to shopping list
- **OpenAI Integration**: Powered by GPT for intelligent suggestions

### History System

- **Save Lists**: Completed lists automatically saved to history
- **Load Lists**: Reload any previous list from history
- **Delete Lists**: Remove individual lists from history
- **Clear History**: Remove all saved lists at once
- **Timestamp Tracking**: See when lists were created and last modified

### PWA Features

- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Works without internet connection (except recipe generation)
- **Splash Screens**: Custom splash screens for iOS devices
- **Service Worker**: Automatic caching for fast loading
- **App Icon**: Custom app icon for home screen

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/grocerli.git
cd Grocerli

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

# Start development server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev) for rapid prototyping
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Recipe generation powered by [OpenAI](https://openai.com/)
- PWA support via [Vite PWA Plugin](https://vite-plugin-pwa.netlify.app/)

## 🆘 Support

Having issues? Check out our [Troubleshooting Guide](TROUBLESHOOTING.md) or create an issue on GitHub.

## 📱 PWA Installation

### Desktop (Chrome/Edge)

1. Open the application in Chrome or Edge
2. Click the install icon (⊕) in the address bar
3. Click "Install" to add the app to your desktop
4. Launch the app from your desktop or start menu

### iOS (iPhone/iPad)

1. Open the application in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to install the app
5. Launch the app from your home screen

### Android (Chrome)

1. Open the application in Chrome
2. Tap the menu button (three dots)
3. Tap "Install app" or "Add to Home screen"
4. Tap "Install" to confirm
5. Launch the app from your home screen

---

**Made with ❤️ for smarter grocery shopping**
