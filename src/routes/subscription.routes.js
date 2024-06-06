import { Router } from "express";
import { toggleSubsciption } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()
router.use(verifyJWT)
router.route("/toggleSubscription/:channelId").post(toggleSubsciption)


export default router