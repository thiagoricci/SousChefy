# ChefAI - Hide JSON from Chat Display

## Problem

ChefAI currently displays the entire AI response in the chat, including the JSON code block used for list creation. This looks technical and not user-friendly.

Example of current behavior:

````
Great! For a week's worth of lunch meals, here's a suggested shopping list...

```json
{
  "type": "create_list",
  "items": [...]
}
````

Your shopping list is ready!

````

## Solution

Modify ChefAI to hide the JSON code block from the chat display while still processing it correctly for list creation.

## Implementation Plan

### 1. Update System Prompt (src/lib/openai.ts)

Modify the `buildChefAISystemPrompt` function to instruct ChefAI to provide the JSON separately from the conversational text.

**Changes:**
- Update the LIST CREATION INSTRUCTIONS to tell ChefAI to provide the JSON at the end of the response
- Instruct ChefAI to keep the conversational text separate from the JSON
- The JSON should still be parseable but not part of the main conversational flow

**New prompt structure:**
```typescript
**LIST CREATION INSTRUCTIONS**:
When user asks to create a shopping list (e.g., "I need milk, eggs, and bread", "Create a list for pasta dinner", "Make a shopping list"):
1. Extract all grocery items from the request
2. Parse quantities and units if specified
3. Provide a friendly, conversational response explaining what you're adding
4. At the very end, include the JSON format in a code block:
\`\`\`json
{
  "type": "create_list",
  "items": [...],
  "clearExisting": false
}
\`\`\`
5. Set "clearExisting": true only if user explicitly says to "replace" or "start fresh"
````

### 2. Create Utility Function (src/lib/utils.ts or new file)

Create a utility function to strip JSON code blocks from displayed content while preserving them for processing.

**Function signature:**

```typescript
/**
 * Strip JSON code blocks from text for display purposes
 * Returns the text without JSON blocks, but preserves them for processing
 */
export function stripJsonBlocks(text: string): string;
```

**Implementation:**

- Use regex to find and remove `json...` code blocks
- Return the cleaned text for display
- The original text is still used for JSON parsing

### 3. Update ChatWindow Component (src/components/ChefAI/ChatWindow.tsx)

Modify the message display logic to use filtered content.

**Changes:**

- Import the `stripJsonBlocks` utility function
- When streaming messages, use the full response for processing
- When displaying messages, use the filtered content (without JSON blocks)

**Implementation approach:**

```typescript
// In MessageList or MessageItem component
// Add a prop to receive the filtered content
// Or filter the content before passing to MessageList
```

**Option A: Filter in ChatWindow before setting messages**

```typescript
const filteredAiResponse = stripJsonBlocks(aiResponse);

setMessages((prev) => {
  const lastMessage = prev[prev.length - 1];
  if (lastMessage && lastMessage.role === "assistant") {
    return [
      ...prev.slice(0, -1),
      { ...lastMessage, content: filteredAiResponse },
    ];
  }
  // ...
});
```

**Option B: Filter in MessageItem component**

```typescript
// MessageItem.tsx
import { stripJsonBlocks } from '@/lib/utils';

// In the component
<p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
  {message.role === 'assistant' ? stripJsonBlocks(message.content) : message.content}
</p>
```

**Decision:** Option B is better because:

- Keeps the original message content intact
- Only affects display, not data
- Simpler to implement
- Easier to debug

### 4. Test List Creation

Ensure that:

- JSON is still parsed correctly by `parseListCreation` function
- List creation still works as expected
- Toast notifications still appear
- Shopping list is updated correctly
- User sees only the conversational text, not the JSON

## Files to Modify

1. **src/lib/openai.ts**
   - Update `buildChefAISystemPrompt` function
   - Modify LIST CREATION INSTRUCTIONS section

2. **src/lib/utils.ts** (or create new file src/lib/chat-utils.ts)
   - Add `stripJsonBlocks` utility function

3. **src/components/ChefAI/MessageItem.tsx**
   - Import `stripJsonBlocks` function
   - Apply filtering to assistant messages

## Expected Behavior

After implementation:

- User sees only conversational text: "Great! I've added milk, eggs, and bread to your shopping list."
- JSON is processed in the background
- List is created successfully
- Toast notification appears
- No JSON code blocks visible in chat

## Edge Cases to Consider

1. **Multiple JSON blocks:** Should strip all JSON blocks, not just the first one
2. **Non-JSON code blocks:** Should only strip ```json blocks, not other code blocks
3. **Malformed JSON:** Should still strip the block even if JSON is invalid
4. **Empty messages:** Should handle empty or whitespace-only messages gracefully
5. **Streaming:** Should work correctly with streaming responses

## Testing Checklist

- [ ] JSON code blocks are hidden from chat display
- [ ] Conversational text is displayed correctly
- [ ] List creation still works
- [ ] Multiple items can be added
- [ ] Clear existing list functionality works
- [ ] Toast notifications appear
- [ ] No console errors
- [ ] Works with streaming responses
- [ ] Works with non-list-creation messages (no JSON to strip)
