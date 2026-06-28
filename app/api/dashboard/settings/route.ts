import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const settings = await prisma.settings.findFirst()
    const systemEnabled = settings ? settings.systemEnabled : true

    const whatsappConfig = await prisma.integrationConfig.findUnique({
      where: { platform: 'WHATSAPP' }
    })

    const instagramConfig = await prisma.integrationConfig.findUnique({
      where: { platform: 'INSTAGRAM' }
    })

    return NextResponse.json({
      systemEnabled,
      whatsapp: {
        whatsappPhoneId: whatsappConfig?.whatsappPhoneId || '',
        whatsappToken: whatsappConfig?.whatsappToken || '',
        whatsappVerifyToken: whatsappConfig?.whatsappVerifyToken || ''
      },
      instagram: {
        instagramPageId: instagramConfig?.instagramPageId || '',
        instagramToken: instagramConfig?.instagramToken || '',
        instagramVerifyToken: instagramConfig?.instagramVerifyToken || ''
      }
    })
  } catch (err: any) {
    console.error('Fetch settings error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await req.json()
    
    // Update global systemEnabled flag
    if (typeof data.systemEnabled === 'boolean') {
      const currentSettings = await prisma.settings.findFirst()
      if (currentSettings) {
        await prisma.settings.update({
          where: { id: currentSettings.id },
          data: { systemEnabled: data.systemEnabled }
        })
      } else {
        await prisma.settings.create({
          data: { systemEnabled: data.systemEnabled }
        })
      }
    }

    // Update WhatsApp Config
    if (data.whatsapp) {
      await prisma.integrationConfig.upsert({
        where: { platform: 'WHATSAPP' },
        update: {
          whatsappPhoneId: data.whatsapp.whatsappPhoneId,
          whatsappToken: data.whatsapp.whatsappToken,
          whatsappVerifyToken: data.whatsapp.whatsappVerifyToken
        },
        create: {
          platform: 'WHATSAPP',
          whatsappPhoneId: data.whatsapp.whatsappPhoneId || '',
          whatsappToken: data.whatsapp.whatsappToken || '',
          whatsappVerifyToken: data.whatsapp.whatsappVerifyToken || ''
        }
      })
    }

    // Update Instagram Config
    if (data.instagram) {
      await prisma.integrationConfig.upsert({
        where: { platform: 'INSTAGRAM' },
        update: {
          instagramPageId: data.instagram.instagramPageId,
          instagramToken: data.instagram.instagramToken,
          instagramVerifyToken: data.instagram.instagramVerifyToken
        },
        create: {
          platform: 'INSTAGRAM',
          instagramPageId: data.instagram.instagramPageId || '',
          instagramToken: data.instagram.instagramToken || '',
          instagramVerifyToken: data.instagram.instagramVerifyToken || ''
        }
      })
    }

    await prisma.log.create({
      data: {
        type: 'INFO',
        message: 'System settings and integration configs updated'
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Update settings error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
