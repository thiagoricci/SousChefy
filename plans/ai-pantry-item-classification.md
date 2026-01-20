# AI-Based Pantry Item Classification

## Overview

Enhance the PantryTab component to automatically classify pantry items into categories using AI, removing the need for manual category selection by the user.

## Current State

### Manual Category Selection

- Users must manually select a category from a list of 10 options
- Categories are displayed as clickable buttons in the UI
- Located in [`PantryTab.tsx`](src/components/PantryTab.tsx:295-311)
- State managed with `itemCategory` variable (line 46)
- Category passed to API when creating item (line 97)

### Available Categories

From [`src/types/pantry.ts`](src/types/pantry.ts:30-43):

- produce
- dairy
- protein
- grains
- canned
- frozen
- spices (not shown in current UI)
- oils (not shown in current UI)
- condiments
- beverages
- snacks
- baking (not shown in current UI)
- other

## Proposed Solution

### Architecture

```
User enters item name
    ↓
User clicks "Add Item"
    ↓
PantryTab calls classifyPantryItem() function
    ↓
OpenAI API classifies item into category
    ↓
Category returned from AI
    ↓
Item created with AI-determined category
    ↓
Item added to pantry list
```

### Implementation Plan

#### 1. Create AI Classification Function in [`src/lib/openai.ts`](src/lib/openai.ts)

Add a new function to classify pantry items:

```typescript
export async function classifyPantryItem(
  itemName: string,
): Promise<PantryCategory> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a pantry item classifier. Classify grocery items into one of these categories:

Categories:
- produce: Fresh fruits and vegetables (apples, carrots, lettuce, tomatoes)
- dairy: Milk, cheese, yogurt, eggs, butter
- protein: Meat, fish, poultry, tofu, beans
- grains: Rice, pasta, bread, oats, flour
- canned: Canned goods (soup, beans, vegetables)
- frozen: Frozen foods (vegetables, meals, fruits)
- spices: Herbs, spices, seasonings, salt, pepper
- oils: Cooking oils, vinegar, dressings
- condiments: Ketchup, mustard, mayo, sauces
- beverages: Water, juice, soda, coffee, tea
- snacks: Chips, crackers, cookies, nuts
- baking: Sugar, baking powder, yeast, chocolate chips
- other: Items that don't fit other categories

CRITICAL: You MUST return ONLY the category name as a plain string. No explanations, no additional text, no JSON formatting.

Example responses:
"produce"
"dairy"
"protein"
"grains"
"canned"
"frozen"
"spices"
"oils"
"condiments"
"beverages"
"snacks"
"baking"
"other"`,
        },
        {
          role: "user",
          content: `Classify this pantry item: ${itemName}`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent classification
      max_tokens: 10, // Only need category name
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const category = data.choices?.[0]?.message?.content?.trim();

  // Validate category
  const validCategories: PantryCategory[] = [
    "produce",
    "dairy",
    "protein",
    "grains",
    "canned",
    "frozen",
    "spices",
    "oils",
    "condiments",
    "beverages",
    "snacks",
    "baking",
    "other",
  ];

  if (!category || !validCategories.includes(category as PantryCategory)) {
    console.warn(
      `Invalid category "${category}" returned by AI, defaulting to "other"`,
    );
    return "other";
  }

  return category as PantryCategory;
}
```

#### 2. Update [`src/components/PantryTab.tsx`](src/components/PantryTab.tsx)

**Remove category selection UI:**

- Remove `itemCategory` state (line 46)
- Remove `CATEGORIES` constant (lines 21-32)
- Remove category button selection UI (lines 295-311)
- Remove `itemCategory` parameter from `pantryApi.create()` call (line 97)

**Add AI classification to item creation:**

- Import `classifyPantryItem` from `@/lib/openai`
- Update `handleAddItem` function to classify item before creating it
- Show loading state while AI is classifying
- Handle classification errors gracefully (fallback to 'other')

Updated `handleAddItem` function:

```typescript
const handleAddItem = useCallback(async () => {
  const trimmedName = itemName.trim();
  if (!trimmedName) {
    toast({
      title: "Error",
      description: "Please enter an item name.",
      variant: "destructive",
    });
    return;
  }

  // Check for duplicate
  const isDuplicate = pantryItems.some(
    (item) => item.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (isDuplicate) {
    toast({
      title: "Error",
      description: "This item is already in your pantry.",
      variant: "destructive",
    });
    return;
  }

  try {
    // Classify item using AI
    const category = await classifyPantryItem(trimmedName);

    const newItem = await pantryApi.create({
      name: trimmedName,
      quantity: itemQuantity ? parseFloat(itemQuantity) : undefined,
      unit: itemUnit || undefined,
      category: category, // AI-determined category
    });

    setPantryItems((prev) => [...prev, newItem]);

    // Clear form
    setItemName("");
    setItemQuantity("");
    setItemUnit("");

    toast({
      title: "Item Added",
      description: `${trimmedName} added to your pantry as ${category}.`,
    });
  } catch (error: any) {
    console.error("Failed to add pantry item:", error);
    toast({
      title: "Error",
      description:
        error.response?.data?.error ||
        error.message ||
        "Failed to add item to pantry.",
      variant: "destructive",
    });
  }
}, [itemName, itemQuantity, itemUnit, pantryItems, toast]);
```

#### 3. Update Form UI

Simplify the add item form by removing category selection:

```tsx
{
  /* Add Item Form */
}
<Card className="shadow-card rounded-xl md:rounded-2xl border-0 bg-white/80 backdrop-blur-sm">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg flex items-center gap-2">
      <Plus className="w-5 h-5" />
      Add to Pantry
    </CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <Input
      type="text"
      placeholder="Item name (e.g., apples, milk, chicken)..."
      value={itemName}
      onChange={(e) => setItemName(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          handleAddItem();
        }
      }}
      className="h-10 md:h-12 text-sm"
    />
    <div className="flex gap-2">
      <Input
        type="text"
        placeholder="Qty"
        value={itemQuantity}
        onChange={(e) => setItemQuantity(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddItem();
          }
        }}
        className="h-10 md:h-12 text-sm w-24"
      />
      <Input
        type="text"
        placeholder="Unit"
        value={itemUnit}
        onChange={(e) => setItemUnit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAddItem();
          }
        }}
        className="h-10 md:h-12 text-sm w-24"
      />
    </div>

    <Button
      onClick={handleAddItem}
      disabled={!itemName.trim()}
      className="w-full"
    >
      <Plus className="w-4 h-4 mr-2" />
      Add Item
    </Button>
  </CardContent>
