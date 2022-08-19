import express from "express";
import postController from "../controllers/postController.js";
const router = express.Router();

router.get("/", postController.getAll);
router.get("/:id", postController.getById);

router.post("/", postController.createPost);
router.patch("/:id", postController.updatePost);
router.patch("/:id/likePost", postController.likePost);
router.patch("/:id/commentPost", postController.commentPost);
router.delete("/:id", postController.deletePost);

export default router;
