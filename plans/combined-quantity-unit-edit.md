# Combined Quantity and Unit Field for Item Editing

## Overview

Convert the item editing interface in both Shopping List and Pantry to use a single free text field for quantity and unit, instead of separate quantity (number) and unit (dropdown) fields.

## Current State

### ShoppingList.tsx (Edit Mode)

- **Three separate fields:**
  1. `editQuantity` - Number input for quantity
  2. `editUnit` - Select dropdown with UNIT_OPTIONS (20+ predefined units)
  3. `editValue` - Text input for item name
- **Lines 124-187:** Edit mode UI with Select component
- **Lines 71-74:** Props include `editUnit`, `onEditUnitChange`

### PantryTab.tsx (Edit Mode)

- **Three separate fields:**
  1. `editQuantity` - Number input for quantity
  2. `editUnit` - Select dropdown with UNIT_OPTIONS (20+ predefined units)
  3. `editValue` - Text input for item name
- **Lines 447-510:** Edit mode UI with Select component
- **Lines 65-66:** State includes `editQuantity`, `editUnit`

### GroceryApp.tsx (Edit Handler)

- **Lines 558-640:** `handleEditItem` function
- **Lines 596-622:** Already has parsing logic for quantity/unit from free text
- Supports patterns like:
  - `2 kg` → quantity: 2, unit: "kg"
  - `500g` → quantity: 500, unit: "g"
  - `one dozen` → quantity: 12, unit: undefined

## Proposed Changes

### 1. ShoppingList.tsx

**Remove:**

- `editUnit` prop from interface
- `onEditUnitChange` prop from interface
- Select component for unit selection (lines 143-157)

**Modify:**

- Combine quantity and unit into single text input field
- Update edit mode UI to show only TWO fields:
  1. Combined quantity/unit field (free text)
  2. Item name field

**New Edit Mode Layout:**

```
[Qty & Unit (e.g., 2 kg, 500g)] [Item Name...] [✓] [✗]
```

**Implementation Details:**

- Replace number input and Select with single text input
- Placeholder: "Qty & unit (e.g., 2 kg, 500g)"
- Value: Combined string of quantity and unit
- Width: ~180px (w-44 or w-48)
- Parse existing quantity and unit for initial value

### 2. PantryTab.tsx

**Remove:**

- `editUnit` state variable (line 66)
- Select component for unit selection (lines 466-480)
- UNIT_OPTIONS array (lines 19-40) - if not used elsewhere

**Modify:**

- Combine quantity and unit into single text input field
- Update edit mode UI to show only TWO fields:
  1. Combined quantity/unit field (free text)
  2. Item name field

**New Edit Mode Layout:**

```
[Qty & Unit (e.g., 2 kg, 500g)] [Item Name...] [✓] [✗]
```

**Implementation Details:**

- Replace number input and Select with single text input
- Placeholder: "Qty & unit (e.g., 2 kg, 500g)"
- Value: Combined string of quantity and unit
- Width: ~180px (w-44 or w-48)
- Parse existing quantity and unit for initial value

### 3. GroceryApp.tsx

**Modify:**

- Update `handleEditItem` function to accept combined quantity/unit string
- Remove unit parameter from function signature
- Use existing parsing logic (lines 596-622) to extract quantity and unit

**Current Function Signature:**

```typescript
const handleEditItem = useCallback((id: string, newName: string, newQuantity?: string, newUnit?: string) => {
```

**New Function Signature:**

```typescript
const handleEditItem = useCallback((id: string, newName: string, newQuantityUnit?: string) => {
```

**Parsing Logic:**

- Already exists in lines 596-622
- Extracts numeric quantity and optional unit from string
- Handles patterns:
  - `^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$` - "2 kg", "500g"
  - `/^(one|two|three|...)$/i` - word numbers

### 4. Display Logic Updates

**ShoppingList.tsx Display:**

- Lines 209-213: Display combined quantity and unit
- Already shows: `{item.quantity}{item.unit ? ` ${item.unit}` : ''}`
- No changes needed

**PantryTab.tsx Display:**

- Lines 517-521: Display combined quantity and unit
- Already shows: `{item.quantity}{item.unit ? ` ${item.unit}` : ''}`
- No changes needed

## Data Flow

### Editing an Item

