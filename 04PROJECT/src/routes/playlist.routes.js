import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addVideoToPlaylist, deletePlaylist, getPlaylistById, getUserPlaylists, removeVideoFromPlaylist,getUserPlaylistsByUsername, createPlaylist, getCurrentPlaylist, togglePlaylistAccess } from "../controllers/playlist.controller.js";


const router = Router()
router.use(verifyJWT)

router.route("/").post(createPlaylist)

router.route("/:playlistId")
.get(getPlaylistById)
.patch(getPlaylistById)
.delete(deletePlaylist)

router.route("/u/:ownerUsername").get(getUserPlaylistsByUsername)
router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)
router.route("/owner/playlists").get(getCurrentPlaylist)
router.route("/user/:userId").get(getUserPlaylists)
router.route("/toggle/:userId/:playlistId").patch(togglePlaylistAccess)
export default router;