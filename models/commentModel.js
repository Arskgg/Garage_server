import mongoose from "mongoose";

export const commentModel = mongoose.Schema({
  user_id: { type: String, required: true },
  comment: { type: String, required: true },
  likes: { type: [String], default: [] },
  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Comment = mongoose.model("Comment", commentModel);

export default Comment;
