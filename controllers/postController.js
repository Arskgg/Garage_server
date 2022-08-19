import ApiError from "../error/ApiError.js";
import Post from "../models/postModel.js";
import mongoose from "mongoose";

class PostController {
  async getAll(req, res) {
    let { limit, page } = req.query;

    page = page || 1;
    limit = limit || 9;
    const offSet = page * limit - limit;
    const totalPosts = await Post.countDocuments({});

    try {
      const posts = await Post.find()
        .sort({ _id: -1 })
        .limit({ limit })
        .skip(offSet);

      res.json({
        data: posts,
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
    const data = req.body;

    const newPost = new Post(data);

    try {
      await newPost.save();
      res.json(newPost);
    } catch (error) {
      res.status(500).json({ message: error.message });
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

  async likePost(req, res) {}

  async commentPost(req, res) {}

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
}

export default new PostController();
