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

    // ✅ Mark device ACTIVE
    await prisma.device.update({
      where: { id: device.id },
      data: { status: 'ACTIVE' },
    })

    const now = new Date()

    // ✅ Use full DateTime for filtering, NOT just hour string
    const assignment = await prisma.clientDeviceAdAssignment.findFirst({
      where: {
        deviceId: device.id,
        startTime: { lte: now },
        endTime: { gt: now },
      },
      include: {
        ad: true,
      },
    })

    if (assignment && assignment.ad?.fileUrl) {
      return NextResponse.json({
        message: 'Device activated successfully and video found',
        videoUrl: assignment.ad.fileUrl,
        title: assignment.ad.title,
      })
    }

    // No valid ad playing at this moment
    return NextResponse.json({
      message: 'Device activated successfully but no ad assigned for current time.',
    })

  } catch (error) {
    console.error('ACTIVATE_DEVICE_ERROR', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
