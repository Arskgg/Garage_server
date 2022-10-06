import Comment from "../models/commentModel.js";
import Post from "../models/postModel.js";

class CommentController {
  async commentPost(req, res) {
    try {
      const { id } = req.params;
      const commentData = req.body;
      const comment = await Comment.create(commentData);

      await Post.findByIdAndUpdate(id, { $push: { comments: comment._id } });

      res.json({ message: "Comment has been added" });
    } catch (error) {
      res.json(error);
    }
  }

  async commentsByPostId(req, res) {
    const { id } = req.params;

    try {
      const { comments: commentsIds } = await Post.findById(id).select({
        comments: 1,
        _id: 0,
      });

      const comments = await Comment.find({ _id: { $in: commentsIds } })
        .populate("user_id", "_id username img")
        .select("-__v");

      res.json(comments);
    } catch (error) {}
  }
}

export default new CommentController();
