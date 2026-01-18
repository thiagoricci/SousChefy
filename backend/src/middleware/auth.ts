import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface JwtPayload {
  id: string
  email: string
  name?: string
}

export function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    }
    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
