import { getCloudinarySignature } from "@/app/actions/cloudinary";

interface UploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Uploads a file directly from the client to Cloudinary using signed signature tokens.
 * Enforces local size checks (Image <= 15MB, Video <= 50MB).
 */
export async function uploadFileToCloudinary(file: File, folder: string): Promise<UploadResult> {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");

  if (!isImage && !isVideo) {
    throw new Error("Invalid file type. Only images and videos are supported.");
  }

  // 1. Enforce local size constraints
  if (isImage && file.size > 15 * 1024 * 1024) {
    throw new Error("Image size exceeds the 15 MB limit.");
  }

  if (isVideo && file.size > 50 * 1024 * 1024) {
    throw new Error("Video size exceeds the 50 MB limit.");
  }

  // 2. Request cryptographically secure signing details from the server
  const sigRes = await getCloudinarySignature(folder);
  if (!sigRes.success || !sigRes.signature) {
    throw new Error(sigRes.error || "Failed to generate a secure upload signature.");
  }

  const { signature, timestamp, apiKey, cloudName } = sigRes;

  // 3. Prepare Multipart FormData
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  const resourceType = isVideo ? "video" : "image";

  // 4. Send upload stream directly to Cloudinary's REST API
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Cloudinary Upload Error:", errorData);
    throw new Error(
      errorData.error?.message || "Cloudinary direct upload failed."
    );
  }

  const data = await response.json();
  return {
    secure_url: data.secure_url,
    public_id: data.public_id,
  };
}
