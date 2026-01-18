# ChefAI Architecture Diagram

## Component Hierarchy

```mermaid
graph TD
    A[GroceryApp] --> B[ChefAI]
    B --> C[ChatBubble]
    B --> D[ChatWindow]
    D --> E[ChatHeader]
    D --> F[MessageList]
    D --> G[MessageInput]
    G --> H[TextInput]
    G --> I[VoiceInput]
    G --> J[QuickActions]
    F --> K[MessageItem]
    F --> L[TypingIndicator]
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant ChatBubble
    participant ChatWindow
    participant MessageInput
    participant VoiceRecognition
    participant OpenAI API
    participant MessageList

    User->>ChatBubble: Click to open
    ChatBubble->>ChatWindow: Expand
    ChatWindow->>MessageInput: Focus

    alt Text Input
        User->>MessageInput: Type question
        User->>MessageInput: Press Enter
        MessageInput->>ChatWindow: Send message
    else Voice Input
        User->>MessageInput: Click microphone
        MessageInput->>VoiceRecognition: Start listening
        VoiceRecognition-->>MessageInput: Transcript
        User->>VoiceRecognition: Speak question
        VoiceRecognition->>MessageInput: Auto-send
        MessageInput->>ChatWindow: Send message
    end

    ChatWindow->>ChatWindow: Build context<br/>(shopping list, recipes)
    ChatWindow->>OpenAI API: Request with context
    OpenAI API-->>ChatWindow: Stream response
    ChatWindow->>MessageList: Update messages
    MessageList-->>User: Display AI response
```

## State Management Flow

```mermaid
graph LR
    A[User Action] --> B{Input Type?}
    B -->|Text| C[Update Input State]
    B -->|Voice| D[Start Speech Recognition]
    D --> E[Update Transcript]
    E --> F[Auto-send on Silence]
    C --> G[Send Message]
    F --> G
    G --> H[Build Context]
    H --> I[Call OpenAI API]
    I --> J[Stream Response]
    J --> K[Update Messages]
    K --> L[Render Messages]
```

## Context Injection Flow

```mermaid
graph TD
    A[User Question] --> B[ChefAI Component]
    B --> C[Fetch Shopping List]
    B --> D[Fetch Saved Recipes]
    B --> E[Get Current Tab]
    B --> F[Get View Mode]
    C --> G[Context Builder]
    D --> G
    E --> G
    F --> G
    G --> H[System Prompt + Context]
    H --> I[OpenAI API Call]
    I --> J[Context-Aware Response]
```

## Component State Flow

```mermaid
stateDiagram-v2
    [*] --> Collapsed: Initial
    Collapsed --> Expanded: Click bubble
    Expanded --> Collapsed: Click close/Escape
    Expanded --> Listening: Click microphone
    Listening --> Typing: Send message
    Typing --> Streaming: API response starts
    Streaming --> Ready: Response complete
    Ready --> Listening: Click microphone
    Ready --> Typing: Type new message
    Typing --> Collapsed: Click close
```

## File Structure

```
src/
├── components/
│   ├── ChefAI/
│   │   ├── ChefAI.tsx              # Main container (orchestrator)
│   │   ├── ChatBubble.tsx           # Floating button component
│   │   ├── ChatWindow.tsx           # Expandable chat interface
│   │   ├── ChatHeader.tsx           # Header with title + close
│   │   ├── MessageList.tsx          # Message history display
│   │   ├── MessageItem.tsx           # Individual message component
│   │   ├── TypingIndicator.tsx      # AI typing animation
│   │   ├── MessageInput.tsx         # Input field + voice toggle
│   │   ├── TextInput.tsx            # Text input component
│   │   ├── VoiceInput.tsx           # Voice input component
│   │   └── QuickActions.tsx         # Pre-built question buttons
│   └── GroceryApp.tsx              # Parent component
├── hooks/
│   ├── useChefAI.ts                 # Custom hook for ChefAI logic
│   └── useChefAIVoice.ts           # Voice recognition for ChefAI
├── lib/
│   ├── openai.ts                    # Extended with ChefAI functions
│   └── chefai-context.ts           # Context builder utilities
└── types/
    └── chefai.ts                   # TypeScript types for ChefAI
```

## Integration Points

