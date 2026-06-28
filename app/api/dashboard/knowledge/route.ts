import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let kb = await prisma.knowledgeBase.findFirst()
    if (!kb) {
      return NextResponse.json({
        knowledgeBase: {
          companyName: 'ARKAN DIGITAL',
          description: '',
          services: '',
          pricing: '',
          faqs: '',
          offers: '',
          policies: '',
          toneOfVoice: 'professional and friendly'
        }
      })
    }
    return NextResponse.json({ knowledgeBase: kb })
  } catch (err: any) {
    console.error('Fetch knowledge base error:', err)
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
    const currentKb = await prisma.knowledgeBase.findFirst()

    let updatedKb
    if (currentKb) {
      updatedKb = await prisma.knowledgeBase.update({
        where: { id: currentKb.id },
        data: {
          companyName: data.companyName,
          description: data.description,
          services: data.services,
          pricing: data.pricing,
          faqs: data.faqs,
          offers: data.offers,
          policies: data.policies,
          toneOfVoice: data.toneOfVoice
        }
      })
    } else {
      updatedKb = await prisma.knowledgeBase.create({
        data: {
          companyName: data.companyName || 'ARKAN DIGITAL',
          description: data.description || '',
          services: data.services || '',
          pricing: data.pricing || '',
          faqs: data.faqs || '',
          offers: data.offers || '',
          policies: data.policies || '',
          toneOfVoice: data.toneOfVoice || 'professional and friendly'
        }
      })
    }

    await prisma.log.create({
      data: {
        type: 'INFO',
        message: 'Knowledge Base updated by administrator',
      }
    })

    return NextResponse.json({ knowledgeBase: updatedKb })
  } catch (err: any) {
    console.error('Update knowledge base error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
