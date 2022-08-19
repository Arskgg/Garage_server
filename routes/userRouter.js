import express from "express";
import userController from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", userController.login);
router.post("/registration", userController.registration);
router.get("/auth", authMiddleware, userController.authCheck);

export default router;
