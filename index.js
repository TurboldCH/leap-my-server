const express = require("express");
const port = 1000;
const myServer = express();

const { getPostData } = require("./posts");
const { getCommentsData } = require("./comment");
myServer.use(express.json());

myServer.get("/", (request, response) => {
  response.send("Hello Express Server");
});

getCommentsData(myServer);
require("./users")(myServer);
getPostData(myServer);
myServer.listen(port, () => {
  console.log("My server running");
});
