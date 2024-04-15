const { response } = require("express");
const postsJson = require("./posts.json");
const usersJson = require("./users.json");
const { getCommentsByPostID } = require("./comment.js");
const fs = require("fs");

const getUserPost = (id) => {
  return postsJson.filter((post) => post.owner == id);
};

const getUserPostComment = () => {
  const posts = [];
  postsJson.map((post) => {
    let postComment = getCommentsByPostID(post.id);
    posts.push({ ...post, comment: postComment });
  });
  return posts;
};

const getPostData = (myServer) => {
  myServer.get("/posts", (request, response) => {
    const posts = getUserPostComment();
    response.json(posts);
  });

  myServer.get("/users/:id/posts", (request, response) => {
    response.send(getUserPost(request.params.id));
  });

  myServer.get("/posts/:id", (request, response) => {
    const postID = request.params.id;
    postsJson.map((post, index) => {
      if (post.id == postID) {
        response.send(post);
      }
    });
  });

  myServer.post("/posts/create", (request, response) => {
    const body = request.body;
    // console.log(body);
    const { text, likes, owner } = body;
    postsJson.push({
      id: String(Number(postsJson[postsJson.length - 1].id) + 1),
      text: text,
      likes: likes,
      createdAt: new Date().toLocaleDateString(),
      owner: owner,
    });
    fs.writeFileSync("./posts.json", JSON.stringify(postsJson));
    response.json(postsJson);
  });
  myServer.put("/posts/:id", (request, response) => {
    const postID = request.params.id;
    const body = request.body;
    const { text, likes } = body;
    postsJson.map((post, index) => {
      if (post.id === postID) {
        post.text = text;
        post.likes = likes;
        createdAt = new Date().toLocaleDateString();
      }
    });
    fs.writeFileSync("./posts.json", JSON.stringify(postsJson));
    response.json(postsJson);
  });
  myServer.delete("/posts/:id", (request, response) => {
    const postID = request.params.id;
    var deleted = postsJson.filter((post) => post.id !== postID);
    fs.writeFileSync("./posts.json", JSON.stringify(deleted));
    // response.send("ID of deleted post: ", postID);
    response.json(deleted);
  });
};

module.exports = { getUserPost, getPostData, getUserPostComment };
