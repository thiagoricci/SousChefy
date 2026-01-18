# SousChefy - Technical Documentation

## Technologies Used

### Frontend Framework

- **React 18.3.1**: Modern React with hooks and concurrent features
- **TypeScript 5.8.3**: Type-safe development with enhanced developer experience
- **Vite 5.4.19**: Lightning-fast build tool and development server
- **@vitejs/plugin-react-swc 3.11.0**: React SWC plugin for fast compilation

### Styling

- **Tailwind CSS 3.4.17**: Utility-first CSS framework for rapid UI development
- **tailwindcss-animate 1.0.7**: Animation utilities for Tailwind
- **shadcn/ui**: High-quality, accessible component library built on Radix UI
- **PostCSS 8.5.6**: CSS transformation tool
- **Autoprefixer 10.4.21**: CSS vendor prefixing

### UI Components

- **Radix UI Primitives**: Unstyled, accessible component primitives
  - @radix-ui/react-accordion, alert-dialog, aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, label, menubar, navigation-menu, popover, progress, radio-group, scroll-area, select, separator, slider, switch, tabs, toast, toggle, toggle-group, tooltip
- **Lucide React 0.462.0**: Beautiful icon library
- **class-variance-authority 0.7.1**: Variant-based styling
- **clsx 2.1.1**: Conditional className utility
- **tailwind-merge 2.6.0**: Tailwind className merging
- **Custom Chat Components**: ChatBubble (green floating button at top-right) and ChatPanel (inline collapsible chat interface)

### Routing & State Management

- **React Router DOM 6.30.1**: Client-side routing
- **TanStack Query 5.83.0**: Data fetching and caching (currently used for QueryClientProvider)

### Form Handling

- **React Hook Form 7.61.1**: Form state management
- **@hookform/resolvers 3.10.0**: Form validation resolvers
- **Zod 3.25.76**: Schema validation

### Additional Libraries

- **date-fns 3.6.0**: Date manipulation utilities
- **embla-carousel-react 8.6.0**: Carousel component
- **recharts 2.15.4**: Charting library
- **sonner 1.7.4**: Toast notifications
- **next-themes 0.3.0**: Theme management
- **vaul 0.9.9**: Drawer component
- **cmdk 1.1.1**: Command palette
- **input-otp 1.4.2**: One-time password input

### Development Tools

- **ESLint 9.32.0**: Code linting
- **@eslint/js 9.32.0**: ESLint JavaScript configuration
- **typescript-eslint 8.38.0**: TypeScript ESLint plugin
- **eslint-plugin-react-hooks 5.2.0**: React hooks linting
- **eslint-plugin-react-refresh 0.4.20**: React refresh linting
- **globals 15.15.0**: Global variables for ESLint

### Browser APIs

- **Web Speech API**: Browser-native speech recognition
- **Web Audio API**: Audio generation for celebration sounds
- **OpenAI API**: GPT-4o-mini model for recipe generation

### AI Integration

- **OpenAI API**: GPT-4o-mini model for ChefAI
  - Function calling support for actions (add/remove items, save recipes, show recipes)
  - Streaming responses for real-time feedback
  - Context-aware conversations with shopping list, recipes, and history
- **Environment Variables**: `VITE_OPENAI_API_KEY` required for ChefAI functionality

### Backend Integration

- **Express.js**: RESTful API server for data persistence
- **Prisma ORM**: Database ORM for PostgreSQL
- **PostgreSQL**: Relational database for storing lists, recipes, and user data
- **Authentication**: JWT-based authentication system
- **API Endpoints**:
  - `/api/lists`: Shopping list CRUD operations
  - `/api/recipes`: Recipe CRUD operations
  - `/api/auth`: User authentication and session management

## Development Setup

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Package manager (package-lock.json present)
- **Modern Browser**: Chrome, Safari, or Edge with microphone support

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd voice-shopper

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server on port 8080
npm run build        # Build for production
npm run build:dev    # Build for development mode
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Development Server Configuration

- **Host**: "::" (all interfaces)
- **Port**: 8080
- **History API Fallback**: Enabled for client-side routing

## Technical Constraints

### Browser Support

- **Chrome/Edge**: Full support for Web Speech API
- **Safari**: Partial support, different behavior
- **Firefox**: Limited support
- **Mobile**: Special handling required for mobile browsers

