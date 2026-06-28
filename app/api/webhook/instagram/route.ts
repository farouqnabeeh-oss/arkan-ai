import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateAIResponse } from '@/lib/openai'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode && token) {
    if (mode === 'subscribe') {
      const config = await prisma.integrationConfig.findUnique({
        where: { platform: 'INSTAGRAM' }
      })
      const verifyToken = config?.instagramVerifyToken || 'default_verify_token'
      
      if (token === verifyToken) {
        console.log('INSTAGRAM WEBHOOK VERIFIED')
        return new Response(challenge, { status: 200 })
      }
    }
  }
  return new Response('Forbidden', { status: 403 })
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch (parseErr) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // Log raw webhook
  await prisma.log.create({
    data: {
      type: 'WEBHOOK',
      message: 'Received Instagram Webhook Payload',
      details: JSON.stringify(body)
    }
  })

  try {
    const entry = body.entry?.[0]
    const messaging = entry?.messaging?.[0]
    if (!messaging) {
      return NextResponse.json({ success: true, message: 'No messaging details' })
    }

    const senderId = messaging.sender?.id // PSID (page-scoped sender ID)
    const messageObj = messaging.message
    
    // Skip read receipts, delivery updates, and our own echoed messages (replies sent by page)
    if (!messageObj || !messageObj.text || messageObj.is_echo) {
      return NextResponse.json({ success: true, message: 'Ignored payload (echo/status)' })
    }

    const textBody = messageObj.text
    const messageId = messageObj.mid

    const config = await prisma.integrationConfig.findUnique({
      where: { platform: 'INSTAGRAM' }
    })

    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { externalId_platform: { externalId: senderId, platform: 'INSTAGRAM' } }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          externalId: senderId,
          platform: 'INSTAGRAM',
          status: 'ACTIVE'
        }
      })
    }

    // Skip if paused by admin
    if (conversation.status === 'PAUSED') {
      return NextResponse.json({ success: true, message: 'Conversation is paused by admin' })
    }

    // Save user message in DB
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        content: textBody,
        messageId,
        status: 'READ'
      }
    })

    // Process Response with AI Agent
    const aiResponseText = await generateAIResponse(conversation.id, textBody)

    if (aiResponseText && aiResponseText.trim() !== "") {
      const accessToken = config?.instagramToken
      let outboundMsgId: string | null = null
      let deliveryStatus = 'FAILED'

      if (accessToken && accessToken.trim() !== "") {
        try {
          const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              recipient: { id: senderId },
              message: { text: aiResponseText }
            })
          })

          const data = await response.json()
          if (response.ok && data.message_id) {
            outboundMsgId = data.message_id
            deliveryStatus = 'SENT'
          } else {
            console.error('Instagram API Send Error:', data)
            await prisma.log.create({
              data: {
                type: 'ERROR',
                message: 'Instagram Graph API send failed',
                details: JSON.stringify(data)
              }
            })
          }
        } catch (fetchErr: any) {
          console.error('Instagram Fetch Connection Error:', fetchErr)
          await prisma.log.create({
            data: {
              type: 'ERROR',
              message: 'Instagram Graph API connection failed',
              details: JSON.stringify(fetchErr)
            }
          })
        }
      } else {
        // Fallback mock dispatch if no API tokens configured
        outboundMsgId = 'mock_ig_msg_' + Date.now()
        deliveryStatus = 'SENT'
      }

      // Save outbound AI response
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: 'AI',
          content: aiResponseText,
          messageId: outboundMsgId,
          status: deliveryStatus
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (err: any) {
    console.error('Instagram webhook error:', err)
    await prisma.log.create({
      data: {
        type: 'ERROR',
        message: `Instagram Webhook processing failed: ${err.message || err}`,
        details: JSON.stringify(err)
      }
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
