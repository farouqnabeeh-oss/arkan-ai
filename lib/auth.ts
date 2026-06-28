import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'arkan-digital-super-secret-jwt-key-2026'

export interface UserSession {
  userId: string
  username: string
  role: string
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('arkan_session')?.value
    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as UserSession
    return decoded
  } catch (error) {
    return null
  }
}
