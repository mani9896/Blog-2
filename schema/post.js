const postSchema = {
  name: String,
  title: String,
  content: String,
  img: {
    data: Buffer,
    contentType: String,
  },
  height: String,
  width: String,
};
module.exports = postSchema;
