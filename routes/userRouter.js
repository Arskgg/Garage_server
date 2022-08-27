import express from "express";
import userController from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", userController.login);
router.post("/registration", userController.registration);
router.get("/refresh", userController.refresh);
router.post("/logout", userController.logout);

export default router;
