import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()

router.route("/createTweet").post(verifyJWT , createTweet);
router.route("/getUserTweets/:userId").get(verifyJWT , getUserTweets);
router.route("/updateTweet/:tweetId").put(verifyJWT , updateTweet);
router.route("/deleteATweet/:tweetId").delete(verifyJWT , deleteTweet);


export default router