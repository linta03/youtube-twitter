import { Router } from "express";
import { uploadVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/uploadVideo").post(
  verifyJWT,
  upload.fields([
    {
      name: "youtube_video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  uploadVideo,
);

export default router;
