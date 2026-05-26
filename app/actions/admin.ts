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



// Helper to get current authenticated user's email securely from JWT cookie
async function getCurrentUserEmail(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("ssbs-admin")?.value;

  if (!token) throw new Error("Not authenticated");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      email: string;
      role: string;
    };
    if (!decoded || !decoded.email) {
      throw new Error("Invalid session token payload");
    }
    return decoded.email;
  } catch (error) {
    throw new Error("Invalid or expired session");
  }
}



// Get current admin profile data
export async function getAdminProfile() {
  try {
    const email = await getCurrentUserEmail();
    const user = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
    
    if (!user || user.length === 0) {
      throw new Error("Admin profile not found");
    }
    
    return {
      email: user[0].email,
      role: user[0].role,
    };
  } catch (error: any) {
    console.error("Error fetching admin profile:", error);
    throw new Error(error.message || "Failed to fetch admin profile");
  }
}




// Update admin profile details
import bcrypt from "bcrypt";

export async function updateAdminProfile(data: {
  email: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  try {
    const currentUserEmail = await getCurrentUserEmail();
    const { email, currentPassword, newPassword } = data;

    // Fetch current user
    const [currentUser] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, currentUserEmail))
      .limit(1);

    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    const updateData: any = {};
    const isChangingEmail = email.trim().toLowerCase() !== currentUserEmail.trim().toLowerCase();
    const isChangingPassword = !!newPassword;

    // Security: Require current password for changes
    if ((isChangingEmail || isChangingPassword) && !currentPassword) {
      return {
        success: false,
        error: "Current password is required to make changes",
      };
    }

    // Verify current password
    if (currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isValid) {
        return { success: false, error: "Current password is incorrect" };
      }
    }

    // Prepare data to update
    if (isChangingEmail) {
      // Check if new email is already taken by another account
      const existingUser = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, email.trim().toLowerCase()))
        .limit(1);

      if (existingUser && existingUser.length > 0) {
        return { success: false, error: "Email is already in use by another account" };
      }

      updateData.email = email.trim().toLowerCase();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return { success: false, error: "New password must be at least 6 characters long" };
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true, message: "No changes made" };
    }

    // Update user
    await db
      .update(userTable)
      .set(updateData)
      .where(eq(userTable.email, currentUserEmail));

    // CRITICAL: Synchronize session cookies if email was updated
    if (isChangingEmail) {
      const token = jwt.sign(
        { email: email.trim().toLowerCase(), role: currentUser.role },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      const cookieStore = await cookies();
      cookieStore.set("ssbs-admin", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60, // 1 day
      });
    }

    return {
      success: true,
      message: "Profile updated successfully",
    };
  } catch (err: any) {
    console.error("Error updating admin profile:", err);
    return {
      success: false,
      error: err.message || "Failed to update profile",
    };
  }
}