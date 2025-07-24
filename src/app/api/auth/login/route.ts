import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'

type Role = 'MASTER' | 'AGENCY' | 'AGENCY_CLIENT'

interface UserWithRole {
  id: string
  password: string
  role: Role
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const user = await findUserByEmail(email)

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatches = await bcrypt.compare(password, user.password)

    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    const response = NextResponse.json({ success: true, role: user.role })
    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return response
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function findUserByEmail(email: string): Promise<UserWithRole | null> {
  const master = await prisma.master.findUnique({ where: { email } })
  if (master) return { id: master.id, password: master.password, role: 'MASTER' }

  const agency = await prisma.agency.findUnique({ where: { email } })
  if (agency) return { id: agency.id, password: agency.password, role: 'AGENCY' }

  const client = await prisma.agencyClient.findUnique({ where: { businessEmail: email } })
  if (client) return { id: client.id, password: client.password, role: 'AGENCY_CLIENT' }

  return null
}
