"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get all recipes for user
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const recipes = await req.prisma.recipe.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(recipes);
    }
    catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});
// Get single recipe
router.get('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const recipe = await req.prisma.recipe.findUnique({
            where: { id }
        });
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        // Check ownership
        if (recipe.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        res.json(recipe);
    }
    catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ error: 'Failed to fetch recipe' });
    }
});
// Create new recipe
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const { name, ingredients, instructions, servings, prepTime, cookTime } = req.body;
        if (!name || !ingredients || !instructions) {
            return res.status(400).json({ error: 'Name, ingredients, and instructions are required' });
        }
        const recipe = await req.prisma.recipe.create({
            data: {
                userId: req.user.id,
                name,
                ingredients,
                instructions,
                servings,
                prepTime,
                cookTime
            }
        });
        res.status(201).json(recipe);
    }
    catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ error: 'Failed to create recipe' });
    }
});
// Update recipe
router.put('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ingredients, instructions, servings, prepTime, cookTime } = req.body;
        // Verify ownership
        const existing = await req.prisma.recipe.findUnique({
            where: { id }
        });
        if (!existing || existing.userId !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        const recipe = await req.prisma.recipe.update({
            where: { id },
            data: {
                name,
                ingredients,
                instructions,
                servings,
                prepTime,
                cookTime,
                updatedAt: new Date()
            }
        });
        res.json(recipe);
    }
    catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ error: 'Failed to update recipe' });
    }
});
// Delete recipe
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        // Verify ownership
        const existing = await req.prisma.recipe.findUnique({
            where: { id }
        });
        if (!existing) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        if (existing.userId !== req.user.id) {
            return res.status(403).json({
                error: 'Not authorized',
                details: 'You do not have permission to delete this recipe'
            });
        }
        await req.prisma.recipe.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
});
exports.default = router;
//# sourceMappingURL=recipes.js.map