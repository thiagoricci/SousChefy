# 🛒 SousChefy - AI-Powered Grocery Shopping Assistant

A revolutionary grocery shopping application that transforms how you create and manage shopping lists. SousChefy leverages modern AI to provide an intuitive shopping experience.

![SousChefy Demo](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=SousChefy+Demo)

## ✨ Key Features

### 🎤 **Easy Shopping List Management**

- **Natural Language Input**: Add items naturally - "I need apples, bananas, milk, and bread"
- **Dual-Mode Operation**: Separate "Editing" mode for list creation and "Shopping" mode for checking off items
- **Quantity Parsing**: Handles both numeric quantities ("2 apples") and word quantities ("a dozen eggs", "three bananas")
- **Multi-Item Recognition**: Intelligently parses multiple items from a single input using natural separators
- **Grocery Database**: Comprehensive database of 200+ items across 14 categories with fuzzy matching

### 🤖 **ChefAI - Your Personal Shopping Assistant**

- **Text Input**: Interact with ChefAI using text input
- **Smart List Management**: Tell ChefAI what you need and it adds items to your shopping list automatically
- **AI-Powered Recipe Generation**: Generate recipes by dish name or get recommendations based on ingredients
- **Recipe Saving**: Ask ChefAI to save any recipe it generates directly to your collection
- **Shopping History Access**: ChefAI can reference your past shopping lists for personalized recommendations
- **Streaming Responses**: Real-time feedback as ChefAI processes your requests
- **One-Sentence Responses**: Clean, concise answers with automatic tab routing
- **Tab-Based Routing**: ChefAI automatically switches to the appropriate tab (Home, Recipes, Cooking, Favorites)

### 🍳 **Recipe Management**

- **Recipe Generation by Dish**: Get complete recipes by dish name with ingredients, instructions, prep time, cook time, servings, and difficulty
- **Ingredient-Based Recommendations**: Get 5 recipe suggestions based on ingredients you have
- **Recipe Details View**: View complete recipes with step-by-step instructions
- **Save to Collection**: Save your favorite recipes for quick access
- **Add Ingredients to List**: One-click to add all recipe ingredients to your shopping list
- **Cooking Mode**: Follow recipes with step-by-step instructions and built-in timers

### 📱 **Modern Interface & PWA**

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Beautiful Animations**: Smooth transitions and micro-interactions
- **Accessibility**: Full keyboard navigation and screen reader support
- **Progressive Web App**: Install on your device for offline access
- **Mobile-First**: Optimized touch interactions and mobile layouts
- **Inline Chat Panel**: Collapsible chat interface for seamless ChefAI interaction

### 🔐 **Authentication & Data Persistence**

- **User Accounts**: Create accounts to save your data across devices
- **Secure Authentication**: JWT-based authentication system
- **Cloud Storage**: Shopping lists and recipes saved to PostgreSQL database
- **History Management**: Save and reload previous shopping lists
- **Offline Support**: PWA capabilities with service worker caching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern web browser (Chrome, Safari, Edge)
- PostgreSQL database (for backend features)
- OpenAI API key (for ChefAI features)

### Installation

1. **Clone the repository**

   ```bash
    git clone <YOUR_GIT_URL>
    cd Grocerli
   ```

2. **Install frontend dependencies**

   ```bash
    npm install
   ```

3. **Install backend dependencies**

   ```bash
    cd backend
    npm install
    cd ..
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```

   Create a `.env` file in the `backend` directory:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/souschefy
   JWT_SECRET=your_jwt_secret_here
   ```

   Or copy from the examples:

   ```bash
   cp .env.example .env
   # Edit .env and add your OpenAI API key

   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

5. **Set up the database**

   ```bash
   cd backend
   npx prisma migrate dev
   cd ..
   ```

6. **Start development servers**

   Terminal 1 - Frontend:

   ```bash
   npm run dev
   ```

   Terminal 2 - Backend:

   ```bash
   cd backend
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:8080`

## 📋 Usage Guide

### Getting Started

1. **Add Items**: Click "Add Items" button and type naturally
2. **Specify Quantities**: Type "2 apples", "a dozen eggs", "three bananas"
3. **Use Natural Separators**: "and", "also", "plus" work seamlessly
4. **Stop Adding**: Click "Stop Adding" when finished
5. **Start Shopping**: Click "Start Shopping" to begin shopping
6. **Check Off Items**: Click item names to check them off your list
7. **Complete**: Enjoy celebration when your list is done!

### Using ChefAI

1. **Open Chat Panel**: Click the green chat bubble in the top-right corner
2. **Text Input**: Type your request
3. **Common Commands**:
   - "I need milk, eggs, and bread" - Adds items to your list
   - "What can I cook?" - Shows 5 recipe suggestions
   - "Give me a lasagna recipe" - Generates and saves a complete recipe
   - "Show my history" - Displays your shopping history
   - "Save this recipe" - Saves the current recipe to your collection

### Using Recipes

1. **Navigate to Recipes Tab**: Click on "Recipes" in navigation
2. **Generate Recipe**: Enter a dish name or ingredients
3. **View Details**: Click on a recipe to see full instructions
4. **Save Recipe**: Save your favorite recipes for quick access
5. **Add to List**: One-click to add all recipe ingredients to your shopping list
6. **Cooking Mode**: Follow recipes with step-by-step instructions

### Managing History

1. **Navigate to Favorites Tab**: Click on "Favorites" in navigation
2. **Load List**: Click on any saved list to reload it
3. **Delete List**: Remove individual lists you no longer need
4. **View Recipes**: Access your saved recipes

