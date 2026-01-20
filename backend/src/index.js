import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { PrismaClient } from '@prisma/client'
import listsRouter from './routes/lists'
import recipesRouter from './routes/recipes'
import authRouter from './routes/auth'
import pantryRouter from './routes/pantry'

const app = express()
const prisma = new PrismaClient()

const corsOptions = {
  origin: [
    'http://localhost:8080',
    'http://localhost:5173',
    'https://sous-chefy.vercel.app',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}

app.use(cors(corsOptions))
app.use(helmet())
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
app.use('/api/pantry', pantryRouter)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Export for Vercel (default export is important!)
export default app
export { app, prisma }