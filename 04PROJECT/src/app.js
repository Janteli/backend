import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
// app.use is used for middleware or configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
// for data acceptance
// for form
app.use(express.json({ limit: "16kb" }));
// for url data- without extended also works but extended accepts nested object
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// for pdf file images
app.use(express.static("public"));
// cookie
app.use(cookieParser());

// routes declaration
//*user routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likesRouter from "./routes/like.router.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
// routes declaration- route is seggregated middleware is required

app.use("/api/v1/users", userRouter);

// http://localhost:8000/api/v1/users/register

app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likesRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use('api/v1/playlist', playlistRouter)


export { app };
