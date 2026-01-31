import { Router } from "express";
import multer from "multer";
import { uploadResume } from "../controllers/resume.controller.js";

const router = Router();
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});

router.post("/upload", upload.single("resume"), uploadResume);

export default router;
