# Voice Shopper - Context

## Current State

Voice Shopper is a fully functional voice-controlled grocery shopping application built with React 18, TypeScript, and Vite. The application is currently in a stable state with all core features implemented and working.

## Recent Work

The project has been recently initialized with a comprehensive implementation including:

- **Core Application**: Complete voice recognition system with dual-mode operation (Adding and Shopping modes)
- **Speech Recognition**: Custom hook (`useSpeechRecognition`) with mobile optimizations and aggressive stop mechanisms
- **Grocery Database**: Comprehensive database of 200+ items across 14 categories with fuzzy matching
- **UI Components**: Full implementation using shadcn/ui components with Tailwind CSS styling
- **Routing**: React Router setup with Landing Page, Main App, and 404 handling
- **Mobile Microphone Fix (2025-12-27)**: Fixed critical issue where microphone wouldn't stop on mobile after clicking "Stop Adding". Added `forceStoppedRef` to prevent unwanted restarts and updated all event handlers to use synchronous refs instead of async state.

## Current Focus

The application is feature-complete for its core functionality. All major features are implemented:

1. Voice input for adding items with natural language processing
2. Shopping mode for hands-free item check-off
3. Category-based item organization with emoji display
4. Shopping list history management (save/load up to 10 lists)
5. Keyboard shortcuts (A for add, S for shop, Escape to stop)
6. Mobile-optimized speech recognition
7. Celebration system with audio feedback

## Known Technical Considerations

### Speech Recognition Challenges

- **Mobile Quirks**: Mobile browsers have different speech recognition behavior requiring special handling
- **Microphone Control**: Multiple stop mechanisms needed to ensure microphone stops reliably (up to 200ms timeout)
- **Race Condition Fix**: Event handlers now use synchronous refs (`isListeningRef.current`, `forceStoppedRef.current`) instead of async state to prevent microphone restarts
- **Auto-Stop Timeout**: 3-second timeout for adding mode to prevent no-speech errors
- **Continuous Listening**: Shopping mode has no timeout to allow indefinite operation

### Performance Optimizations

- **Debounced Processing**: 500ms debounce on transcript processing to avoid excessive re-renders
- **Aggressive Cleanup**: Multiple timeout clears and stop calls to prevent memory leaks
- **State Management**: Proper cleanup on mode changes and component unmount

## Next Steps

Potential areas for future enhancement:

1. **Testing**: Add unit and integration tests for speech recognition logic
2. **Error Handling**: Improve error recovery for speech recognition failures
3. **Offline Support**: Consider PWA capabilities for offline usage
4. **Analytics**: Add usage tracking to understand user behavior
5. **Internationalization**: Support for multiple languages
6. **Cloud Sync**: Backend integration for cross-device list synchronization

## Development Environment

- **Node.js**: Required for development (version 18+)
- **Package Manager**: npm (package-lock.json present)
- **Build Tool**: Vite with React SWC plugin
- **Dev Server**: Runs on port 8080 with host "::"
- **Linting**: ESLint with TypeScript support

## Deployment

The application is ready for deployment with:

- Production build configured via `npm run build`
- Static site hosting compatible (no backend required)
- Browser-native APIs only (no external service dependencies)
