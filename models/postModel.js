import mongoose from "mongoose";

const postModel = mongoose.Schema({
  user_id: String,
  carMake: String,
  carModel: String,
  type: String,
  year: String,
  engine: String,
  hp: String,
  transmission: String,
  topSpeed: String,
  acceleration: String,
  description: String,
  imgs: { type: [String], default: [] },
  tags: { type: [String], default: [] },
  comments: { type: [{ user: String, comment: String }], default: [] },
  likes: { type: [String], default: [] },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Post = mongoose.model("Post", postModel);

export default Post;
