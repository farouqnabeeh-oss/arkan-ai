const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('Seeding database...')

  // 1. Create Default Admin User
  const adminPassword = process.env.ARKAN_ADMIN_PASSWORD || 'admin'
  const hashedPassword = hashPassword(adminPassword)

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    }
  })
  console.log('Admin user seeded (Username: admin, Password: ' + adminPassword + ')')

  // 2. Create Default Settings
  const settingsCount = await prisma.settings.count()
  if (settingsCount === 0) {
    await prisma.settings.create({
      data: {
        systemEnabled: true
      }
    })
    console.log('Default settings seeded.')
  }

  // 3. Create Default IntegrationConfigs
  await prisma.integrationConfig.upsert({
    where: { platform: 'WHATSAPP' },
    update: {},
    create: {
      platform: 'WHATSAPP',
      whatsappPhoneId: '',
      whatsappToken: '',
      whatsappVerifyToken: 'arkan_verify_token_whatsapp_2026'
    }
  })

  await prisma.integrationConfig.upsert({
    where: { platform: 'INSTAGRAM' },
    update: {},
    create: {
      platform: 'INSTAGRAM',
      instagramPageId: '',
      instagramToken: '',
      instagramVerifyToken: 'arkan_verify_token_instagram_2026'
    }
  })
  console.log('Integration configurations seeded.')

  // 4. Create Default KnowledgeBase
  const kbCount = await prisma.knowledgeBase.count()
  if (kbCount === 0) {
    await prisma.knowledgeBase.create({
      data: {
        companyName: 'ARKAN DIGITAL',
        description: 'ARKAN DIGITAL is a premier agency specializing in autonomous AI chat systems, customized web applications, and enterprise automation integrations that help businesses cut costs and operate 24/7.',
        services: '1. Autonomous AI customer support setup for WhatsApp & Instagram DMs\n2. Custom Full-stack Web Development (React, Next.js, Node.js)\n3. Workflow & API integrations (CRMs, ERPs, database syncing)\n4. Cloud infrastructure setup (Google Cloud, AWS, Vercel)',
        pricing: 'Services are priced on project scope. Basic custom web apps start at $2,000. Autonomous AI communication agent setup starts at $1,500 one-time fee with monthly maintenance starting at $150/month.',
        faqs: 'Q: Do you offer free consultations?\nA: Yes, we provide a free 30-minute AI and system architecture audit.\n\nQ: How secure is the AI?\nA: Very secure. We enforce strict prompt boundaries to block prompt-injection and hallucinations.\n\nQ: Can the AI handoff to humans?\nA: By default, this is a fully autonomous 24/7 system, but it can be configured to pause itself and notify admins if human intervention is explicitly requested.',
        offers: 'Sign up for our AI customer agent setup this month and get the first 2 months of system maintenance and monitoring completely free (worth $300)!',
        policies: 'All development works are covered by a 14-day QA verification period. Subscriptions can be canceled with a 30-day notice.',
        toneOfVoice: 'highly professional, business-oriented, engaging, and actively guiding the client to schedule a sales consultation'
      }
    })
    console.log('Knowledge Base seeded.')
  }

  console.log('Database seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
