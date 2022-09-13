import bcrypt from "bcrypt";
import ApiError from "../error/ApiError.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import UserDto from "../dtos/user_dto.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from "fs";

const generateAccessJwt = (userDto) => {
  return jwt.sign({ ...userDto }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30m",
  });
};

const generateRefreshJwt = (userDto) => {
  return jwt.sign({ ...userDto }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "60d",
  });
};

class UserController {
  async login(req, res, next) {
    const { email, password } = req.body;

    try {
      if (!email || !password)
        return next(ApiError.badRequest("All fields are required"));

      const user = await User.findOne({ email });

      if (!user) return next(ApiError.badRequest("User doesn't exist"));

      const matchPassword = await bcrypt.compare(password, user.password);

      if (!matchPassword) return next(ApiError.badRequest("Invalid data"));

      const userDto = new UserDto(user);

      const token = generateAccessJwt(userDto);

      const refreshToken = generateRefreshJwt(userDto);

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      res.json({ token });
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  async registration(req, res, next) {
    const { email, password, username } = req.body;
    console.log(req.body);

    try {
      if (!email || !password || !username)
        return next(ApiError.badRequest("All fields are required"));

      const existingUser = await User.findOne({ email });

      if (existingUser)
        return next(ApiError.badRequest("User with this email already exists"));

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password: hashedPassword,
        username,
      });

      const userDto = new UserDto(user);

      const token = generateAccessJwt(userDto);

      const refreshToken = generateRefreshJwt(userDto);

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      res.json({ token });
    } catch (error) {
      return next(ApiError.internal(error.message));
    }
  }

  async refresh(req, res, next) {
    const { cookies } = req;

    try {
      if (!cookies?.jwt) return next(ApiError.unauthorized("Unauthorized"));

      const refreshToken = cookies.jwt;

      const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

      const user = await User.findById(decode.id);

      const userDto = new UserDto(user);

      const token = generateAccessJwt(userDto);

      res.json({ token, user: userDto });
    } catch (error) {
      next(ApiError.unauthorized(error));
    }
  }

  logout(req, res) {
    const { cookies } = req;
    if (!cookies?.jwt) return res.sendStatus(204);
    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });
    res.json({ message: "Cookie cleared" });
  }

  async getUser(req, res, next) {
    const { id } = req.params;

    try {
      const user = await User.findById(id);

      if (!user) {
        return next(ApiError.badRequest("User doesn't exist"));
      }

      const userDto = new UserDto(user);

      res.json(userDto);
    } catch (error) {
      return next(ApiError.badRequest("User doesn't exist"));
    }
  }

  async updateUser(req, res, next) {
    const { id } = req.params;

    const { img } = req.files;

    try {
      const filename = uuidv4() + ".jpg";
      img.mv(path.resolve(__dirname, "..", "static", filename));

      const newUser = await User.findByIdAndUpdate(
        id,
        { img: filename },
        { new: true }
      );

      res.json(newUser);
    } catch (error) {
      res.json(error);
    }
  }

  async followUser(req, res, next) {
    const { id } = req.params;
    const { followerId } = req.body;
    let isFollowing = true;

    try {
      const user = await User.findById(id);
      const followUser = await User.findById(followerId);

      if (!user) {
        return next(
          ApiError.badRequest("User that you want to follow doesn't exist")
        );
      }

      if (!followUser) {
        return next(
          ApiError.badRequest("User that want to follow doesn't exist")
        );
      }

      const indexUser = user.followers.findIndex((id) => id === followerId);

      if (indexUser === -1) {
        user.followers.push(followerId);
        followUser.follow.push(id);
      } else {
        user.followers = user.followers.filter((id) => id !== followerId);
        followUser.follow = followUser.follow.filter(
          (followerId) => followerId !== id
        );
        isFollowing = false;
      }

      const updatedUser = await User.findByIdAndUpdate(id, user, { new: true });
      const updatedFollower = await User.findByIdAndUpdate(
        followerId,
        followUser,
        { new: true }
      );

      res.json({
        message: isFollowing
          ? "Follow was successful"
          : "Unfollow was successful",
      });
    } catch (error) {
      res.json(error);
    }
  }

  async getUserFollowers(req, res, next) {
    const { id } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(ApiError.badRequest("User doesn't exist"));
      }

      const user = await User.findById(id);

      if (!user) {
        return next(ApiError.badRequest("User doesn't exist"));
      }

      const followers = await User.find({
        _id: { $in: user.followers },
      }).select({ username: 1, img: 1 });

      res.json(followers);
    } catch (error) {
      res.json(error);
    }
  }

  async getUserFollowing(req, res, next) {
    const { id } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(ApiError.badRequest("User doesn't exist"));
      }

      const user = await User.findById(id);

      if (!user) {
        return next(ApiError.badRequest("User doesn't exist"));
      }

      const following = await User.find({
        _id: { $in: user.follow },
      }).select({ username: 1, img: 1 });

      res.json(following);
    } catch (error) {
      res.json(error);
    }
  }
}

export default new UserController();
