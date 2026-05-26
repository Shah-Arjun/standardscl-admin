"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "@/lib/db";
import { userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";



export async function checkAuth() {
    try {
        // get token from cookies
        const cookieStore = await cookies();

        const token = cookieStore.get("ssbs-admin")?.value;

        if (!token) {
            return {
                success: false,
                user: null,
            };
        }

        // verify jwt token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as {
            email: string;
            role: string;
        };



        // find user from database
        const user = await db.select().from(userTable)
            .where(eq(userTable.email, decoded.email));

        console.log(user)  //debug

        if (!user) {
            return {
                success: false,
                user: null,
            };
        }

        return {
            success: true,
            user,
        };
    } catch (error) {

        console.log(error);

        return {
            success: false,
            user: null,
        };
    }
}



// get admin profile data
export async function getAdminProfile(email: string) {
  try {
    const user = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
    return user[0];
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    throw new Error("Failed to fetch admin profile");
  }
}


// update admin profile
export async function updateAdminProfile(data: { email: string; password?: string;}) {
  try {
    const { email, password } = data
    await db.update(userTable)
      .set({ password: password })
      .where(eq(userTable.email, email));

    return {
      success: true,
      message: "Profile updated",
    };
  } catch (err) {
    console.error("Error updating admin profile:", err);
    return {
      success: false,
      error: "Failed to update profile",
    };
  }
}