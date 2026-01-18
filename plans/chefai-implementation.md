# ChefAI Implementation Plan

## Overview

ChefAI is an AI-powered cooking assistant that will be added to SousChefy as a floating chat widget. It will provide users with instant cooking advice, recipe suggestions, and kitchen tips.

## Key Features

### 1. Floating Chat Widget

- Expandable/collapsible bubble positioned in bottom-right corner
- Chef hat icon (👨‍🍳) with subtle animation
- Smooth expand/collapse transitions
- Badge indicator for unread messages
- Draggable positioning (optional enhancement)

### 2. Chat Interface

- Message history with user and AI messages
- Scrollable message container
- Timestamp for each message
- Clear conversation button
- Auto-scroll to latest message

### 3. Input Methods

- **Text Input**: Standard text field with send button
- **Voice Input**: Toggle button to switch between text and voice
  - Microphone button with visual feedback (pulsing when listening)
  - Real-time transcript display
  - Auto-send after silence detection
- **Quick Actions**: Pre-built question buttons (e.g., "What can I cook?", "Cooking tips")

### 4. AI Integration

- Use existing OpenAI API integration
- Context-aware responses:
  - Access to current shopping list items
  - Access to saved recipes
  - User preferences (if available)
- System prompt for cooking assistant persona
- Streaming responses for better UX
- Error handling with fallback messages

### 5. Visual Design

