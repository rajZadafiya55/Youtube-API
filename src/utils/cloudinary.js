import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SCREAT,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

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

export { uploadOnCloudinary, deleteCloudniary };
