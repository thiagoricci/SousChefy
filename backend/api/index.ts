import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'
import listsRouter from '../src/routes/lists'
import recipesRouter from '../src/routes/recipes'
import authRouter from '../src/routes/auth'

// Singleton pattern for Prisma client in serverless environment
const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Graceful shutdown for Prisma in serverless environment
if (process.env.NODE_ENV === 'production') {
  // Ensure Prisma disconnects when the function instance is recycled
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

const app = express()

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

app.use(helmet())

// Explicitly handle OPTIONS requests
app.options(/.*/, cors({
  origin: [
    'http://localhost:8080',
    'https://sous-chefy.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}))

app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://sous-chefy.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Make prisma available to routes
app.use((req: any, res: any, next: any) => {
  req.prisma = prisma
  next()
})

// Request logging
app.use((req: any, res: any, next: any) => {
  console.log(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body ? 'present' : 'absent'
  })
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

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({ error: 'Not found' })
})

export default app
