# ChefAI Behavior Flowchart

## Request Type Detection & Routing

```mermaid
flowchart TD
    A[User Message] --> B{Analyze Request Type}

    B -->|List-Related| C[add_items_to_list<br/>delete_items_from_list]
    B -->|Recipe Ideas| D[show_recipes_in_tab<br/>mode: options]
    B -->|Specific Recipe| E[save_recipe +<br/>show_recipe_in_cooking_tab]
    B -->|History/Saved| F[switch_to_history_tab]
    B -->|General Question| G[One-sentence answer]

    C --> H[Switch to Home Tab]
    D --> I[Switch to Search Tab<br/>Show 5 Recipe Options]
    E --> J[Save to Database<br/>Switch to Cooking Tab<br/>Show Full Recipe]
    F --> K[Switch to Favorites Tab]

    H --> L[Toast Notification]
    I --> L
    J --> L
    K --> L

    G --> M[One-Sentence Response in Chat]
    L --> N[One-Sentence Response in Chat]
```

## Tab Routing Matrix

| Request Type           | Function Called                              | Target Tab | Chat Response                      | Content Location |
| ---------------------- | -------------------------------------------- | ---------- | ---------------------------------- | ---------------- |
| Add items to list      | `add_items_to_list`                          | Home       | "Added to your list."              | Home tab items   |
| Remove items from list | `delete_items_from_list`                     | Home       | "Removed from list."               | Home tab items   |
| Create shopping list   | `add_items_to_list`                          | Home       | "List created."                    | Home tab items   |
| Recipe ideas           | `show_recipes_in_tab` (options)              | Search     | "Check Recipe tab."                | Recipe tab cards |
| Specific recipe        | `save_recipe` + `show_recipe_in_cooking_tab` | Cooking    | "Recipe saved. Check Cooking tab." | Cooking mode     |
| Show history           | `switch_to_history_tab`                      | Favorites  | "Check History tab."               | History tab      |
| Show saved recipes     | `switch_to_history_tab`                      | Favorites  | "Check History tab."               | History tab      |
| Cooking question       | None                                         | None       | One-sentence answer                | Chat only        |

## Component Interaction Diagram

```mermaid
sequenceDiagram
    participant User
    participant ChatPanel
    participant OpenAI
    participant GroceryApp
    participant Tabs
    participant Toast

    User->>ChatPanel: "Add milk and eggs"
    ChatPanel->>OpenAI: askChefAI(message, context)
    OpenAI->>OpenAI: Detect list request
    OpenAI->>ChatPanel: Function: add_items_to_list
    ChatPanel->>GroceryApp: onCreateList(items)
    GroceryApp->>GroceryApp: Update items state
    GroceryApp->>Tabs: setActiveView('home')
    Tabs->>User: Show Home tab
    ChatPanel->>Toast: "2 items added"
    Toast->>User: Display notification
    OpenAI->>ChatPanel: Stream: "Added to your list."
    ChatPanel->>User: Display one-sentence response
```

## System Prompt Structure

```mermaid
graph LR
    A[System Prompt] --> B[CRITICAL RULES]
    A --> C[REQUEST ROUTING]
    A --> D[FUNCTION USAGE]
    A --> E[CONTEXT AWARENESS]

    B --> B1[One sentence max]
    B --> B2[Use functions not chat]
    B --> B3[No details in chat]

    C --> C1[List → Home tab]
    C --> C2[Recipe ideas → Search tab]
    C --> C3[Cooking → Cooking tab]
    C --> C4[History → Favorites tab]

    D --> D1[add_items_to_list]
    D --> D2[delete_items_from_list]
    D --> D3[save_recipe]
    D --> D4[show_recipes_in_tab]
    D --> D5[show_recipe_in_cooking_tab]
    D --> D6[switch_to_history_tab]

    E --> E1[Shopping list items]
    E --> E2[Saved recipes]
    E --> E3[Shopping history]
    E --> E4[Current view]
```

## Response Length Examples

### ❌ OLD BEHAVIOR (Multi-paragraph)

```
I've added 3 items to your shopping list: milk, eggs, and bread.
These items have been successfully added to your active shopping list.
You can view them in the Make a List tab.
Let me know if you need anything else!
```

### ✅ NEW BEHAVIOR (One sentence)

```
Added to your list.
```

### ❌ OLD BEHAVIOR (Detailed recipe)

```
Here's a lasagna recipe:

Ingredients:
- 1 lb ground beef
- 1 onion, chopped
- 2 cloves garlic, minced
- 24 oz marinara sauce
- 15 oz ricotta cheese
- 2 cups mozzarella cheese
- 1/2 cup parmesan cheese
- 12 lasagna noodles

Instructions:
1. Preheat oven to 375°F
2. Cook lasagna noodles according to package
3. Brown ground beef with onion and garlic
4. Layer noodles, meat sauce, and cheese mixture
5. Bake for 45 minutes
6. Let rest for 10 minutes before serving

I've saved this recipe to your collection!
```

### ✅ NEW BEHAVIOR (One sentence + tab)

```
Recipe saved. Check Cooking tab.
```

## Function Call Flow

### List Operations

```mermaid
flowchart LR
    A[User: Add items] --> B[OpenAI detects list request]
    B --> C[Call add_items_to_list]
    C --> D[ChatPanel executes function]
    D --> E[API: listsApi.addItemsToList]
    E --> F[Update items state]
    F --> G[Switch to Home tab]
    G --> H[Show toast notification]
    H --> I[One-sentence response]
```

### Recipe Operations

```mermaid
flowchart LR
    A[User: Recipe ideas] --> B[OpenAI detects recipe request]
    B --> C[Generate 5 options]
    C --> D[Call show_recipes_in_tab]
    D --> E[ChatPanel executes function]
    E --> F[Set externalRecipes state]
    F --> G[Switch to Search tab]
    G --> H[Show toast notification]
    H --> I[One-sentence response]
```

### Cooking Operations

```mermaid
flowchart LR
    A[User: Specific recipe] --> B[OpenAI detects cooking request]
    B --> C[Generate full recipe]
    C --> D[Call save_recipe]
    D --> E[Call show_recipe_in_cooking_tab]
    E --> F[ChatPanel executes functions]
    F --> G[API: recipesApi.create]
    G --> H[Set selectedCookingRecipe]
    H --> I[Switch to Cooking tab]
    I --> J[Show toast notification]
    J --> K[One-sentence response]
```

## State Changes

### Home Tab (List)

```typescript
// Before
activeView: 'home'
items: [existing items]

// After ChefAI adds items
activeView: 'home' (stays)
items: [existing items, milk, eggs, bread]
toast: "3 items added"
chat: "Added to your list."
```

### Search Tab (Recipes)

```typescript
// Before
activeView: 'search'
externalRecipes: null

// After ChefAI shows options
activeView: 'search' (stays)
externalRecipes: [5 recipe options]
externalRecipeMode: 'options'
toast: "5 recipe suggestions found"
chat: "Check Recipe tab."
```

### Cooking Tab

```typescript
// Before
activeView: 'cooking'
selectedCookingRecipe: null

// After ChefAI saves recipe
activeView: 'cooking'
selectedCookingRecipe: {full recipe object}
savedRecipes: [existing, new recipe]
toast: "Recipe saved. Ready to cook."
chat: "Recipe saved. Check Cooking tab."
```

### Favorites Tab (History)

```typescript
// Before
activeView: "favorites";

// After ChefAI switches to history
activeView: "favorites";
toast: "Check your saved lists and recipes.";
chat: "Check History tab.";
```
