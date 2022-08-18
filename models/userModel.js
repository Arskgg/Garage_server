import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  posts_id: { type: [String], default: [] },
  followers: { type: [String], default: [] },
  follow: { type: [String], default: [] },
  img: String,
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const User = mongoose.model("User", userSchema);

export default User;
