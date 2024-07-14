import multer from "multer";

const storage = multer.memoryStorage(); // Store file in memory

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});
