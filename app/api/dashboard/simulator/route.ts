import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateAIResponse } from '@/lib/openai'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { platform, senderId, message } = await req.json()
    if (!platform || !senderId || !message) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // 1. Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { externalId_platform: { externalId: senderId, platform } }
    })
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          externalId: senderId,
          platform,
          status: 'ACTIVE'
        }
      })
    }

    // 2. Save incoming user message in DB
    const savedUserMsg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        content: message,
        messageId: `sim_in_${Date.now()}`,
        status: 'READ',
      }
    })

    // Log the simulation trigger
    await prisma.log.create({
      data: {
        type: 'WEBHOOK',
        message: `Simulated incoming ${platform} message from ${senderId}`,
        details: JSON.stringify({ platform, senderId, message })
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    })

    // 3. Process with AI Response Engine
    const aiResponseText = await generateAIResponse(conversation.id, message)
    let outboundMsgId = `sim_out_${Date.now()}`
    let deliveryStatus = 'SENT'

    let savedAiMsg = null
    if (aiResponseText && aiResponseText.trim() !== "") {
      // Save outgoing AI message in DB
      savedAiMsg = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: 'AI',
          content: aiResponseText,
          messageId: outboundMsgId,
          status: deliveryStatus
        }
      })
      
      // Update conversation timestamp
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() }
      })
    }

    return NextResponse.json({
      success: true,
      userMessage: savedUserMsg,
      aiResponse: savedAiMsg
    })

  } catch (err: any) {
    console.error('Simulator error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
