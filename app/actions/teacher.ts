"use server";

import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db/index";
import { teachersTable } from "@/lib/db/schema";
import { asc, eq, InferSelectModel } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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
    console.error("Get all teachers error:", error);
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
    console.error("Get teacher by id error:", error);
    return {
      success: false,
      error: "Internal server error",
      teacher: null,
    };
  }
}

// UPDATE TEACHER (with automatic old image cleanup on Cloudinary)
export async function updateTeacher(id: number, teacher: Partial<Teacher>) {
  try {
    const sanitized = Object.fromEntries(
      Object.entries(teacher).filter(([, v]) => v !== undefined)
    ) as Partial<typeof teachersTable.$inferInsert>;

    if (Object.keys(sanitized).length === 0) {
      return { success: false, error: "No fields to update" };
    }

    // Fetch existing teacher to get old photoPublicId for cleanup
    const [existing] = await db
      .select()
      .from(teachersTable)
      .where(eq(teachersTable.id, id))
      .limit(1);

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

    // If photo changed, clean up the replaced photo from Cloudinary
    if (
      existing &&
      sanitized.photoPublicId &&
      existing.photoPublicId &&
      existing.photoPublicId !== sanitized.photoPublicId
    ) {
      try {
        await deleteFromCloudinary(existing.photoPublicId);
      } catch (err) {
        console.error("Failed to delete replaced teacher photo from Cloudinary:", err);
      }
    }

    revalidatePath("/admin/teachers");
    revalidatePath("/teachers");
    revalidatePath(`/teachers/${id}`);

    return { success: true, teacher: updated };
  } catch (err) {
    console.error("[updateTeacher]", err);
    return { success: false, error: "Failed to update teacher" };
  }
}

// CREATE TEACHER
interface AddTeacherPayload {
  teacherName: string;
  gender?: "male" | "female" | "other" | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  employmentType: string;
  qualifications?: string[] | null;
  subjectsTeaches?: string[] | null;
  post?: string[] | null;
  experience?: number | null;
  photo?: string | null;
  photoPublicId?: string | null;
}

export async function addTeacher(data: AddTeacherPayload) {
  try {
    if (!data.teacherName?.trim()) {
      return {
        success: false,
        message: "Teacher name is required",
      };
    }

    // Save teacher directly with already-uploaded photo details
    const insertedTeacher = await db
      .insert(teachersTable)
      .values({
        teacherName: data.teacherName.trim(),
        gender: data.gender ?? null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        employmentType: data.employmentType,
        qualifications: data.qualifications ?? null,
        subjectsTeaches: data.subjectsTeaches ?? null,
        post: data.post ?? null,
        experience: data.experience ?? null,
        photo: data.photo || null,
        photoPublicId: data.photoPublicId || null,
      })
      .returning();

    // Refresh pages
    revalidatePath("/admin/teachers");
    revalidatePath("/teachers");

    return {
      success: true,
      message: "Teacher added successfully",
      teacher: insertedTeacher[0],
    };
  } catch (error) {
    console.error("[ADD_TEACHER_ACTION_ERROR]", error);
    return {
      success: false,
      message: "Failed to add teacher. Please try again.",
    };
  }
}

// DELETE TEACHER (with automatic photo cleanup on Cloudinary)
export async function deleteTeacher(id: number) {
  try {
    // Fetch existing teacher first to get photoPublicId
    const [existing] = await db
      .select()
      .from(teachersTable)
      .where(eq(teachersTable.id, id))
      .limit(1);

    const [deleted] = await db
      .delete(teachersTable)
      .where(eq(teachersTable.id, id))
      .returning({ id: teachersTable.id });

    if (!deleted) {
      return { success: false, error: "Teacher not found" };
    }

    // Clean up photo from Cloudinary if it exists
    if (existing && existing.photoPublicId) {
      try {
        await deleteFromCloudinary(existing.photoPublicId);
      } catch (err) {
        console.error("Failed to delete teacher photo from Cloudinary:", err);
      }
    }

    revalidatePath("/admin/teachers");
    revalidatePath("/teachers");

    return { success: true, id: deleted.id };
  } catch (err) {
    console.error("[deleteTeacher]", err);
    return { success: false, error: "Failed to delete teacher" };
  }
}