"use server"

import { db } from "@/lib/db/index"
import { notices } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { Notice } from "@/lib/types/notice"

// get all notices
export async function getAllNotices() {
  try {
    const data = await db
      .select()
      .from(notices)
      .orderBy(notices.createdAt)

    return {
      success: true,
      message: "Notices fetched successfully",
      data: data as Notice[],
    }
  } catch (error: any) {
    console.error("getAllNotices error:", error)
    return {
      success: false,
      message: error.message || "Failed to fetch notices",
      data: [],
    }
  }
}

// get single notice by id
export async function getNoticeById(id: number) {
  try {
    const noticeId = Number(id)

    if (Number.isNaN(noticeId)) {
      return {
        success: false,
        message: "Invalid notice id",
        data: null,
      }
    }

    const result = await db
      .select()
      .from(notices)
      .where(eq(notices.id, noticeId))
      .limit(1)

    if (result.length === 0) {
      return {
        success: false,
        message: "Notice not found",
        data: null,
      }
    }

    return {
      success: true,
      message: "Notice fetched successfully",
      data: result[0] as Notice,
    }
  } catch (error: any) {
    console.error("getNoticeById error:", error)

    return {
      success: false,
      message: error.message || "Internal server error",
      data: null,
    }
  }
}

// create notice
export async function createNotice(formData: {
  title: string;
  content: string;
  category: Notice["category"];
  postedBy: Notice["postedBy"];
}) {
  try {
    const { title, content, category, postedBy } = formData;

    if (!title || !content || !category || !postedBy) {
      return {
        success: false,
        message: "All fields are required",
        data: null,
      };
    }

    const newNotice = await db
      .insert(notices)
      .values({
        title,
        content,
        category,
        postedBy,
      })
      .returning();

    revalidatePath("/notices");
    revalidatePath("/admin/notices");

    return {
      success: true,
      message: "Notice added successfully",
      data: newNotice[0] as Notice,
    };
  } catch (error: any) {
    console.error("createNotice error:", error);
    return {
      success: false,
      message: error.message || "Failed to add notice",
      data: null,
    };
  }
}

// delete notice
export async function deleteNotice(id: number) {
  try {
    const noticeId = Number(id);
    if (Number.isNaN(noticeId)) {
      return {
        success: false,
        message: "Invalid notice ID",
      };
    }

    const deleted = await db
      .delete(notices)
      .where(eq(notices.id, noticeId))
      .returning();

    if (deleted.length === 0) {
      return {
        success: false,
        message: "Notice not found",
      };
    }

    revalidatePath("/notices");
    revalidatePath("/admin/notices");

    return {
      success: true,
      message: "Notice deleted successfully",
    };
  } catch (error: any) {
    console.error("deleteNotice error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete notice",
    };
  }
}

// update notice
export async function updateNotice(
  id: number,
  formData: {
    title: string;
    content: string;
    category: Notice["category"];
    postedBy: Notice["postedBy"];
  }
) {
  try {
    const noticeId = Number(id);
    if (Number.isNaN(noticeId)) {
      return {
        success: false,
        message: "Invalid notice ID",
        data: null,
      };
    }

    const { title, content, category, postedBy } = formData;

    if (!title || !content || !category || !postedBy) {
      return {
        success: false,
        message: "All fields are required",
        data: null,
      };
    }

    const updated = await db
      .update(notices)
      .set({
        title,
        content,
        category,
        postedBy,
        updatedAt: new Date(),
      })
      .where(eq(notices.id, noticeId))
      .returning();

    if (updated.length === 0) {
      return {
        success: false,
        message: "Notice not found",
        data: null,
      };
    }

    revalidatePath("/notices");
    revalidatePath("/admin/notices");

    return {
      success: true,
      message: "Notice updated successfully",
      data: updated[0] as Notice,
    };
  } catch (error: any) {
    console.error("updateNotice error:", error);
    return {
      success: false,
      message: error.message || "Failed to update notice",
      data: null,
    };
  }
}