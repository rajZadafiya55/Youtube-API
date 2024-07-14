import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "cloudinary-build-url";
import fs from "fs";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SCREAT,
});

const uploadOnCloudinary = async(buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: "auto" },
      (error, result) => {
        if (error) {
          console.error("Error uploading file to Cloudinary:", error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// const uploadOnCloudinary = async (localFilePath) => {
//   try {
//     if (!localFilePath) return null;
//     const response = await cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",
//     });
//     fs.unlinkSync(localFilePath);
//     return response;
//   } catch (error) {
//     console.error("Error uploading file to Cloudinary:", error);
//     fs.unlinkSync(localFilePath);
//     throw error;
//     // return null;
//   }
// };

const deleteCloudniary = async (publicId, resource_type) => {
  try {
    if (!publicId) return null;
    const res = await cloudinary.uploader.destroy(publicId, {
      resource_type: `${resource_type}`,
    });
    return res;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    return null;
  }
};

const deleteUserCloudniary = async (url, resourceType = "image") => {
  const public_id = extractPublicId(url);
  try {
    const response = await cloudinary.uploader.destroy(public_id, {
      resource_type: resourceType,
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export { uploadOnCloudinary, deleteCloudniary, deleteUserCloudniary };
