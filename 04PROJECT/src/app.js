import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express();
// app.use is used for middleware or configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
// for data acceptance
// for form
app.use(express.json({limit: "16kb"}))
// for url data- without extended also works but extended accepts nested object
app.use(express.urlencoded({extended: true, limit: "16kb"}))
// for pdf file images
app.use(express.static("public"))
// cookie
app.use(cookieParser())


export { app };
