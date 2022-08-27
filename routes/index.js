import express from "express";
import userRouter from "./userRouter.js";
import postRouter from "./postRouter.js";

const router = express.Router();

router.use("/user", userRouter);
router.use("/posts", postRouter);

export default router;
