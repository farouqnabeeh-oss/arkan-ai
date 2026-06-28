import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const totalConvos = await prisma.conversation.count()
    const totalMessages = await prisma.message.count()
    
    const whatsappConvos = await prisma.conversation.count({ where: { platform: 'WHATSAPP' } })
    const instagramConvos = await prisma.conversation.count({ where: { platform: 'INSTAGRAM' } })

    const userMessages = await prisma.message.count({ where: { sender: 'USER' } })
    const aiMessages = await prisma.message.count({ where: { sender: 'AI' } })

    const settings = await prisma.settings.findFirst()
    const systemEnabled = settings ? settings.systemEnabled : true

    const recentLogs = await prisma.log.findMany({
      orderBy: { timestamp: 'desc' },
      take: 8
    })

    return NextResponse.json({
      stats: {
        totalConvos,
        totalMessages,
        whatsappConvos,
        instagramConvos,
        userMessages,
        aiMessages,
        systemEnabled
      },
      recentLogs
    })
  } catch (err: any) {
    console.error('Stats fetch error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
