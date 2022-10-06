import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import ApiError from "../error/ApiError.js";
import sharp from "sharp";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PostController {
  async getAll(req, res) {
    let { limit, page, search } = req.query;

    page = page || 1;
    limit = limit || 6;
    const offSet = page * limit - limit;
    const totalPosts = await Post.countDocuments({});

    try {
      if (search) {
        const searchInsensitive = new RegExp(search, "i");

        const posts = await Post.find({
          $or: [
            { carMake: searchInsensitive },
            { carModel: searchInsensitive },
            { tags: { $in: searchInsensitive } },
          ],
        })
          .populate("user_id", "_id username img")
          .select("-__v");

        return res.json({
          posts,
          currentPage: page,
          numberOfPages: Math.ceil(totalPosts / limit),
        });
      }

      const posts = await Post.find()
        .populate("user_id", "_id username img")
        .select("-__v")
        .sort({ _id: -1 });
      // .limit(limit)
      // .skip(offSet);

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
        sharp(img.data)
          .jpeg({ chromaSubsampling: "4:4:4" })
          .resize(1740, null, { withoutEnlargement: true })
          .toFile(path.resolve(__dirname, "..", "static", fileNames[i]));
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
    const { id } = req.params;
    const updatedPostData = req.body;
    let imgs = [];

    try {
      const oldPost = await Post.findById(id);

      if (req.files) {
        const { imgs: files } = req.files;
        if (Array.isArray(files)) imgs = files;
        else imgs.push(files);

        const fileNames = imgs.map((img) => uuidv4() + ".jpg");

        imgs.forEach((img, i) => {
          sharp(img.data)
            .jpeg()
            .resize(1740, null, { withoutEnlargement: true })
            .toFile(path.resolve(__dirname, "..", "static", fileNames[i]));
        });

        oldPost.imgs.forEach((img) =>
          fs.unlinkSync(path.resolve(__dirname, "..", "static", img))
        );

        const updatedPost = await Post.findByIdAndUpdate(id, {
          ...updatedPostData,
          imgs: fileNames,
          tags: JSON.parse(updatedPostData.tags),
        });

        return res.json(updatedPost);
      }

      const deletedImages = oldPost.imgs.filter(
        (img) => !updatedPostData.imgs.includes(img)
      );

      deletedImages.forEach((img) =>
        fs.unlinkSync(path.resolve(__dirname, "..", "static", img))
      );

      const updatedPost = await Post.findByIdAndUpdate(id, {
        ...updatedPostData,
        tags: JSON.parse(updatedPostData.tags),
      });

      return res.json(updatedPost);
    } catch (error) {
      res.json(error);
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
        .select({ carMake: 1, carModel: 1, imgs: 1, user_id: 1 })
        .sort({
          _id: -1,
        });

      res.json(posts);
    } catch (error) {
      res.json(error);
    }
  }

  async deletePost(req, res) {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(404).send("No post with that id");

    try {
      const { imgs: postImgs } = await Post.findById(id).select({
        imgs: 1,
        _id: 0,
      });

      await Post.findByIdAndRemove(id);

      postImgs.forEach((img) =>
        fs.unlinkSync(path.resolve(__dirname, "..", "static", img))
      );

      res.json({ message: "Post deleted successfuly" });
    } catch (error) {
      res.json({ message: error.message });
    }
  }

  async likePost(req, res) {}
}

export default new PostController();
