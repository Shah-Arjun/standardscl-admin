"use server";

import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db/index";
import { imageTable } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { GalleryImage } from "@/lib/types/gallery";

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

export async function createGalleryImage(data: {
  title: string;
  category: GalleryImage["category"];
  image: File;
}) {
  try {
    const { title, category, image } = data;

    if (!title || !category || !image) {
      return {
        success: false,
        message: "All fields are required, including the image file",
        data: null,
      };
    }

    // Check file type
    if (!image.type.startsWith("image/")) {
      return {
        success: false,
        message: "Please upload a valid image file",
        data: null,
      };
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const uploadResult = await uploadToCloudinary(buffer, "gallery");

    const newImage = await db
      .insert(imageTable)
      .values({
        title: title.trim(),
        category,
        url: uploadResult.secure_url,
        photoPublicId: uploadResult.public_id,
      })
      .returning();

    revalidatePath("/gallery");
    revalidatePath("/");

    return {
      success: true,
      message: "Image added to gallery successfully",
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

export async function updateGalleryImage(
  id: number,
  data: {
    title: string;
    category: GalleryImage["category"];
    image?: File | null;
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

    const { title, category, image } = data;
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
        message: "Gallery image not found",
        data: null,
      };
    }

    let url = existing[0].url;
    let photoPublicId = existing[0].photoPublicId;

    // If new image provided, upload and destroy old
    if (image) {
      if (!image.type.startsWith("image/")) {
        return {
          success: false,
          message: "Please upload a valid image file",
          data: null,
        };
      }

      const buffer = Buffer.from(await image.arrayBuffer());
      const uploadResult = await uploadToCloudinary(buffer, "gallery");

      // Delete old from Cloudinary
      try {
        await deleteFromCloudinary(existing[0].photoPublicId);
      } catch (err) {
        console.error("Failed to delete old image from Cloudinary:", err);
      }

      url = uploadResult.secure_url;
      photoPublicId = uploadResult.public_id;
    }

    const updated = await db
      .update(imageTable)
      .set({
        title: title.trim(),
        category,
        url,
        photoPublicId,
      })
      .where(eq(imageTable.id, imageId))
      .returning();

    revalidatePath("/gallery");
    revalidatePath("/");

    return {
      success: true,
      message: "Gallery image updated successfully",
      data: updated[0] as GalleryImage,
    };
  } catch (error: any) {
    console.error("updateGalleryImage error:", error);
    return {
      success: false,
      message: error.message || "Failed to update gallery image",
      data: null,
    };
  }
}

export async function deleteGalleryImage(id: number) {
  try {
    const imageId = Number(id);
    if (Number.isNaN(imageId)) {
      return {
        success: false,
        message: "Invalid image ID",
      };
    }

    // Fetch details to get Cloudinary public ID
    const result = await db
      .select()
      .from(imageTable)
      .where(eq(imageTable.id, imageId))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        message: "Gallery image not found",
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
      message: "Image deleted from gallery successfully",
    };
  } catch (error: any) {
    console.error("deleteGalleryImage error:", error);
    return {
      success: false,
      message: error.message || "Failed to delete gallery image",
    };
  }
}
