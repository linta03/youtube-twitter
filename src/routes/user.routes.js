import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserProfile,
  getWatchHistory,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImg,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImg",
      maxCount: 1,
    },
  ]),
  registerUser,
);
router.route("/login").post(loginUser);

//Secured Routes (that needs user logged in ==> access token and refresh token)
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refreshAccessToken").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/currentUser").get(verifyJWT, getCurrentUser);
router.route("/updateAccountDetails").patch(verifyJWT, updateAccountDetails);
router.route("/updateAvatar").patch(
  verifyJWT,
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
  ]),
  updateUserAvatar,
);
router.route("/updateCoverImg").patch(
  verifyJWT,
  upload.fields([
    {
      name: "coverImg",
      maxCount: 1,
    },
  ]),
  updateUserCoverImg,
);
router.route("/c/:userName").get(verifyJWT, getUserProfile);
router.route("/watchHistory").get(verifyJWT, getWatchHistory);

export default router;
