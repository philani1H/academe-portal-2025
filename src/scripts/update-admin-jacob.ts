
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { generatePasswordFromName } from '../lib/utils'

const prisma = new PrismaClient()

function getCompanyDomain(): string {
  const frontend = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL
  if (frontend) {
    try {
      const host = new URL(frontend).hostname.toLowerCase()
      return host.replace(/^www\./, "")
    } catch {
      // fall through to default
    }
  }
  return "excellenceakademie.co.za"
}

function makeCompanyEmail(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
  return `${base}@${getCompanyDomain()}`
}

async function ensureAdminUser(name: string, personalEmail: string) {
  const username = name
  const displayName = name
  const companyEmail = makeCompanyEmail(name)
  const tempPassword = generatePasswordFromName(name)
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  const admin = await prisma.adminUser.upsert({
    where: { username },
    update: {
      displayName,
      email: companyEmail,
      personalEmail,
      permissions: "superadmin",
      passwordHash,
    },
    create: {
      username,
      displayName,
      email: companyEmail,
      personalEmail,
      permissions: "superadmin",
      passwordHash,
    },
  })

  console.log(`✅ Admin user ensured: ${admin.username}`)
  console.log(`   - Work email: ${admin.email}`)
  console.log(`   - Personal email: ${admin.personalEmail}`)
  console.log(`   - Temporary password: ${tempPassword}`)
}

async function main() {
  console.log("🔄 Ensuring superadmin profiles for Jacob Abate and Roshan Singh...")

  await ensureAdminUser("Jacob Abate", "minaseabate.work@gmail.com")
  await ensureAdminUser("Roshan Singh", "roshansinghrsa02@gmail.com")

  console.log("✅ Admin users updated successfully.")
}

main()
  .catch((e) => {
    console.error("❌ Error updating admin users:", e)
    process.exit(1)
  })
  .finally(async () => {
    prisma
      .$disconnect()
      .then(() => {
        process.exit(0)
      })
      .catch(() => {
        process.exit(1)
      })
  })
