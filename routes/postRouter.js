import express from "express";
import commentController from "../controllers/commentController.js";
import postController from "../controllers/postController.js";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();

router.get("/", postController.getAll);
router.get("/:id", postController.getById);
router.get("/user/:id", postController.getUserPosts);
router.post("/", postController.createPost);
router.patch("/:id", postController.updatePost);
router.patch("/:id/likePost", postController.likePost);
router.get("/:id/comments", commentController.commentsByPostId);
router.post("/:id/commentPost", commentController.commentPost);
router.delete("/:id", postController.deletePost);

export default router;
