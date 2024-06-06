import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createAComment,
  deleteAComment,
  getVideoComments,
  updateComment,
} from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/getVideoComments/:videoId").get(getVideoComments);
router.route("/createAComment/:videoId").post(createAComment);
router.route("/updateAComment/:commentId").patch(updateComment);
router.route("/deleteAComment/:commentId").delete(deleteAComment);

export default router;