### Keyboard Shortcuts

- **A** - Start adding items
- **S** - Start shopping
- **Escape** - Stop current action

### Tips for Best Results

- **Type clearly** and naturally
- **Use compound words**: "peanut butter", "orange juice"
- **Specify quantities**: "2 apples", "a dozen eggs"
- **Use natural separators**: "and", "also", "plus"
- **Ask ChefAI** for recipe ideas based on ingredients
- **Use cooking mode** for step-by-step recipe following

## 🏗️ Technical Architecture

### Frontend Stack

- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.8.3** - Type-safe development with enhanced developer experience
- **Vite 5.4.19** - Lightning-fast build tool and development server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - High-quality, accessible component library built on Radix UI
- **Lucide React 0.462.0** - Beautiful icon library
- **React Router DOM 6.30.1** - Client-side routing
- **TanStack Query 5.83.0** - Data fetching and caching

### Backend Stack

- **Express.js** - RESTful API server
- **Prisma ORM** - Database ORM for PostgreSQL
- **PostgreSQL** - Relational database for data persistence
- **JWT Authentication** - Secure user authentication
- **TypeScript** - Type-safe backend development

### Core Technologies

- **Web Audio API** - Celebration sound effects
- **OpenAI API** - GPT-4o-mini for ChefAI
- **Vite PWA Plugin** - Progressive Web App support
- **React Hooks** - useState, useEffect, useCallback for state management

### Performance Optimizations

- **Debounced Processing** - Optimized input handling (500ms debounce)
- **Mobile-First** - Responsive design with mobile optimizations
- **Efficient Rendering** - Optimized component updates
- **Clean State Management** - Proper cleanup prevents memory leaks
- **Service Worker Caching** - Offline support and fast loading

## 🎨 Features in Detail

### Natural Language Processing

- **Conversational Patterns**: Supports natural input with filler words
- **Smart Separators**: Recognizes "and", "also", "plus", "then", commas, and pauses
- **Quantity Extraction**: Parses numeric and word-based quantities with optional units
- **Compound Item Recognition**: Handles multi-word items like "peanut butter", "orange juice"
- **Grocery Database**: Comprehensive database of 200+ items across 14 categories
- **Fuzzy Matching**: Finds best matches for items to ensure consistency

### ChefAI Capabilities

- **List Management**: Add or remove items from shopping lists
- **Recipe Generation**: Generate recipes by dish name or ingredients
- **Recipe Saving**: Save recipes directly from conversations
- **History Access**: Reference past shopping lists for personalized recommendations
- **Tab Routing**: Automatically switches to appropriate tabs based on request type
- **Streaming Responses**: Real-time feedback as ChefAI processes requests
- **Text Input**: Clean text input interface
- **Auto-Send on Silence**: Automatically sends after 3 seconds of no typing

### Shopping List Features

- **Category Organization**: Items automatically grouped by category with emojis
- **Progress Tracking**: Visual progress bar shows completion status
- **Edit Items**: Click on any item to modify its name, quantity, or unit
- **Remove Items**: Delete items you no longer need
- **History**: Save completed lists to history
- **Persistence**: Lists automatically saved to database (for authenticated users)
- **Recipe Integration**: Add ingredients directly from saved recipes

### Recipe Management

- **Recipe Generation**: Get recipes by dish name or ingredient recommendations
- **Recipe Details**: View complete recipes with ingredients, instructions, prep time, cook time, servings, and difficulty
- **Save Favorites**: Keep your favorite recipes for quick access
- **Add to List**: One-click to add all recipe ingredients to shopping list
- **Cooking Mode**: Follow recipes with step-by-step instructions and built-in timers
- **External Recipes**: Display recipes from ChefAI with clear source indicators

### PWA Features

- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Works without internet connection (except ChefAI features)
- **Splash Screens**: Custom splash screens for iOS devices
- **Service Worker**: Automatic caching for fast loading
- **App Icon**: Custom app icon for home screen

## 🔒 Authentication & Security

- **User Registration**: Create accounts with email and password
- **Secure Login**: JWT-based authentication
- **Protected Routes**: API endpoints require valid authentication
- **User-Specific Data**: All data operations are filtered by userId
- **Password Hashing**: Secure password storage with bcrypt

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/your-username/grocerli.git
cd Grocerli

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Set up environment variables
cp .env.example .env
# Edit .env and add your OpenAI API key

cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Set up the database
cd backend
npx prisma migrate dev
cd ..

# Start development servers
npm run dev                    # Frontend (Terminal 1)
cd backend && npm run dev      # Backend (Terminal 2)
```

### Available Scripts

**Frontend:**

- `npm run dev` - Start development server on port 8080
- `npm run build` - Build for production
- `npm run build:dev` - Build for development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**Backend:**

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies for a seamless user experience
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Recipe generation powered by [OpenAI](https://openai.com/)
- PWA support via [Vite PWA Plugin](https://vite-plugin-pwa.netlify.app/)
- Database ORM by [Prisma](https://www.prisma.io/)

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

## 🌐 Browser Compatibility

### Supported Browsers

- **Chrome/Edge** (full support) - Recommended for best experience
- **Safari** (full support)
- **Firefox** (full support)

### Mobile Considerations

- **iOS Safari**: Full support with responsive design
- **Android Chrome**: Generally good support
- **Requires HTTPS**: Secure context recommended

---

**Made with ❤️ for smarter grocery shopping**
