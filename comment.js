const { response } = require("express");
const commentJson = require("./comments.json");
const fs = require("fs");

const getCommentsByOwner = (ownerID) => {
  const comments = commentJson.filter((comment) => {
    return comment.owner == ownerID;
  });
  if (comments) {
    return comments;
  }
  return "No Comments";
};

const getCommentsByPostID = (id) => {
  const comments = commentJson.filter((comment) => {
    return comment.postID == id;
  });
  if (comments) {
    return comments;
  }
  return "No Comments";
};
const getCommentsByUserID = (id) => {
  const comments = commentJson.filter((comment) => {
    return comment.owner == id;
  });
  if (comments) {
    return comments;
  }
  return "No Comments";
};
const getCommentsData = (myServer) => {
  myServer.get("/comments", (request, response) => {
    response.json(commentJson);
  });
  myServer.get("/post/:id/comment", (request, response) => {
    response.send(getCommentsByPostID(request.params.id));
  });
  myServer.get("/user/:id/comment", (request, response) => {
    response.send(getCommentsByUserID(request.params.id));
  });
  myServer.post("/comment/create", (request, response) => {
    const body = request.body;
    // console.log(body);
    const { content, owner, postID } = body;
    commentJson.push({
      commentID: String(
        Number(commentJson[commentJson.length - 1].commentID) + 1
      ),
      owner: owner,
      postID: postID,
      date: new Date().toLocaleDateString(),
      content: content,
    });
    fs.writeFileSync("./comments.json", JSON.stringify(commentJson));
    response.json(commentJson);
  });
};

module.exports = {
  getCommentsByPostID,
  getCommentsByUserID,
  getCommentsData,
  getCommentsByOwner,
};
