export default class UserDto {
  id;
  email;
  username;
  followers;
  follow;
  img;

  constructor(model) {
    this.id = model._id;
    this.email = model.email;
    this.username = model.username;
    this.followers = model.followers;
    this.follow = model.follow;
    this.img = model.img;
  }
}
