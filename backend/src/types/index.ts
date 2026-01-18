import { Request } from 'express'
import { PrismaClient } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      prisma: PrismaClient
      user?: {
        id: string
        email: string
        name?: string
      }
    }
  }
}

export {}
