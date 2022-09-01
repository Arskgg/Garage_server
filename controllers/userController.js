import bcrypt from "bcrypt";
import ApiError from "../error/ApiError.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import UserDto from "../dtos/user_dto.js";

const generateAccessJwt = (userDto) => {
  return jwt.sign({ ...userDto }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "24h",
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

    try {
      if (!email || !password || username)
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
}

export default new UserController();