1. **User clicks Edit button**
   - `handleEditItem` called with current item data
   - Set `editingItemId`, `editValue`, and combined `editQuantity`

2. **Initial Value Construction**
   - Combine existing quantity and unit into single string
   - Example: `quantity: 2, unit: "kg"` → `"2 kg"`
   - Example: `quantity: 500, unit: "g"` → `"500g"`

3. **User modifies quantity/unit field**
   - Free text input allows any format
   - Examples: "2 kg", "500g", "1 dozen", "3 lbs"

4. **User saves changes**
   - `handleEditItem` called with combined quantity/unit string
   - Parse string to extract numeric quantity and optional unit
   - Update item with parsed values

### Parsing Logic

**Pattern 1: Numeric with optional unit**

```javascript
/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)$/;
```

- Matches: "2 kg", "500g", "1.5 lbs"
- Captures: quantity (number), unit (string, optional)

**Pattern 2: Word numbers**

```javascript
/^(one|two|three|four|five|six|seven|eight|nine|ten)$/i;
```

- Matches: "one", "two", "three", etc.
- Converts to numeric: 1, 2, 3, etc.

## Benefits

1. **Simpler UI:** Two fields instead of three
2. **More Flexible:** Users can type any quantity/unit format
3. **Faster:** No need to select from dropdown
4. **Consistent:** Same pattern as adding items (already uses combined field)
5. **Less Code:** Remove Select component and unit options

## Implementation Steps

### Step 1: Update ShoppingList.tsx

- Remove `editUnit` and `onEditUnitChange` from props interface
- Replace edit mode quantity/unit inputs with single text input
- Update initial value construction to combine quantity and unit
- Update save handler to pass combined string

### Step 2: Update PantryTab.tsx

- Remove `editUnit` state variable
- Remove UNIT_OPTIONS array (if not used elsewhere)
- Replace edit mode quantity/unit inputs with single text input
- Update initial value construction to combine quantity and unit
- Update save handler to pass combined string

### Step 3: Update GroceryApp.tsx

- Modify `handleEditItem` function signature
- Remove unit parameter
- Use existing parsing logic for combined quantity/unit string
- Update calls to `handleEditItem` throughout component

### Step 4: Update ShoppingList component calls

- Update all `onEditItem` calls to pass combined quantity/unit string
- Remove unit parameter from calls

### Step 5: Test

- Test editing items with various quantity/unit formats
- Test parsing of different patterns
- Test display of edited items
- Test edge cases (empty quantity, only unit, etc.)

## Edge Cases

1. **Empty quantity/unit field:**
   - Parse returns undefined for both quantity and unit
   - Item saved with no quantity/unit

2. **Only quantity (no unit):**
   - Parse returns quantity number, undefined unit
   - Item saved with quantity only

3. **Only unit (no quantity):**
   - Pattern doesn't match
   - Parse returns undefined for both
   - Item saved with no quantity/unit

4. **Invalid format:**
   - Pattern doesn't match
   - Parse returns undefined for both
   - Item saved with no quantity/unit

## Backward Compatibility

- Database schema unchanged (quantity and unit remain separate fields)
- Display logic unchanged
- Only edit interface changes
- Parsing logic already exists and tested

## Files to Modify

1. `src/components/ShoppingList.tsx`
   - Props interface
   - Edit mode UI
   - Edit handlers

2. `src/components/PantryTab.tsx`
   - State variables
   - Edit mode UI
   - Edit handlers
   - Remove UNIT_OPTIONS (if not used elsewhere)

3. `src/components/GroceryApp.tsx`
   - `handleEditItem` function signature
   - `handleEditItem` implementation
   - All calls to `handleEditItem`

## Testing Checklist

- [ ] Edit item with quantity and unit (e.g., "2 kg")
- [ ] Edit item with quantity only (e.g., "3")
- [ ] Edit item with unit only (e.g., "kg")
- [ ] Edit item with combined format (e.g., "500g")
- [ ] Edit item with word number (e.g., "one dozen")
- [ ] Edit item to remove quantity/unit (empty field)
- [ ] Verify display shows combined quantity and unit correctly
- [ ] Verify parsing extracts correct values
- [ ] Verify database stores quantity and unit separately
- [ ] Test in Shopping List (Make a List tab)
- [ ] Test in Shopping List (Shopping mode)
- [ ] Test in Pantry tab
