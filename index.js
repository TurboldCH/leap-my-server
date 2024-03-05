const express = require("express");
const port = 1000;
const myServer = express();
const { createNetflixEndPoints } = require("./mongodb");
const { createEndPoints } = require("./backendProject");

const { getPostData } = require("./posts");
const { getCommentsData } = require("./comment");
myServer.use(express.json());

myServer.get("/", (request, response) => {
  response.send("Hello Express Server");
});

createEndPoints(myServer);
// createNetflixEndPoints(myServer);
// getCommentsData(myServer);
// require("./users")(myServer);
// getPostData(myServer);
myServer.listen(port, () => {
  console.log("My server running");
});
