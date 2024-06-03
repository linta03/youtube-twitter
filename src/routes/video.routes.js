import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  togglePublishStatus,
  updateVideoDetails,
  updateVideoThumbnail,
  uploadVideo,
} from "../controllers/video.controller.js";
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
router.route("/getAllVideos").get(verifyJWT, getAllVideos);
router.route("/getVideoById/:videoId").get(verifyJWT, getVideoById);
router
  .route("/updateVideoDetails/:videoId")
  .patch(verifyJWT, updateVideoDetails);
router
  .route("/updateVideoThumbnail/:videoId")
  .patch(
    verifyJWT,
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    updateVideoThumbnail,
  );
router.route("/deleteVideo/:videoId").delete(verifyJWT, deleteVideo);
router
  .route("/togglePublishStatus/:videoId")
  .patch(verifyJWT, togglePublishStatus);

export default router;
