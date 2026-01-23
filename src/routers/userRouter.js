import express from "express";
import userController from "../controllers/userController.js";

const router = express.Router();

router.post("/login", userController.auth);

export default router;
