// app/actions/teacher.actions.ts

"use server";

import { db } from "@/lib/db/index";
import { teachersTable } from "@/lib/db/schema";
import { asc, eq, InferSelectModel } from "drizzle-orm";

type Teacher = InferSelectModel<typeof teachersTable>;



// GET ALL TEACHERS
export async function getAllTeachers() {
    try {
        const teachers = await db
            .select()
            .from(teachersTable)
            .orderBy(asc(teachersTable.id));

        return {
            success: true,
            teachers,
        };
    } catch (error) {
        console.log("Get all teachers error:", error);

        return {
            success: false,
            teachers: [],
            error: "Internal server error",
        };
    }
}


// GET TEACHER BY ID
export async function getTeacherById(id: string | number) {
    try {
        const teacherId = Number(id);

        if (Number.isNaN(teacherId)) {
            return {
                success: false,
                error: "Invalid teacher ID",
                teacher: null,
            };
        }

        const teacher = await db
            .select()
            .from(teachersTable)
            .where(eq(teachersTable.id, teacherId))
            .limit(1);

        if (teacher.length === 0) {
            return {
                success: false,
                error: "Teacher not found",
                teacher: null,
            };
        }

        return {
            success: true,
            error: null,
            teacher: teacher[0],
        };

    } catch (error) {
        console.log("Get teacher by id error:", error);

        return {
            success: false,
            error: "Internal server error",
            teacher: null,
        };
    }
}



// ─── updateTeacher ────────────────────────────────────────────────────────────
export async function updateTeacher(id: number, teacher: Teacher) {
    try {
        const sanitized = Object.fromEntries(
            Object.entries(teacher).filter(([, v]) => v !== undefined)
        ) as Partial<typeof teachersTable.$inferInsert>;

        if (Object.keys(sanitized).length === 0) {
            return { success: false, error: "No fields to update" };
        }

        const [updated] = await db
            .update(teachersTable)
            .set({
                ...sanitized,
                updatedAt: new Date(),
            })
            .where(eq(teachersTable.id, id))
            .returning();

        if (!updated) {
            return { success: false, error: "Teacher not found or update failed" };
        }

        return { success: true, teacher: updated };
    } catch (err) {
        console.error("[updateTeacher]", err);
        return { success: false, error: "Failed to update teacher" };
    }
}



// ─── deleteTeacher ────────────────────────────────────────────────────────────
export async function deleteTeacher(id: number) {
    try {
        const [deleted] = await db
            .delete(teachersTable)
            .where(eq(teachersTable.id, id))
            .returning({ id: teachersTable.id });

        if (!deleted) {
            return { success: false, error: "Teacher not found" };
        }

        return { success: true, id: deleted.id };
    } catch (err) {
        console.error("[deleteTeacher]", err);
        return { success: false, error: "Failed to delete teacher" };
    }
}