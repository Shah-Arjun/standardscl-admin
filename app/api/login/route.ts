import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { userTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"


export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    console.log(email, password)

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, email))

    const user = result[0]

    // unified error
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // const token = await signToken({
    //   email: user.email,
    //   role: user.role,
    // })

    // const res = NextResponse.json({ success: true })

    // res.cookies.set("token", token, {
    //   httpOnly: true,                                  // JS cannot access --> secure
    //   secure: process.env.NODE_ENV === "production",   // only https in production
    //   sameSite: "strict",                              // prevents CSRF attacks
    //   path: "/",                                      // cookies will only be available in /* pages
    //   maxAge: 60 * 60,                                // expires after 1h
    // })

    // return res

    const token = jwt.sign(
      { email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({ message: "Login successful" });

    response.cookies.set("ssbs-admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || false,  // TRUE in production, FALSE in development 
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 1 day
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}