- Match app's existing design system (shadcn/ui)
- Primary color: Blue (#3b82f6) matching app theme
- Chef hat icon from Lucide React
- Typing indicator animation (three dots)
- Loading spinner during API calls
- Message bubbles with distinct styling for user vs AI

### 6. Mobile Responsiveness

- Full-width chat on mobile when expanded
- Optimized touch targets (44px minimum)
- Keyboard-aware input (avoid overlap with virtual keyboard)
- Swipe to dismiss on mobile

### 7. Keyboard Shortcuts

- `C` - Toggle ChefAI chat
- `Escape` - Close ChefAI when open
- `Enter` - Send message (in text input mode)
- Focus management for accessibility

### 8. Context Awareness

ChefAI will have access to:

- Current shopping list items (names, quantities, units)
- Saved recipes (names, ingredients)
- User's current tab (Make List, Recipes, History)
- View mode (editing vs shopping)

Context injection examples:

```typescript
// When user asks "What can I cook?"
System prompt: "User has these items in their shopping list: [items]"

// When user asks about a specific recipe
System prompt: "User has these saved recipes: [recipes]"
```

## Technical Architecture

### Component Structure

```
src/components/
├── ChefAI/
│   ├── ChefAI.tsx              # Main container component
│   ├── ChatBubble.tsx           # Floating bubble button
│   ├── ChatWindow.tsx           # Expandable chat interface
│   ├── MessageList.tsx          # Message history display
│   ├── MessageInput.tsx         # Input field with voice toggle
│   ├── TypingIndicator.tsx      # AI typing animation
│   └── QuickActions.tsx         # Pre-built question buttons
```

### Data Flow

```
User Input (Text/Voice)
    ↓
ChefAI Component
    ↓
Build Context (shopping list, recipes)
    ↓
OpenAI API Call
    ↓
Stream Response
    ↓
Update Message History
    ↓
Display to User
```

### State Management

```typescript
interface ChefAIState {
  isOpen: boolean; // Chat window open/closed
  messages: ChatMessage[]; // Message history
  isTyping: boolean; // AI typing indicator
  inputMode: "text" | "voice"; // Current input mode
  isListening: boolean; // Voice recognition active
  transcript: string; // Voice transcript
  context: ChefAIContext; // Current context data
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChefAIContext {
  shoppingList: ShoppingItem[];
  savedRecipes: SavedRecipe[];
  currentTab: string;
  viewMode: "editing" | "shopping";
}
```

## Implementation Steps

### Phase 1: Core Components

1. Create ChefAI folder structure
2. Implement ChatBubble component (floating button)
3. Implement ChatWindow component (expandable container)
4. Implement MessageList component (message display)
5. Implement MessageInput component (text + voice toggle)

### Phase 2: AI Integration

1. Extend `src/lib/openai.ts` with ChefAI-specific functions
2. Create context builder function
3. Implement streaming response handler
4. Add error handling and retry logic

### Phase 3: Voice Integration

1. Create custom hook for ChefAI voice recognition
2. Integrate with existing `useSpeechRecognition` pattern
3. Add visual feedback for listening state
4. Implement auto-send on silence detection

### Phase 4: Styling & UX

1. Apply Tailwind CSS styling to all components
2. Add animations and transitions
3. Implement mobile-responsive design
4. Add keyboard shortcuts
5. Add accessibility features (ARIA labels, focus management)

### Phase 5: Context Awareness

1. Pass shopping list and recipes to ChefAI
2. Build context-aware system prompts
3. Test contextual responses
4. Optimize context size for API efficiency

### Phase 6: Integration

1. Add ChefAI to GroceryApp component
2. Ensure proper z-index layering
3. Test across all app tabs and modes
4. Verify mobile behavior

### Phase 7: Testing & Polish

1. Test with various cooking questions
2. Test voice input accuracy
3. Test edge cases (empty lists, network errors)
4. Performance optimization
5. User feedback collection

## OpenAI API Integration

### System Prompt Template

```typescript
const CHEFAI_SYSTEM_PROMPT = `You are ChefAI, a helpful cooking assistant for SousChefy app.

Your role:
- Provide cooking advice, tips, and techniques
- Suggest recipes based on available ingredients
- Answer kitchen-related questions
- Help with meal planning and preparation

Context awareness:
- You have access to user's shopping list items
- You have access to user's saved recipes
- Use this information to provide personalized suggestions

Guidelines:
- Keep responses concise and practical
- Use clear, step-by-step instructions
- Suggest alternatives when ingredients are missing
- Be encouraging and supportive
- If you don't know something, admit it honestly

Current context:
Shopping list: ${shoppingListItems}
Saved recipes: ${savedRecipesNames}
Current view: ${currentTab} (${viewMode})
`;
```

### API Function

```typescript
export async function askChefAI(
  question: string,
  context: ChefAIContext,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    stream: true, // Enable streaming
    temperature: 0.7,
  });

  let fullResponse = "";

  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullResponse += content;
      onChunk?.(content);
    }
  }

  return fullResponse;
}
```

## UI Design Specifications

### Chat Bubble (Collapsed State)

- Position: Fixed, bottom-right, 24px from edges
- Size: 56px diameter (circle)
- Icon: Chef hat (Lucide React)
- Color: Primary blue (#3b82f6)
- Shadow: Medium shadow for depth
- Animation: Subtle pulse on hover
- Badge: Red dot for unread messages

### Chat Window (Expanded State)

- Position: Fixed, bottom-right, 24px from edges
- Size: 380px width, 500px height (desktop)
- Size: 100% width, 60vh height (mobile)
- Border radius: 16px
- Background: White with backdrop blur
- Shadow: Large shadow for elevation
- Header: ChefAI title + close button
- Body: Scrollable message area
- Footer: Input field + send button

### Message Styling

- User messages: Blue background, white text, right-aligned
- AI messages: Gray background, dark text, left-aligned
- Timestamp: Small, muted, below message
- Typing indicator: Three animated dots

### Input Area

- Text input: Full width, 44px height
- Voice toggle: Button with microphone icon
- Send button: Blue, right-aligned
- Voice mode: Pulsing red indicator when listening

## Performance Considerations

1. **Message History**: Limit to last 20 messages to manage context window
2. **Debouncing**: Debounce voice input (500ms) to prevent excessive API calls
3. **Streaming**: Use streaming responses for better perceived performance
4. **Caching**: Cache common questions/answers (optional enhancement)
5. **Optimization**: Lazy load ChefAI component until first interaction

## Accessibility

1. **Keyboard Navigation**: Full keyboard support for all interactions
2. **ARIA Labels**: Proper labels for screen readers
3. **Focus Management**: Maintain focus when opening/closing
4. **Color Contrast**: WCAG AA compliant colors
5. **Error Messages**: Clear error descriptions for screen readers
6. **Voice Input**: Alternative text input always available

## Future Enhancements

1. **Recipe Integration**: Add "Add to Shopping List" button in recipe suggestions
2. **Image Upload**: Allow users to upload food photos for identification
3. **Meal Planning**: Suggest weekly meal plans based on shopping list
4. **Shopping Suggestions**: Suggest items to add based on recipes
5. **Voice Responses**: Text-to-speech for AI responses
6. **Multi-language**: Support for different languages
7. **Personalization**: Learn user preferences over time

## Success Metrics

1. **Usage Rate**: Percentage of users who interact with ChefAI
2. **Response Time**: Average time from question to answer
3. **Satisfaction**: User feedback on helpfulness
4. **Context Accuracy**: How often ChefAI uses shopping list context
5. **Error Rate**: Percentage of failed API calls

## Dependencies

### Required (Already Available)

- React 18.3.1
- TypeScript 5.8.3
- OpenAI 6.16.0
- Lucide React 0.462.0
- Tailwind CSS 3.4.17
- shadcn/ui components

### New Dependencies (None Needed)

All required dependencies are already installed in the project.

## Timeline Estimate

- Phase 1 (Core Components): 2-3 hours
- Phase 2 (AI Integration): 1-2 hours
- Phase 3 (Voice Integration): 2-3 hours
- Phase 4 (Styling & UX): 2-3 hours
- Phase 5 (Context Awareness): 1-2 hours
- Phase 6 (Integration): 1 hour
- Phase 7 (Testing & Polish): 2-3 hours

**Total Estimated Time**: 11-17 hours

## Risks & Mitigations

### Risk 1: OpenAI API Cost

- **Mitigation**: Use gpt-4o-mini (cost-effective), implement rate limiting

### Risk 2: Voice Recognition Accuracy

- **Mitigation**: Provide text input fallback, clear transcript display

### Risk 3: Context Window Limits

- **Mitigation**: Limit message history, optimize context size

### Risk 4: Mobile Performance

- **Mitigation**: Lazy loading, efficient state management

### Risk 5: User Privacy

- **Mitigation**: Clear data usage policy, no persistent storage of conversations

## Conclusion

ChefAI will significantly enhance SousChefy by providing instant, context-aware cooking assistance. The implementation leverages existing infrastructure (OpenAI API, voice recognition) and follows the app's established design patterns. The phased approach ensures manageable development and testing.

Key success factors:

- Seamless integration with existing app
- Responsive, mobile-friendly design
- Accurate voice recognition
- Context-aware, helpful responses
- Smooth, intuitive UX
