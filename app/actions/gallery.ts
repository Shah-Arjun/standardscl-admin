"use server";

import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db/index";
import { imageTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GalleryImage } from "@/lib/types/gallery";

// GET ALL GALLERY IMAGES/VIDEOS
export async function getGalleryImages() {
  try {
    const data = await db
      .select()
      .from(imageTable)
      .orderBy(desc(imageTable.createdAt));

    return {
      success: true,
      data: data as GalleryImage[],
    };
  } catch (error: any) {
    console.error("getGalleryImages error:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch gallery images",
      data: [],
    };
  }
}

// GET GALLERY IMAGE/VIDEO BY ID
export async function getGalleryImageById(id: number) {
  try {
    const imageId = Number(id);
    if (Number.isNaN(imageId)) {
      return {
        success: false,
        message: "Invalid image ID",
        data: null,
      };
    }

    const result = await db
      .select()
      .from(imageTable)
      .where(eq(imageTable.id, imageId))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        message: "Gallery image not found",
        data: null,
      };
    }

    return {
      success: true,
      data: result[0] as GalleryImage,
    };
  } catch (error: any) {
    console.error("getGalleryImageById error:", error);
    return {
      success: false,
      message: error.message || "Internal server error",
      data: null,
    };
  }
}

// CREATE GALLERY IMAGE/VIDEO (URL and public ID already uploaded from client)
export async function createGalleryImage(data: {
  title: string;
  category: GalleryImage["category"];
  url: string;
  photoPublicId: string;
}) {
  try {
    const { title, category, url, photoPublicId } = data;

    if (!title || !category || !url || !photoPublicId) {
      return {
        success: false,
        message: "All fields are required, including the published media url and ID",
        data: null,
      };
    }

    // Insert record directly
    const newImage = await db
      .insert(imageTable)
      .values({
        title: title.trim(),
        category,
        url,
        photoPublicId,
      })
      .returning();

    revalidatePath("/gallery");
    revalidatePath("/");

    return {
      success: true,
      message: "Media added to gallery successfully",
      data: newImage[0] as GalleryImage,
    };
  } catch (error: any) {
    console.error("createGalleryImage error:", error);
    return {
      success: false,
      message: error.message || "Failed to add image to gallery",
      data: null,
    };
  }
}

// UPDATE GALLERY IMAGE/VIDEO (with old media garbage collection on Cloudinary)
export async function updateGalleryImage(
  id: number,
  data: {
    title: string;
    category: GalleryImage["category"];
    url?: string;
    photoPublicId?: string;
  }
) {
  try {
    const imageId = Number(id);
    if (Number.isNaN(imageId)) {
      return {
        success: false,
        message: "Invalid image ID",
        data: null,
      };
    }

    const { title, category, url, photoPublicId } = data;
    if (!title || !category) {
      return {
        success: false,
        message: "Title and category are required",
        data: null,
      };
    }

    // Fetch existing image details
    const existing = await db
      .select()
      .from(imageTable)
      .where(eq(imageTable.id, imageId))
      .limit(1);

    if (existing.length === 0) {
      return {
        success: false,
        message: "Gallery item not found",
        data: null,
      };
    }

    let finalUrl = existing[0].url;
    let finalPhotoPublicId = existing[0].photoPublicId;

    // If new media was uploaded, swap and clean up the old one
    if (photoPublicId && url) {
      // Delete old from Cloudinary
      try {
        await deleteFromCloudinary(existing[0].photoPublicId);
      } catch (err) {
        console.error("Failed to delete old gallery item from Cloudinary:", err);
      }

      finalUrl = url;
      finalPhotoPublicId = photoPublicId;
    }

    const updated = await db
      .update(imageTable)
      .set({
        title: title.trim(),
        category,
        url: finalUrl,
        photoPublicId: finalPhotoPublicId,
      })
      .where(eq(imageTable.id, imageId))
      .returning();

    revalidatePath("/gallery");
    revalidatePath("/");

    return {
      success: true,
      message: "Gallery item updated successfully",
      data: updated[0] as GalleryImage,
    };
  } catch (error: any) {
    console.error("updateGalleryImage error:", error);
    return {
      success: false,
      message: error.message || "Failed to update gallery item",
      data: null,
    };
  }
}

// DELETE GALLERY IMAGE/VIDEO
export async function deleteGalleryImage(id: number) {
  try {
    const imageId = Number(id);
    if (Number.isNaN(imageId)) {
      return {
        success: false,
        message: "Invalid image ID",
      };
    }

    // Fetch details to get Cloudinary public ID for deletion
    const result = await db
      .select()
      .from(imageTable)
      .where(eq(imageTable.id, imageId))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        message: "Gallery item not found",
      };
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(result[0].photoPublicId);
    } catch (err) {
      console.error("Failed to delete from Cloudinary:", err);
    }

    // Delete from DB
    await db.delete(imageTable).where(eq(imageTable.id, imageId));

    revalidatePath("/gallery");
    revalidatePath("/");

    return {
      success: true,
      message: "Media deleted from gallery successfully",
    };
  } catch (error: any) {
    console.error("deleteGalleryImage error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete gallery item",
    };
  }
}
