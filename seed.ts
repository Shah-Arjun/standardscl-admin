import bcrypt from "bcryptjs"
import { db } from "@/lib/db/index"
import { userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

async function seed() {
  try {
    const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL or ADMIN_PASSWORD is missing in environment variables")
  }

  const existingAdmin = await db
    .select()
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1)

  if (existingAdmin.length > 0) {
    console.log("Admin already exists")
    return
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.insert(userTable).values({
    email,
    password: hashedPassword,
    role: "admin",
  })

  console.log("Admin seeded successfully")    
  } catch (error) {
    console.error("Seeding failed:", error)
  } finally {
    process.exit(1)
  }
}


seed()


// run command: npx tsx seed.ts