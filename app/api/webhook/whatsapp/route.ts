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
        where: { platform: 'WHATSAPP' }
      })
      const verifyToken = config?.whatsappVerifyToken || 'default_verify_token'
      
      if (token === verifyToken) {
        console.log('WHATSAPP WEBHOOK VERIFIED')
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
      message: 'Received WhatsApp Webhook Payload',
      details: JSON.stringify(body)
    }
  })

  try {
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    
    // Delivery status updates
    if (value?.statuses) {
      const statusUpdate = value.statuses[0]
      const extMessageId = statusUpdate.id
      const status = statusUpdate.status.toUpperCase() // SENT, DELIVERED, READ, FAILED
      
      if (extMessageId) {
        await prisma.message.updateMany({
          where: { messageId: extMessageId },
          data: { status }
        })
      }
      return NextResponse.json({ success: true, type: 'status_update' })
    }

    const messageObj = value?.messages?.[0]
    if (!messageObj) {
      return NextResponse.json({ success: true, message: 'No message content' })
    }

    if (messageObj.type !== 'text') {
      return NextResponse.json({ success: true, message: 'Non-text message type ignored' })
    }

    const from = messageObj.from // Customer phone number
    const textBody = messageObj.text?.body
    const messageId = messageObj.id

    const config = await prisma.integrationConfig.findUnique({
      where: { platform: 'WHATSAPP' }
    })
    
    // Find or create conversation
    let conversation = await prisma.conversation.findUnique({
      where: { externalId_platform: { externalId: from, platform: 'WHATSAPP' } }
    })
    
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          externalId: from,
          platform: 'WHATSAPP',
          status: 'ACTIVE'
        }
      })
    }

    // Skip if conversation is paused by administrator
    if (conversation.status === 'PAUSED') {
      return NextResponse.json({ success: true, message: 'Conversation is paused by admin' })
    }

    // Record customer message in DB
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: 'USER',
        content: textBody,
        messageId,
        status: 'READ',
      }
    })

    // Process Response with AI Agent
    const aiResponseText = await generateAIResponse(conversation.id, textBody)
    
    if (aiResponseText && aiResponseText.trim() !== "") {
      const phoneId = config?.whatsappPhoneId
      const accessToken = config?.whatsappToken

      let outboundMsgId: string | null = null
      let deliveryStatus = 'FAILED'

      if (phoneId && accessToken && accessToken.trim() !== "") {
        try {
          const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: from,
              type: 'text',
              text: {
                preview_url: false,
                body: aiResponseText
              }
            })
          })

          const data = await response.json()
          if (response.ok && data.messages?.[0]?.id) {
            outboundMsgId = data.messages[0].id
            deliveryStatus = 'SENT'
          } else {
            console.error('WhatsApp API Send Error:', data)
            await prisma.log.create({
              data: {
                type: 'ERROR',
                message: 'WhatsApp Cloud API send failed',
                details: JSON.stringify(data)
              }
            })
          }
        } catch (fetchErr: any) {
          console.error('WhatsApp Fetch Connection Error:', fetchErr)
          await prisma.log.create({
            data: {
              type: 'ERROR',
              message: 'WhatsApp Cloud API connection failed',
              details: JSON.stringify(fetchErr)
            }
          })
        }
      } else {
        // Fallback mock dispatch if no API tokens configured
        outboundMsgId = 'mock_wa_msg_' + Date.now()
        deliveryStatus = 'SENT'
      }

      // Record outbound AI response in DB
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
    console.error('WhatsApp webhook error:', err)
    await prisma.log.create({
      data: {
        type: 'ERROR',
        message: `WhatsApp Webhook processing failed: ${err.message || err}`,
        details: JSON.stringify(err)
      }
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