```mermaid
graph LR
    A[ChefAI] -->|Reads| B[Shopping List State]
    A -->|Reads| C[Saved Recipes State]
    A -->|Reads| D[Active Tab State]
    A -->|Reads| E[View Mode State]
    A -->|Uses| F[OpenAI API]
    A -->|Uses| G[Web Speech API]
    A -->|Displays in| H[Fixed Overlay]
```

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                   Main App Content                       │
│                  (GroceryApp)                           │
│                                                         │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                                                    ┌─────────┐
                                                    │  👨‍🍳   │  ← ChatBubble
                                                    │ ChefAI  │  (collapsed)
                                                    └─────────┘

┌─────────────────────────────────────────────────────────┐
│                   Main App Content                       │
│                                                         │
│                                                         │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                                                ┌──────────────────────┐
                                                │  👨‍🍳 ChefAI      │  ← ChatWindow
                                                ├──────────────────────┤  (expanded)
                                                │  [Messages]        │
                                                │                    │
                                                │  User: How do I   │
                                                │        cook rice?   │
                                                │                    │
                                                │  ChefAI: Here's    │
                                                │         how...      │
                                                │                    │
                                                │  [▓▓▓] typing    │
                                                ├──────────────────────┤
                                                │  [🎤] [input] [→] │
                                                └──────────────────────┘
```

## Key Features Mapping

| Feature             | Component       | Implementation                  |
| ------------------- | --------------- | ------------------------------- |
| Floating bubble     | ChatBubble      | Fixed position, bottom-right    |
| Expand/collapse     | ChatWindow      | State-based rendering           |
| Message history     | MessageList     | Array of messages, scrollable   |
| Text input          | TextInput       | Controlled input with Enter key |
| Voice input         | VoiceInput      | Web Speech API integration      |
| Voice toggle        | MessageInput    | Button to switch modes          |
| Typing indicator    | TypingIndicator | Animation component             |
| Quick actions       | QuickActions    | Pre-defined questions           |
| Context awareness   | ChefAI          | Props from GroceryApp           |
| Streaming responses | ChefAI          | OpenAI streaming API            |
| Keyboard shortcuts  | ChefAI          | useEffect with keydown listener |
| Mobile responsive   | All components  | Tailwind responsive classes     |
| Accessibility       | All components  | ARIA labels, focus management   |

## API Interaction

```mermaid
sequenceDiagram
    participant C as ChefAI Component
    participant O as OpenAI API
    participant U as User

    C->>O: POST /chat/completions
    Note over C,O: {
      model: "gpt-4o-mini",
      messages: [
        {role: "system", content: "You are ChefAI..."},
        {role: "user", content: "How do I cook rice?"}
      ],
      stream: true
    }

    O-->>C: chunk 1: "To cook"
    C->>U: Display "To cook"
    O-->>C: chunk 2: " rice perfectly,"
    C->>U: Append " rice perfectly,"
    O-->>C: chunk 3: " follow these..."
    C->>U: Append " follow these..."
    O-->>C: [DONE]
    C->>U: Complete message
```

## Error Handling Flow

```mermaid
graph TD
    A[Send Message] --> B{API Call}
    B -->|Success| C[Stream Response]
    B -->|Error| D{Error Type?}
    D -->|Network| E[Show Network Error]
    D -->|API Key| F[Show API Error]
    D -->|Rate Limit| G[Show Rate Limit Error]
    D -->|Timeout| H[Show Timeout Error]
    E --> I[Retry Button]
    F --> I
    G --> I
    H --> I
    I --> B
```

## Performance Optimization

```mermaid
graph LR
    A[Message History] --> B{Limit to 20?}
    B -->|Yes| C[Keep last 20]
    B -->|No| D[Trim to 20]
    C --> E[Send to API]
    D --> E

    F[Voice Input] --> G{Debounce?}
    G -->|500ms passed| H[Process transcript]
    G -->|Waiting| I[Continue listening]
    H --> J[Auto-send]

    K[Streaming Response] --> L{Use streaming?}
    L -->|Yes| M[Display chunks]
    L -->|No| N[Wait for full response]
    M --> O[Perceived fast response]
    N --> O
```

## Mobile vs Desktop

```mermaid
graph TD
    A[ChefAI] --> B{Viewport Width?}
    B -->|< 768px| C[Mobile Mode]
    B -->|>= 768px| D[Desktop Mode]

    C --> E[Full width chat]
    C --> F[60vh height]
    C --> G[Larger touch targets]
    C --> H[Virtual keyboard aware]

    D --> I[380px width]
    D --> J[500px height]
    D --> K[Standard touch targets]
    D --> L[Fixed positioning]
```
