import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import Comment from "../models/commentModel.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import CommentDto from "../dtos/comment_dto.js";
import ApiError from "../error/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PostController {
  async getAll(req, res) {
    let { limit, page } = req.query;

    page = page || 1;
    limit = limit || 6;
    const offSet = page * limit - limit;
    const totalPosts = await Post.countDocuments({});

    try {
      const posts = await Post.find()
        .sort({ _id: -1 })
        .limit(limit)
        .skip(offSet);

      res.json({
        posts,
        currentPage: page,
        numberOfPages: Math.ceil(totalPosts / limit),
      });
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async getById(req, res, next) {
    const { id } = req.params;

    try {
      const post = await Post.findById(id);

      res.status(200).json(post);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async createPost(req, res) {
    try {
      const data = req.body;
      let imgs = [];

      //Check is some files were send
      if (req.files) {
        const { imgs: files } = req.files;
        if (Array.isArray(files)) imgs = files;
        else imgs.push(files);
      }

      const fileNames = imgs.map((img) => uuidv4() + ".jpg");
      imgs.forEach((img, i) => {
        img.mv(path.resolve(__dirname, "..", "static", fileNames[i]));
      });

      const newPost = new Post({
        ...data,
        imgs: fileNames,
        tags: JSON.parse(data.tags),
      });

      await newPost.save();
      res.status(201).json(newPost);
    } catch (error) {
      res.status(500).json(error.message);
    }
  }

  async updatePost(req, res) {
    const { id: _id } = req.params;
    const post = req.body;

    if (!mongoose.Types.ObjectId.isValid(_id))
      return res.status(404).send("No post with that id");
    try {
      const updatedPost = await Post.findByIdAndUpdate(_id, post, {
        new: true,
      });
      res.status(200).json(updatedPost);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  }

  async getUserPosts(req, res, next) {
    const { id } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(id))
        return next(ApiError.badRequest("User doesn't exist"));

      const user = await User.findById(id);

      if (!user) return next(ApiError.badRequest("User doesn't exist"));

      const posts = await Post.find({ user_id: { $in: id } })
        .select({ carMake: 1, carModel: 1, imgs: 1 })
        .sort({
          _id: -1,
        });

      res.json(posts);
    } catch (error) {
      res.json(error);
    }
  }

  async likePost(req, res) {}

  async deletePost(req, res) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send("No post with that id");

    try {
      await Post.findByIdAndRemove(id);

      res.json({ message: "Post deleted successfuly" });
    } catch (error) {
      res.json({ message: error.message });
    }
  }

  async commentPost(req, res) {
    try {
      const { id } = req.params;
      const commentData = req.body;
      const comment = await Comment.create(commentData);

      const post = await Post.findByIdAndUpdate(
        id,
        { $push: { comments: comment._id } },
        { new: true }
      );

      res.json({ message: "Comment has been added" });
    } catch (error) {
      res.json(errror);
    }
  }

  async commentsByPostId(req, res) {
    const { id } = req.params;

    try {
      const { comments: commentsId } = await Post.findById(id).select({
        comments: 1,
        _id: 0,
      });

      const comments = await Comment.find({ _id: { $in: commentsId } }).sort({
        _id: -1,
      });

      const commentsWithUserData = await Promise.all(
        comments.map(async (comment) => {
          try {
            let user = {};

            user = await User.findById(comment.user_id).select({
              username: 1,
              img: 1,
              _id: 0,
            });

            const commentDto = new CommentDto({
              ...comment.toObject(),
              ...user.toObject(),
            });

            return commentDto;
          } catch (error) {
            console.log(error);
          }
        })
      );

      res.json(commentsWithUserData);
    } catch (error) {}
  }
}

export default new PostController();
