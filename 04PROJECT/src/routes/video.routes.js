import { Router } from "express";
// import router from "./user.routes";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middleware";
import { publishAVideo } from "../controllers/video.controller";

const router = Router()

router
.route("/")
// .get(getAllVideos)
.post(
    upload.fields([
        {
            name: "videoFile",
            maxCount:1,
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
)

export default router;