</Card>;
```

## Benefits

### User Experience Improvements

1. **Faster Item Entry**: No need to manually select category
2. **More Accurate Classification**: AI can handle edge cases better than manual selection
3. **Consistent Categories**: All items will be properly categorized
4. **Simpler UI**: Cleaner interface with fewer clicks
5. **Support for All Categories**: AI can use all 13 categories (including spices, oils, baking)

### Technical Benefits

1. **Reduced Code Complexity**: Removes category selection state and UI
2. **Scalable**: Easy to add new categories without UI changes
3. **Consistent with Existing Patterns**: Uses same OpenAI integration pattern as recipe generation
4. **Low Temperature Setting**: 0.3 temperature ensures consistent classifications
5. **Graceful Fallback**: Defaults to 'other' if classification fails

## Testing Plan

### Test Cases

1. **Common Items**: Test items that should be easy to classify
   - apples → produce
   - milk → dairy
   - chicken → protein
   - rice → grains
   - soup → canned

2. **Edge Cases**: Test items that might be ambiguous
   - eggs → dairy
   - tofu → protein
   - bread → grains
   - butter → dairy
   - ice cream → frozen

3. **Less Common Items**: Test items in categories not shown in current UI
   - basil → spices
   - olive oil → oils
   - ketchup → condiments
   - flour → baking

4. **Invalid/Unknown Items**: Test fallback behavior
   - Random words → other
   - Misspellings → other (or best guess)

5. **Error Handling**: Test API failure scenarios
   - Missing API key → Show error toast
   - Network error → Show error toast
   - Invalid response → Fallback to 'other'

## Implementation Checklist

- [ ] Add `classifyPantryItem()` function to [`src/lib/openai.ts`](src/lib/openai.ts)
- [ ] Import `classifyPantryItem` in [`PantryTab.tsx`](src/components/PantryTab.tsx)
- [ ] Remove `itemCategory` state from [`PantryTab.tsx`](src/components/PantryTab.tsx:46)
- [ ] Remove `CATEGORIES` constant from [`PantryTab.tsx`](src/components/PantryTab.tsx:21-32)
- [ ] Remove category button UI from [`PantryTab.tsx`](src/components/PantryTab.tsx:295-311)
- [ ] Update `handleAddItem()` to call AI classification
- [ ] Add loading state during AI classification
- [ ] Add error handling for classification failures
- [ ] Update toast messages to include category
- [ ] Test with various pantry items
- [ ] Verify fallback to 'other' works correctly

## Files to Modify

1. [`src/lib/openai.ts`](src/lib/openai.ts) - Add classification function
2. [`src/components/PantryTab.tsx`](src/components/PantryTab.tsx) - Remove category UI, add AI classification

## Related Files

- [`src/types/pantry.ts`](src/types/pantry.ts) - PantryCategory type definition
- [`src/lib/pantry-api.ts`](src/lib/pantry-api.ts) - Pantry API client
- [`backend/src/routes/pantry.ts`](backend/src/routes/pantry.ts) - Pantry API routes (no changes needed)
