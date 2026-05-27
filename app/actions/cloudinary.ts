"use server";

import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary on the server
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function getCloudinarySignature(folder: string) {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const paramsToSign = {
      folder,
      timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      success: true,
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    };
  } catch (error: any) {
    console.error("Failed to generate Cloudinary secure upload signature:", error);
    return {
      success: false,
      error: error.message || "Failed to generate signature",
    };
  }
}
