import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Use path.join to construct the correct path
    cb(null, path.join(__dirname, "../../public/temp"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // cb(null, "../../public/temp");
//     cb(null, "./public/temp");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// export const upload = multer({
//   storage,
//   limits: { fileSize: 50 * 1024 * 1024 },
// });
