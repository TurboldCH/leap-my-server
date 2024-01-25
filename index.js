const express = require("express");

const port = 1000;
const myServer = express();

myServer.get("/", (request, response) => {
  response.send("Hello Express Server");
});

myServer.listen(port, () => {
  console.log("My server running");
});
