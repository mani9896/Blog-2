//jshint esversion:6

const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const socketio = require("socket.io");
const bcrypt = require("bcryptjs");
const postSchema = require("./schema/post");
require("dotenv/config");
const homeStartingContent =
  "Lacus vel facilisis volutpat est velit egestas dui id ornare. Semper auctor neque vitae tempus quam. Sit amet cursus sit amet dictum sit amet justo. Viverra tellus in hac habitasse. Imperdiet proin fermentum leo vel orci porta. Donec ultrices tincidunt arcu non sodales neque sodales ut. Mattis molestie a iaculis at erat pellentesque adipiscing. Magnis dis parturient montes nascetur ridiculus mus mauris vitae ultricies. Adipiscing elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices vitae auctor eu augue ut lectus arcu bibendum at. Odio euismod lacinia at quis risus sed vulputate odio ut. Cursus mattis molestie a iaculis at erat pellentesque adipiscing.";
const aboutContent =
  "Hac habitasse platea dictumst vestibulum rhoncus est pellentesque. Dictumst vestibulum rhoncus est pellentesque elit ullamcorper. Non diam phasellus vestibulum lorem sed. Platea dictumst quisque sagittis purus sit. Egestas sed sed risus pretium quam vulputate dignissim suspendisse. Mauris in aliquam sem fringilla. Semper risus in hendrerit gravida rutrum quisque non tellus orci. Amet massa vitae tortor condimentum lacinia quis vel eros. Enim ut tellus elementum sagittis vitae. Mauris ultrices eros in cursus turpis massa tincidunt dui.";
const contactContent =
  "Scelerisque eleifend donec pretium vulputate sapien. Rhoncus urna neque viverra justo nec ultrices. Arcu dui vivamus arcu felis bibendum. Consectetur adipiscing elit duis tristique. Risus viverra adipiscing at in tellus integer feugiat. Sapien nec sagittis aliquam malesuada bibendum arcu vitae. Consequat interdum varius sit amet mattis. Iaculis nunc sed augue lacus. Interdum posuere lorem ipsum dolor sit amet consectetur adipiscing elit. Pulvinar elementum integer enim neque. Ultrices gravida dictum fusce ut placerat orci nulla. Mauris in aliquam sem fringilla ut morbi tincidunt. Tortor posuere ac ut consequat semper viverra nam libero.";
const app = express();
const server = http.createServer(app);
const io = socketio(server);
var isLogged = false;
app.set("view engine", "ejs");
var userName = "";
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const userSchema = require("./schema/user");

mongoose.connect("mongodb://localhost:27017/blogDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

var upload = multer({ storage: storage });

const Post = mongoose.model("Post", postSchema);

const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  Post.find({}, function (err, posts) {
    res.render("home", {
      startingContent: homeStartingContent,
      posts: posts,
      isLogged: isLogged,
    });
  });
});

app.get("/compose", function (req, res) {
  if (isLogged) {
    res.render("compose", { isLogged: isLogged });
  } else {
    res.render("LogIn", { isLogged: isLogged });
  }
});
app.post("/compose", upload.single("image"), (req, res, next) => {
  var obj = {
    name: req.body.name,
    title: req.body.postTitle,
    content: req.body.postBody,
    img: {
      data: fs.readFileSync(
        path.join(__dirname + "/uploads/" + req.file.filename)
      ),
      contentType: "image/png",
    },
    width: req.body.width + "px",
    height: req.body.height + "px",
  };
  Post.create(obj, (err, item) => {
    if (err) {
      console.log(err);
    } else {
      // item.save();
      res.redirect("/");
    }
  });
});

app.get("/posts/:postId", function (req, res) {
  const requestedPostId = req.params.postId;

  Post.findOne({ _id: requestedPostId }, function (err, post) {
    res.render("post", {
      name: post.name,
      title: post.title,
      content: post.content,
      image: post.img,
      height: post.height,
      width: post.width,
      isLogged: isLogged,
    });
  });
});

app.get("/about", function (req, res) {
  res.render("about", { aboutContent: aboutContent, isLogged: isLogged });
});

app.get("/contact", function (req, res) {
  res.render("contact", { contactContent: contactContent, isLogged: isLogged });
});
app.get("/LogIn", function (req, res) {
  res.render("LogIn", { isLogged: isLogged });
});
app.get("/LogOut", function (req, res) {
  isLogged = false;
  res.redirect("/");
});
app.get("/sign-up", function (req, res) {
  res.render("sign-up", { isLogged: isLogged });
});
app.post("/sign-up", async (req, res) => {
  const new_user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });
  const salt = await bcrypt.genSalt(10);
  new_user.password = await bcrypt.hash(req.body.password, salt);

  new_user.save(function (err) {
    if (!err) {
      res.redirect("/LogIn");
    } else {
      console.log(err);
    }
  });
});
app.post("/LogIn", function (req, res) {
  const email = req.body.email;
  const password = req.body.password;
  User.findOne({ email: email }, async (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      if (user == null) {
        res.redirect("/");
      } else {
        var isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          isLogged = true;
          userName = user.name;
          res.redirect("/compose");
        } else {
          res.redirect("/LogIn");
        }
      }
    }
  });
});
io.on("connection", function (socket) {
  socket.on("add", function () {
    io.emit("image");
  });
  console.log("Connected socket");
});

server.listen(3000, function (req, res) {
  console.log("running");
});
