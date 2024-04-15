const usersJson = require("./users.json");
const postsJson = require("./posts.json");

const { getUserPost } = require("./posts");
const { getUserPostComment } = require("./posts.js");

const fs = require("fs");

module.exports = function (myServer) {
  myServer.get("/users", (request, response) => {
    const users = [];
    usersJson.map((user) => {
      let userPost = getUserPostComment();
      users.push({ ...user, posts: userPost });
    });
    response.json(users);
  });
  myServer.get("/users/:id", (request, response) => {
    const userPost = getUserPost(request.params.id);
    const userID = request.params.id;
    usersJson.map((user, index) => {
      if (user.id == userID) {
        response.json({ ...user, post: userPost });
      }
    });
    response.send("Doesn't exist");
  });
  myServer.post("/users/create", (request, response) => {
    const body = request.body;
    const { name } = body;
    usersJson.push({
      id: String(Number(usersJson[usersJson.length - 1].id) + 1),
      name: name,
    });
    fs.writeFileSync("./users.json", JSON.stringify(usersJson));
    response.json(usersJson);
  });

  myServer.put("/users/:id", (request, response) => {
    const userID = request.params.id;
    const body = request.body;
    const { name } = body;
    usersJson.map((user, index) => {
      if (user.id === userID) {
        user.name = name;
      }
    });
    fs.writeFileSync("./users.json", JSON.stringify(usersJson));
    response.json(usersJson);
  });

  myServer.delete("/users/:id", (request, response) => {
    const userID = request.params.id;
    var deleted = usersJson.filter((user) => user.id !== userID);
    fs.writeFileSync("./users.json", JSON.stringify(deleted));
    response.json(deleted);
  });
};
