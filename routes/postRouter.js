import express from "express";
import postController from "../controllers/postController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/", postController.getAll);
router.get("/:id", postController.getById);
router.get("/user/:id", postController.getUserPosts);
router.post("/", postController.createPost);
router.patch("/:id", postController.updatePost);
router.patch("/:id/likePost", postController.likePost);
router.post("/:id/commentPost", postController.commentPost);
router.get("/:id/comments", postController.commentsByPostId);
router.delete("/:id", postController.deletePost);

export default router;
