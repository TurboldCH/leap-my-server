const express = require("express");
const usersJson = require("./users.json");
const fs = require("fs");
const port = 1000;
const myServer = express();
myServer.use(express.json());

myServer.get("/", (request, response) => {
  response.send("Hello Express Server");
});
myServer.get("/users", (request, response) => {
  response.json(usersJson);
});
myServer.get("/users/:id", (request, response) => {
  const userID = request.params.id;
  usersJson.map((user, index) => {
    if (user.id == userID) {
      response.json(user);
    }
  });
  response.send("Doesn't exist");
});
myServer.post("/users/create", (request, response) => {
  const body = request.body;
  const { name } = body;
  usersJson.push({ id: String(usersJson.length + 1), name: name });
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
myServer.listen(port, () => {
  console.log("My server running");
});
