import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router()

// routing from app
 router.route("/register").post(registerUser)

// http://localhost:8000/api/v1/users/register


export default router