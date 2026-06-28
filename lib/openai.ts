import OpenAI from 'openai'
import { prisma } from './prisma'

export async function generateAIResponse(conversationId: string, userMessageContent: string): Promise<string> {
  const startTime = Date.now()
  
  try {
    // 1. Get system settings
    const settings = await prisma.settings.findFirst()
    const systemEnabled = settings ? settings.systemEnabled : true
    
    if (!systemEnabled) {
      await prisma.log.create({
        data: {
          type: 'INFO',
          message: `AI Response skipped for conversation ${conversationId} (System is disabled)`,
        }
      })
      return ""
    }

    // 2. Load Knowledge Base
    let kb = await prisma.knowledgeBase.findFirst()
    if (!kb) {
      // Fallback defaults
      kb = {
        id: 'default',
        companyName: 'ARKAN DIGITAL',
        description: 'ARKAN DIGITAL is a leading provider of custom AI automation, web development, and digital marketing services.',
        services: 'We build autonomous AI communication systems, custom web applications (Next.js/React), and execute performance marketing campaigns.',
        pricing: 'Pricing is customized based on scope. Standard chatbot implementation starts at $1500. Maintenance starts at $200/month.',
        faqs: 'Q: How fast can we launch? A: Typically within 2-4 weeks.\nQ: Do you offer support? A: Yes, 24/7 technical monitoring.',
        offers: 'Get a free AI strategy consultation when signing up this month.',
        policies: 'All contracts have a 30-day money-back guarantee if deliverables are not met.',
        toneOfVoice: 'professional, concise, helpful, and sales-focused',
        updatedAt: new Date()
      }
    }

    // 3. Fetch Conversation History (last 10 messages)
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { timestamp: 'asc' },
      take: 10
    })

    // 4. Construct System Prompt
    const systemPrompt = `You are the official AI customer support agent for ${kb.companyName.toUpperCase()}.
You handle all customer communication automatically.

You must strictly adhere to the following rules:
1. Only use the provided company knowledge base. Never invent any information outside this knowledge base.
2. If the user asks for information that is missing from the knowledge base, do not guess. Instead, politely ask clarifying questions to guide them or gather their contact details.
3. You never mention that you are an AI, automated assistant, chatbot, or robot. Act as a human employee of the company.
4. Never say "I don't know" or refuse to answer. Frame your response to clarify their request and steer them towards our services.
5. Always stay professional, concise, and business-oriented.
6. Always try to convert the conversation into a potential sale by highlighting our services and offers where appropriate.
7. Keep responses natural, human-like, and direct.

=== COMPANY KNOWLEDGE BASE ===
Company Name: ${kb.companyName}
Description: ${kb.description}
Services: ${kb.services}
Pricing: ${kb.pricing}
FAQs: ${kb.faqs}
Offers: ${kb.offers}
Policies: ${kb.policies}
Tone of Voice: ${kb.toneOfVoice}
=============================`

    // 5. Construct Chat Messages History
    const apiMessages: any[] = [{ role: 'system', content: systemPrompt }]
    
    // Map previous messages
    for (const msg of messages) {
      if (msg.sender === 'USER') {
        apiMessages.push({ role: 'user', content: msg.content })
      } else if (msg.sender === 'AI') {
        apiMessages.push({ role: 'assistant', content: msg.content })
      }
    }

    // Add current user message (if not already stored in DB history mapped above)
    const lastMsg = messages[messages.length - 1]
    if (!lastMsg || lastMsg.content !== userMessageContent || lastMsg.sender !== 'USER') {
      apiMessages.push({ role: 'user', content: userMessageContent })
    }

    // 6. Invoke OpenAI API
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey || apiKey === 'your-openai-api-key' || apiKey.trim() === '') {
      // In development / demo mode when OpenAI API key is not configured, generate a mock response
      const latency = Date.now() - startTime
      const mockResponse = generateMockAIResponse(userMessageContent, kb)
      
      await prisma.log.create({
        data: {
          type: 'AI_LATENCY',
          message: `Generated mock response (OpenAI Key not set). Latency: ${latency}ms`,
          details: JSON.stringify({ conversationId, userMessageContent, response: mockResponse })
        }
      })
      return mockResponse
    }

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: apiMessages,
      temperature: 0.3, // Low temperature to prevent hallucinations
      max_tokens: 500,
    })

    const aiResponse = completion.choices[0]?.message?.content || ""
    const latency = Date.now() - startTime

    // Log the transaction
    await prisma.log.create({
      data: {
        type: 'AI_LATENCY',
        message: `AI generated response in ${latency}ms`,
        details: JSON.stringify({ conversationId, latencyMs: latency })
      }
    })

    return aiResponse.trim()

  } catch (error: any) {
    console.error("AI Response Engine Error:", error)
    await prisma.log.create({
      data: {
        type: 'ERROR',
        message: `AI Response Generation Failed: ${error.message || error}`,
        details: JSON.stringify(error)
      }
    })
    
    // In case of API error, return a professional clarifying message
    return "Thank you for reaching out. Could you please specify how we can help you today with our digital services at ARKAN DIGITAL?"
  }
}

// Fallback Mock Response Generator (useful for testing when OpenAI API key is not set)
function generateMockAIResponse(userMessage: string, kb: any): string {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('مرحبا') || msg.includes('هلا') || msg.includes('سلام')) {
    return `Hello! Welcome to ${kb.companyName}. ${kb.description} How can I assist you today, or which of our services are you interested in?`;
  }
  
  if (msg.includes('service') || msg.includes('work') || msg.includes('خدمات') || msg.includes('برمجة') || msg.includes('موقع')) {
    return `At ${kb.companyName}, we offer several key services: ${kb.services}. We also have a special offer: ${kb.offers}. Would you like to schedule a free consultation to discuss your project?`;
  }
  
  if (msg.includes('price') || msg.includes('cost') || msg.includes('pricing') || msg.includes('سعر') || msg.includes('بكم') || msg.includes('تكلفة')) {
    return `Regarding our pricing: ${kb.pricing}. We tailor pricing to each client's specific requirements. To provide an accurate estimate, could you tell me more about your project needs?`;
  }
  
  if (msg.includes('offer') || msg.includes('discount') || msg.includes('خصم') || msg.includes('عرض') || msg.includes('عروض')) {
    return `Currently, we have this exclusive offer: ${kb.offers}. This is a limited-time opportunity. Would you like to secure this offer for your business?`;
  }
  
  if (msg.includes('policy') || msg.includes('guarantee') || msg.includes('ضمان') || msg.includes('شروط')) {
    return `We stand behind our work. Our policy states: ${kb.policies}. Your satisfaction is our priority.`;
  }
  
  return `Thank you for your message. Regarding that, could you please share more details about your request so I can assist you with our services at ${kb.companyName}?`;
}
