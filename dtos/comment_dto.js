export default class CommentDto {
  id;
  user_id;
  username;
  img;
  comment;
  likes;
  createdAt;

  constructor(model) {
    this.id = model._id;
    this.user_id = model.user_id;
    this.username = model.username;
    this.img = model.img;
    this.comment = model.comment;
    this.likes = model.likes;
    this.createdAt = model.createdAt;
  }
}