### Speech Recognition Limitations

- **HTTPS Required**: Speech API requires secure context
- **Microphone Permission**: User must grant microphone access
- **Browser-Dependent**: Behavior varies across browsers
- **No Cross-Browser Consistency**: Different implementations across browsers

### Performance Considerations

- **Grocery Database**: O(n) lookup through 200+ items
- **Speech Recognition**: Browser-dependent performance
- **Large Lists**: Rendering performance with 100+ items

## Dependencies

### Production Dependencies

All dependencies listed in package.json under "dependencies" are required for production builds.

### Development Dependencies

All dependencies listed in package.json under "devDependencies" are only required for development.

### Key Dependencies by Category

**Core Framework**: react, react-dom, typescript
**Build Tools**: vite, @vitejs/plugin-react-swc
**Styling**: tailwindcss, postcss, autoprefixer
**UI Components**: shadcn/ui components (Radix UI primitives)
**Routing**: react-router-dom
**State**: @tanstack/react-query
**Forms**: react-hook-form, @hookform/resolvers, zod
**Icons**: lucide-react
**Utilities**: clsx, tailwind-merge, class-variance-authority
**Development**: eslint, typescript-eslint, @types packages

## Tool Usage Patterns

### Code Quality

- **ESLint**: Configured with TypeScript support and React rules
- **TypeScript**: Strict mode disabled for flexibility (noImplicitAny: false)
- **Path Aliases**: `@/*` maps to `./src/*`

### Build Configuration

- **Vite**: Fast HMR with React SWC plugin
- **Path Resolution**: Custom alias for `@` imports
- **Component Tagger**: Lovable component tagger in development mode

### Styling Configuration

- **Tailwind CSS**: Utility-first approach with custom theme
- **CSS Variables**: HSL-based color system for theming
- **Dark Mode**: Class-based dark mode support
- **Animations**: Custom keyframes for accordion and other animations

### TypeScript Configuration

- **Project References**: Separate configs for app and node
- **Path Aliases**: `@/*` maps to `./src/*`
- **Strict Mode**: Disabled for flexibility
- **Skip Lib Check**: Enabled for faster builds

## File Structure Patterns

### Component Organization

- **UI Components**: Located in `src/components/ui/` (shadcn/ui)
- **Feature Components**: Located in `src/components/`
- **Pages**: Located in `src/pages/`
- **Hooks**: Located in `src/hooks/`
- **Types**: Located in `src/types/`
- **Data**: Located in `src/data/`
- **Utilities**: Located in `src/lib/`

### Naming Conventions

- **Components**: PascalCase (e.g., `GroceryApp`, `ShoppingList`)
- **Hooks**: camelCase with `use` prefix (e.g., `useSpeechRecognition`, `useDebounce`)
- **Types**: PascalCase (e.g., `ShoppingItem`, `AppMode`)
- **Utilities**: camelCase (e.g., `cn`, `isValidGroceryItem`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `GROCERY_ITEMS`, `CATEGORY_NAMES`)

### Import Patterns

- **Absolute Imports**: Use `@/` alias for src directory
- **Component Imports**: From `@/components/` or `@/components/ui/`
- **Hook Imports**: From `@/hooks/`
- **Type Imports**: From `@/types/`
- **Utility Imports**: From `@/lib/`

## Environment Variables

- **VITE_OPENAI_API_KEY**: Required for ChefAI functionality (OpenAI GPT-4o-mini API key)
- The application runs primarily in the browser with ChefAI requiring OpenAI API access
- Backend API endpoints are configured in `src/lib/api.ts` and related API files

## Deployment

### Build Process

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Static Hosting

The application is a static site and can be deployed to any static hosting service:

- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

### Requirements

- HTTPS (required for Web Speech API)
- Backend server for data persistence (Express.js + PostgreSQL)
- OpenAI API key for ChefAI functionality
- Environment variable: `VITE_OPENAI_API_KEY`

### Deployment Checklist

1. Build application: `npm run build`
2. Upload `dist/` directory to hosting service
3. Ensure HTTPS is enabled
4. Test microphone permissions
5. Test speech recognition functionality
6. Test ChefAI recipe saving and history access
7. Verify recipe persistence to database
8. Test shopping list management
9. Verify shopping history access
10. Configure `VITE_OPENAI_API_KEY` environment variable for ChefAI functionality
