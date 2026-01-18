import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'
import listsRouter from './routes/lists'
import recipesRouter from './routes/recipes'
import authRouter from './routes/auth'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}))
app.use(express.json())

// Make prisma available to routes
app.use((req: any, res: any, next: any) => {
  req.prisma = prisma
  next()
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/lists', listsRouter)
app.use('/api/recipes', recipesRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Grocerli server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

export { app, prisma }
