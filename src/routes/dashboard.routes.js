import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js";


const router = Router();

router.route("/getChannelStats/:userId").get(getChannelStats);
router.route("/getChannelVideos/:userId").get(getChannelVideos);


export default router