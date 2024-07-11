import { Router } from "express";
// import router from "./user.routes";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from "multer";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(verifyJWT, getAllVideos)
  .post(
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1,
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    verifyJWT,
    publishAVideo
  );

router
  .route("/:videoId")
  .get(getVideoById)
  .delete(verifyJWT,deleteVideo)
  .patch(verifyJWT,upload.single("thumbnail"), updateVideo)
  .patch(verifyJWT, togglePublishStatus)

export default router;
