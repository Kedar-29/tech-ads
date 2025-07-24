import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json()

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid key' }, { status: 400 })
    }

    const device = await prisma.device.findFirst({
      where: {
        OR: [{ publicKey: key }, { secretKey: key }],
      },
    })

    if (!device) {
      return NextResponse.json({ error: 'Invalid device key' }, { status: 404 })
    }

    await prisma.device.update({
      where: { id: device.id },
      data: { status: 'INACTIVE' },
    })

    return NextResponse.json({ message: 'Device disconnected successfully' })
  } catch (error) {
    console.error('DEACTIVATE_DEVICE_ERROR', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
