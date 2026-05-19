import { v2 as cloudinary } from "cloudinary";


// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});


// types
interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
}


// upload to cloudinary function
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folderName: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "auto", // Automatically detect the file type (image, video, etc.)
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            public_id: result!.public_id,
            secure_url: result!.secure_url,
          });
        }
      },
    );

    uploadStream.end(fileBuffer);
  });
};



export default cloudinary