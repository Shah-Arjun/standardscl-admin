// app/actions/auth.actions.ts

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