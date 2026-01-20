import { Router } from "express";
import { authenticate } from "../middleware/auth";

const router = Router();

// Get all pantry items for user
router.get("/", authenticate, async (req: any, res: any) => {
  try {
    const pantryItems = await req.prisma.pantry.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      take: 100,
    });
    res.json(pantryItems);
  } catch (error) {
    console.error("Error fetching pantry items:", error);
    res.status(500).json({ error: "Failed to fetch pantry items" });
  }
});

// Add pantry item
router.post("/", authenticate, async (req: any, res: any) => {
  try {
    const { name, quantity, unit, category, expiresAt } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const pantryItem = await req.prisma.pantry.create({
      data: {
        userId: req.user!.id,
        name: name.trim(),
        quantity: quantity || null,
        unit: unit || null,
        category: category || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    res.status(201).json(pantryItem);
  } catch (error) {
    console.error("Error creating pantry item:", error);
    res.status(500).json({ error: "Failed to create pantry item" });
  }
});

// Update pantry item
router.put("/:id", authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { name, quantity, unit, category, expiresAt } = req.body;

    // Verify ownership
    const existing = await req.prisma.pantry.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Pantry item not found" });
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const pantryItem = await req.prisma.pantry.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        quantity: quantity !== undefined ? quantity : existing.quantity,
        unit: unit !== undefined ? unit : existing.unit,
        category: category !== undefined ? category : existing.category,
        expiresAt:
          expiresAt !== undefined
            ? expiresAt
              ? new Date(expiresAt)
              : null
            : existing.expiresAt,
      },
    });

    res.json(pantryItem);
  } catch (error) {
    console.error("Error updating pantry item:", error);
    res.status(500).json({ error: "Failed to update pantry item" });
  }
});

// Delete pantry item
router.delete("/:id", authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await req.prisma.pantry.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: "Pantry item not found" });
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await req.prisma.pantry.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting pantry item:", error);
    res.status(500).json({ error: "Failed to delete pantry item" });
  }
});

// Clear all pantry items
router.delete("/", authenticate, async (req: any, res: any) => {
  try {
    await req.prisma.pantry.deleteMany({
      where: { userId: req.user!.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error clearing pantry:", error);
    res.status(500).json({ error: "Failed to clear pantry" });
  }
});

export default router;
