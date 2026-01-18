import { Router } from 'express'
import { authenticate } from '../middleware/auth'

const router = Router()

// Get all lists for user
router.get('/', authenticate, async (req: any, res: any) => {
  try {
    const lists = await req.prisma.list.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.json(lists)
  } catch (error) {
    console.error('Error fetching lists:', error)
    res.status(500).json({ error: 'Failed to fetch lists' })
  }
})

// Get active list
router.get('/active', authenticate, async (req: any, res: any) => {
  try {
    const activeList = await req.prisma.list.findFirst({
      where: {
        userId: req.user!.id,
        isActive: true
      }
    })
    res.json(activeList)
  } catch (error) {
    console.error('Error fetching active list:', error)
    res.status(500).json({ error: 'Failed to fetch active list' })
  }
})

// Update active list
router.put('/active', authenticate, async (req: any, res: any) => {
  try {
    const { items } = req.body

    // Find the active list
    const activeList = await req.prisma.list.findFirst({
      where: {
        userId: req.user!.id,
        isActive: true
      }
    })

    if (!activeList) {
      // If no active list exists, create one
      const list = await req.prisma.list.create({
        data: {
          userId: req.user!.id,
          name: `Shopping List ${new Date().toLocaleDateString()}`,
          items,
          isActive: true
        }
      })
      res.json(list)
      return
    }

    // Update the active list
    const list = await req.prisma.list.update({
      where: { id: activeList.id },
      data: {
        items,
        updatedAt: new Date()
      }
    })

    res.json(list)
  } catch (error) {
    console.error('Error updating active list:', error)
    res.status(500).json({ error: 'Failed to update active list' })
  }
})

// Create new list
router.post('/', authenticate, async (req: any, res: any) => {
  try {
    const { name, items, isActive = false } = req.body

    if (!name || !items) {
      return res.status(400).json({ error: 'Name and items are required' })
    }

    // If setting as active, deactivate other active lists
    if (isActive) {
      await req.prisma.list.updateMany({
        where: { userId: req.user!.id, isActive: true },
        data: { isActive: false }
      })
    }

    const list = await req.prisma.list.create({
      data: {
        userId: req.user!.id,
        name,
        items,
        isActive
      }
    })

    res.status(201).json(list)
  } catch (error) {
    console.error('Error creating list:', error)
    res.status(500).json({ error: 'Failed to create list' })
  }
})

// Add items directly to active list (for ChefAI)
// IMPORTANT: This must be defined BEFORE /:id routes
router.post('/items', authenticate, async (req: any, res: any) => {
  try {
    const { listId, items, clearExisting } = req.body

    if (!listId || !items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'listId and items are required' })
    }

    // Verify ownership
    const list = await req.prisma.list.findUnique({
      where: { id: listId }
    })

    if (!list || list.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get existing items from the JSON field
    const existingItems = clearExisting ? [] : (list.items as any[] || [])

    // Create new items with unique IDs
    const newItems = items.map((item: any) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      quantity: item.quantity || null,
      unit: item.unit || null,
      completed: false
    }))

    // Merge items
    const updatedItems = [...existingItems, ...newItems]

    // Update the list with merged items
    const updatedList = await req.prisma.list.update({
      where: { id: listId },
      data: {
        items: updatedItems,
        updatedAt: new Date()
      }
    })

    res.json({ success: true, items: newItems, list: updatedList })
  } catch (error) {
    console.error('Error adding items to list:', error)
    res.status(500).json({ error: 'Failed to add items to list' })
  }
})

// Delete items from list by name (for ChefAI)
// IMPORTANT: This must be defined BEFORE /:id routes
router.delete('/items', authenticate, async (req: any, res: any) => {
  try {
    const { listId, itemNames } = req.body

    if (!listId || !itemNames || !Array.isArray(itemNames)) {
      return res.status(400).json({ error: 'listId and itemNames are required' })
    }

    // Verify ownership
    const list = await req.prisma.list.findUnique({
      where: { id: listId }
    })

    if (!list || list.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Get existing items from the JSON field
    const existingItems = (list.items as any[] || [])

    // Normalize item names for comparison (lowercase, trim)
    const normalizedNamesToDelete = itemNames.map((name: string) => name.toLowerCase().trim())

    // Filter out items that match the names to delete
    const remainingItems = existingItems.filter((item: any) => {
      const normalizedItemName = item.name.toLowerCase().trim()
      return !normalizedNamesToDelete.some((nameToDelete: string) => 
        normalizedItemName === nameToDelete
      )
    })

    const deletedCount = existingItems.length - remainingItems.length

    // Update the list with remaining items
    const updatedList = await req.prisma.list.update({
      where: { id: listId },
      data: {
        items: remainingItems,
        updatedAt: new Date()
      }
    })

    res.json({ success: true, deletedCount, list: updatedList })
  } catch (error) {
    console.error('Error deleting items from list:', error)
    res.status(500).json({ error: 'Failed to delete items from list' })
  }
})

// Update list
router.put('/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { name, items, isActive } = req.body

    // Verify ownership
    const existing = await req.prisma.list.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'List not found' })
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // If setting as active, deactivate others
    if (isActive) {
      await req.prisma.list.updateMany({
        where: { userId: req.user!.id, isActive: true },
        data: { isActive: false }
      })
    }

    const list = await req.prisma.list.update({
      where: { id },
      data: {
        name,
        items,
        isActive,
        updatedAt: new Date()
      }
    })

    res.json(list)
  } catch (error) {
    console.error('Error updating list:', error)
    res.status(500).json({ error: 'Failed to update list' })
  }
})

// Delete list
router.delete('/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params

    // Verify ownership
    const existing = await req.prisma.list.findUnique({
      where: { id }
    })

    if (!existing) {
      return res.status(404).json({ error: 'List not found' })
    }

    if (existing.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await req.prisma.list.delete({
      where: { id }
    })

    res.status(204).send()
  } catch (error) {
    console.error('Error deleting list:', error)
    res.status(500).json({ error: 'Failed to delete list' })
  }
})

// Share list with another user
router.post('/:id/share', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params
    const { sharedWithEmail, permission = 'view' } = req.body

    if (!sharedWithEmail) {
      return res.status(400).json({ error: 'sharedWithEmail is required' })
    }

    // Find user to share with
    const sharedWith = await req.prisma.user.findUnique({
      where: { email: sharedWithEmail }
    })

    if (!sharedWith) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (sharedWith.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot share with yourself' })
    }

    // Verify ownership
    const list = await req.prisma.list.findUnique({
      where: { id }
    })

    if (!list || list.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Check if already shared
    const existingShare = await req.prisma.sharedList.findUnique({
      where: {
        listId_sharedWithId: {
          listId: id,
          sharedWithId: sharedWith.id
        }
      }
    })

    if (existingShare) {
      return res.status(400).json({ error: 'List already shared with this user' })
    }

    const sharedList = await req.prisma.sharedList.create({
      data: {
        listId: id,
        sharedById: req.user!.id,
        sharedWithId: sharedWith.id,
        permission
      }
    })

    res.status(201).json(sharedList)
  } catch (error) {
    console.error('Error sharing list:', error)
    res.status(500).json({ error: 'Failed to share list' })
  }
})

export default router
