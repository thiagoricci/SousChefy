# Text Input Feature Implementation Plan

## Overview

Add text input as an alternative to voice input for adding grocery items. Users can toggle between Voice and Text modes.

## Design Decisions

### UI Pattern

- **Toggle/Switch**: Users choose between Voice and Text modes (one visible at a time)
- **Default Mode**: Voice mode (maintains current behavior)
- **Toggle Location**: Above the Add Items button, clearly visible

### Text Input Behavior

- **Single-line input**: Users type items separated by commas, "and", "plus", etc.
- **Submit on Enter**: Press Enter or click "Add" button to submit
- **Reuse existing parsing**: Use the same `parseAndAddItems` function that processes voice transcripts
- **Clear after submit**: Input field clears after successful submission

## Implementation Steps

### 1. Add State Management to GroceryApp.tsx

**New State Variables:**

```typescript
const [inputMode, setInputMode] = useState<"voice" | "text">("voice");
const [textInput, setTextInput] = useState("");
```

**State Descriptions:**

- `inputMode`: Tracks whether user is in voice or text input mode
- `textInput`: Stores the current text input value

### 2. Create Text Input Handler

**New Function:**

```typescript
const handleTextInputSubmit = useCallback(() => {
  if (textInput.trim()) {
    parseAndAddItems(textInput.trim());
    setTextInput("");
  }
}, [textInput, parseAndAddItems]);
```

**Behavior:**

- Validates input is not empty
- Calls existing `parseAndAddItems` function
- Clears input field after submission
- Shows toast notifications via existing logic

### 3. Add Input Mode Toggle UI

**Location:** Above the "Add Items" button

**Component Structure:**

```tsx
<div className="flex justify-center gap-2 mb-4">
  <Button
    variant={inputMode === "voice" ? "default" : "outline"}
    onClick={() => setInputMode("voice")}
    className="flex-1"
  >
    <Mic className="w-4 h-4 mr-2" />
    Voice
  </Button>
  <Button
    variant={inputMode === "text" ? "default" : "outline"}
    onClick={() => setInputMode("text")}
    className="flex-1"
  >
    <Type className="w-4 h-4 mr-2" />
    Text
  </Button>
</div>
```

**Styling:**

- Two buttons side by side
- Active mode uses `default` variant (blue)
- Inactive mode uses `outline` variant
- Icons: Mic for Voice, Type (or Keyboard) for Text

### 4. Create Text Input UI Component

**Location:** Below the toggle, replaces voice button when in text mode

**Component Structure:**

```tsx
{
  inputMode === "text" && (
    <div className="flex gap-2 w-full max-w-md mx-auto">
      <Input
        type="text"
        placeholder="Type items (e.g., apples, bananas, milk)"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleTextInputSubmit();
          }
        }}
        className="flex-1"
      />
      <Button onClick={handleTextInputSubmit} disabled={!textInput.trim()}>
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
```

**Features:**

- Text input field with placeholder
- Submit button with Plus icon
- Submit on Enter key press
- Button disabled when input is empty
- Responsive width (max-w-md)

### 5. Conditional Rendering for Voice Button

**Current Voice Button:** Only show when `inputMode === 'voice'`

```tsx
{
  inputMode === "voice" && (
    <div className="flex justify-center">
      <Button
        onClick={
          mode === "adding" ? handleStopAddingItems : handleStartAddingItems
        }
        // ... existing props
      >
        {/* existing button content */}
      </Button>
    </div>
  );
}
```

### 6. Update Instructions

**Add new instruction step:**

```tsx
<div className="flex items-start gap-2 md:gap-3">
  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
    <span className="text-primary font-bold text-sm md:text-lg">1</span>
  </div>
  <div className="min-w-0 flex-1">
    <h3 className="font-semibold text-base md:text-lg">Choose Input Mode</h3>
    <p className="text-muted-foreground text-xs md:text-sm">
      Toggle between Voice or Text input
    </p>
  </div>
</div>
```

**Renumber existing steps:** Shift current steps 1-5 to 2-6

**Update step 2 (formerly step 1):**

```tsx
<h3 className="font-semibold text-base md:text-lg">Add Items with Voice</h3>
<p className="text-muted-foreground text-xs md:text-sm">Press "Add Items" and speak your grocery list naturally</p>
```

**Add new step 3 for text input:**

```tsx
<div className="flex items-start gap-2 md:gap-3">
  <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
    <span className="text-primary font-bold text-sm md:text-lg">3</span>
  </div>
  <div className="min-w-0 flex-1">
    <h3 className="font-semibold text-base md:text-lg">Add Items with Text</h3>
    <p className="text-muted-foreground text-xs md:text-sm">
      Type items separated by commas or "and" (e.g., "apples, bananas, milk")
    </p>
  </div>
</div>
```

### 7. Import Required Icons

**Add to existing imports:**

```typescript
import { Type, Keyboard } from "lucide-react";
```

**Use:** `Type` icon for text mode button

## Files to Modify

1. **src/components/GroceryApp.tsx**
   - Add state variables for input mode and text input
   - Add text input handler function
   - Add input mode toggle UI
   - Add text input UI component
   - Conditionally render voice button
   - Update instructions

## Testing Checklist

- [ ] Toggle switches between Voice and Text modes
- [ ] Voice mode works as before (no regression)
- [ ] Text input accepts user input
- [ ] Text input submits on Enter key
- [ ] Text input submits on button click
- [ ] Text input clears after submission
- [ ] Text input uses same parsing logic as voice
- [ ] Toast notifications show for text input
- [ ] Invalid items show error toast
- [ ] Multiple items separated by commas work
- [ ] Multiple items separated by "and" work
- [ ] Quantities work in text input (e.g., "2 apples")
- [ ] Compound items work in text input (e.g., "peanut butter")
- [ ] Instructions display correctly
- [ ] Mobile responsive design works

## Edge Cases to Handle

1. **Empty input:** Button disabled, no submission
2. **Whitespace-only input:** Trimmed before validation
3. **Special characters:** Existing parsing handles this
4. **Mode switching:** Clear text input when switching to voice mode
5. **Voice active when switching to text:** Stop voice recognition

## Performance Considerations

- No performance impact (reuses existing parsing logic)
- Minimal state additions (2 new state variables)
- No new dependencies required

## Accessibility

- Toggle buttons have clear labels
- Text input has placeholder and label
- Keyboard navigation works (Tab, Enter)
- Screen reader friendly (existing shadcn/ui components)

## Future Enhancements (Optional)

- Auto-suggest/autocomplete for grocery items
- Quick-add buttons for common items
- History of recently added items
- Bulk import from clipboard
