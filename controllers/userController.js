import bcrypt from "bcrypt";
import ApiError from "../error/ApiError.js";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

const generateJwt = (id, email, username) => {
  return jwt.sign({ id, email, username }, process.env.SECRET_KEY, {
    expiresIn: "12h",
  });
};

class UserController {
  async login(req, res, next) {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) return next(ApiError.badRequest("User doesn't exist"));

      const copmarePassword = await bcrypt.compare(password, user.password);

      if (!copmarePassword)
        return next(ApiError.badRequest("Invalid password"));

      const token = generateJwt(user._id, user.email, user.username);

      res.json({ token });
    } catch (error) {
      console.log({ message: error.message });
    }
  }

  async registration(req, res, next) {
    const { email, password, username } = req.body;

    try {
      if (!email || !password)
        return next(ApiError.badRequest("Invalid email or password"));

      const existingUser = await User.findOne({ email });

      if (existingUser)
        return next(ApiError.badRequest("User with this email already exists"));

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        email,
        password: hashedPassword,
        username,
      });

      const token = generateJwt(user._id, user.email, user.username);

      res.json({ token });
    } catch (error) {
      console.log({ message: error.message });
    }
  }

  async authCheck(req, res) {
    const token = generateJwt(req.user._id, req.user.email, req.user.username);
  }
}

export default new UserController();
