import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controller.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in the file

router.route("/:videoId")
.get(getVideoComments)
.post(addComment)
router.route("/cmt/:commentId").delete(deleteComment).patch(updateComment)

export default router;  