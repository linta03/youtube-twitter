import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlayList,
} from "../controllers/playList.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);
router.route("/createPlaylist").post(createPlaylist);
router.route("/updatePlaylist/:playlistId").patch(updatePlayList);
router.route("/deletePlayList/:playlistId").delete(deletePlaylist);
router
  .route("/addVideoToPlaylist/:playlistId/:videoId")
  .patch(addVideoToPlaylist);
router
  .route("/removeVideoFromPlaylist/:playlistId/:videoId")
  .patch(removeVideoFromPlaylist);
router.route("/getPlayListById/:playlistId").get(getPlaylistById);
router.route("/getAllPlaylistsOfUser/:userId").get(getUserPlaylists);

export default router;
