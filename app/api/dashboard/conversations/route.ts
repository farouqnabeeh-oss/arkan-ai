import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const convos = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    return NextResponse.json({ conversations: convos })
  } catch (err: any) {
    console.error('Fetch conversations error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { conversationId, status } = await req.json()
    if (!conversationId || !status) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const updatedConvo = await prisma.conversation.update({
      where: { id: conversationId },
      data: { status }
    })

    await prisma.log.create({
      data: {
        type: 'INFO',
        message: `Conversation ${conversationId} status updated to ${status}`,
        details: JSON.stringify({ conversationId, status })
      }
    })

    return NextResponse.json({ conversation: updatedConvo })
  } catch (err: any) {
    console.error('Update conversation error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
