import express from "express";
import userController from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/login", userController.login);
router.post("/registration", userController.registration);
router.get("/refresh", userController.refresh);
router.get("/logout", userController.logout);
router.patch("/follow/:id", userController.followUser);
router.get("/followers/:id", userController.getUserFollowers);
router.get("/following/:id", userController.getUserFollowing);
router.get("/:id", userController.getUser);
router.patch("/update/:id", userController.updateUser);

export default router;
