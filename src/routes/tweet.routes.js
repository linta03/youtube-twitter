import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.route("/createTweet").post(verifyJWT , createTweet);
router.route("/getUserTweets").get(verifyJWT , getUserTweets);
router.route("/updateTweet/:tweetId").put(verifyJWT , updateTweet);
router.route("/getUserTweets/:tweetId").delete(verifyJWT , getUserTweets);


export default router