import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // cb(null, "../../public/temp");
    cb(null, "../../public");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});
