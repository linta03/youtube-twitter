import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createAComment, getVideoComments } from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/getVideoComments/:videoId").get(getVideoComments);
router.route("/createAComment/:videoId").post(createAComment);

export default router;
