import { Router } from "express";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubsciption,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);
router.route("/toggleSubscription/:channelId").post(toggleSubsciption);
router
  .route("/getChannelSubscribers/:channelId")
  .get(getUserChannelSubscribers);
router.route("/getSubscribedTo/:subscriberId").get(getSubscribedChannels);

export default router;
