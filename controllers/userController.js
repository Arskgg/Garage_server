import bcrypt from "bcrypt";
import ApiError from "../error/ApiError.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const generateAccessJwt = (id, email, username) => {
  return jwt.sign({ id, email, username }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "12h",
  });
};

const generateRefreshJwt = (id, email, username) => {
  return jwt.sign({ id, email, username }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "14d",
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

      const token = generateAccessJwt(user._id, user.email, user.username);

      const refreshToken = generateRefreshJwt(
        user._id,
        user.email,
        user.username
      );

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      res.json({ token });
    } catch (error) {
      console.log({ message: error.message });
    }
  }

  async registration(req, res, next) {
    const { email, password, username } = req.body;

    try {
      if (!email || !password)
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

      const token = generateAccessJwt(user._id, user.email, user.username);

      const refreshToken = generateRefreshJwt(
        user._id,
        user.email,
        user.username
      );

      res.cookie("jwt", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      res.json({ token });
    } catch (error) {
      console.log({ message: error.message });
    }
  }

  async refresh(req, res, next) {
    const { cookies } = req;

    if (!cookies?.jwt) return next(ApiError.badRequest("Unauthorized"));

    const refreshToken = cookies.jwt;

    const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const token = generateAccessJwt(decode);

    res.json({ token });
  }

  logout(req, res) {
    const { cookies } = req;
    if (!cookies?.jwt) return res.sendStatus(204);
    res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });
    res.json({ message: "Cookie cleared" });
  }
}

export default new UserController();
