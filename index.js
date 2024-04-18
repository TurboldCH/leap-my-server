const express = require("express");
const { expressjwt } = require("express-jwt");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const port = 3001;
const myServer = express();
const cors = require("cors");
// const { createNetflixEndPoints } = require("./mongodb");
const { createEndPoints } = require("./backendProject");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const ALGORITHM = process.env.ALGORITHM;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL = process.env.EMAIL;
const HOST = process.env.HOST;
const PORT = process.env.PORT;
myServer.use(express.json());
myServer.use(cors());
const { client } = require("./mongodb");
const { ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: HOST,
  port: PORT,
  secure: true,
  auth: {
    user: EMAIL,
    pass: EMAIL_PASS,
  },
});

myServer.post("/forgot-password-email", async (req, res) => {
  await client.connect();
  const { email } = req.body;

  const collection = await client.db("ecommerceProducts").collection("users");
  const findDocument = await collection.findOne({ email: email });
  if (!findDocument) {
    res.status(400).json("User doesn't exist");
  } else {
    const token = jwt.sign({ id: findDocument._id }, JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: "5m",
    });
    const hashToken = await bcrypt.hash(token, 10);
    const tokenCollection = await client
      .db("ecommerceProducts")
      .collection("tokens");
    tokenCollection.deleteMany({ _id: findDocument._id });
    tokenCollection.insertOne({ _id: findDocument._id, token: hashToken });
    const resetLink = `http://localhost:3000/reset-password?token=${hashToken}&id=${findDocument._id}`;

    const mailOptions = {
      from: EMAIL,
      to: email,
      subject: "Password Reset",
      text: `To reset your password, click on the following link: ${resetLink}`,
    };
    await transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log("ERROR SENDING EMAIL:", error);
        return res.status(500).json({ message: "FAILED TO SEND RESET MAIL" });
      }
      console.log("RESET EMAIL SENT:", info.response);
      res.status(200).json(info.response);
    });
  }
});
myServer.post("/reset-password-email", async (req, res) => {
  const { token, newPassword } = req.body;

  const tokenCollection = await client
    .db("ecommerceProducts")
    .collection("tokens");
  const findDocument = tokenCollection.findOne({
    token: token,
  });
  if (findDocument) {
    const userCollection = await client
      .db("ecommerceProducts")
      .collection("users");
    const filter = { _id: new ObjectId(String(findDocument._id)) };
    const operation = { $set: {} };
    const hashPass = await bcrypt.hash(newPassword, 10);
    operation.$set["password"] = hashPass;
    const updated = await userCollection.updateOne(filter, operation, {
      upsert: true,
    });
    tokenCollection.deleteOne();
    response.status(200).json("Password Reset Successfully");
  } else {
    response.status(401).json("Invalid Token");
  }
});
myServer.get("/", (req, res) => {
  res.status(200).json("Working");
});
myServer.get("/getToken", (request, response) => {
  response.send(
    jwt.sign({ email: "testing@gmail.com" }, JWT_SECRET, {
      algorithm: ALGORITHM,
      expiresIn: "60s",
    })
  );
});
myServer.get(
  "/protected",
  expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
  (req, res) => {
    // if (!req.auth.admin) return res.sendStatus(401);
    res.status(200);
  }
);

myServer.post("/register", async (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) {
    response.send("Email and password are missing");
  } else {
    try {
      await client.connect();
      const collection = await client
        .db("ecommerceProducts")
        .collection("users");
      const findDocument = await collection.findOne({
        email: email,
      });
      if (findDocument) {
        response.status(401).json({ message: "User Already Exists" });
      } else {
        const hashPass = await bcrypt.hash(password, 10);
        collection.insertOne({ email: email, password: hashPass });
        const token = jwt.sign({ email: email }, JWT_SECRET, {
          algorithm: "HS256",
          expiresIn: "1hs",
        });
        const refreshToken = jwt.sign({ email: email }, JWT_SECRET, {
          algorithm: ALGORITHM,
        });
        response.status(200).json({ token, refreshToken });
      }
    } catch (error) {
      response.send(error.message);
    }
  }
});
myServer.post("/login", async (request, response) => {
  const { email, password } = request.body;
  if (!email || !password) {
    response.send("Email and password are missing");
  } else {
    try {
      await client.connect();
      const collection = await client
        .db("ecommerceProducts")
        .collection("users");
      const findDocument = await collection.findOne({
        email: email,
      });
      if (!findDocument) {
        response.status(401).json({ message: "Cannot find user" });
        return;
      } else {
        const validPassword = await bcrypt.compare(
          password,
          findDocument.password
        );
        if (!validPassword) {
          response.status(401).json({ message: "Incorrect Password" });
          return;
        }
        const token = jwt.sign({ _id: String(findDocument._id) }, JWT_SECRET, {
          algorithm: ALGORITHM,
          expiresIn: "1h",
        });
        const refreshToken = jwt.sign(
          { _id: String(findDocument._id) },
          JWT_SECRET,
          {
            algorithm: ALGORITHM,
          }
        );
        response.status(200).json({ token, refreshToken });
      }
    } catch (error) {
      response.status(500).json(error.message);
    }
  }
});
myServer.post("/refresh", async (request, response) => {
  const refreshToken = request.body.token;
  if (!refreshToken) {
    return response.status(401).json({ message: "Invalid Token" });
  }
  const docID = jwt.decode(refreshToken)._id;
  await client.connect();
  const collection = await client.db("ecommerceProducts").collection("users");
  const findDocument = await collection.findOne({
    _id: new ObjectId(docID),
  });
  jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
    if (err) {
      return response.status(401).json({ message: "Unauthorized user" });
    }
    const accessToken = jwt.sign(
      { _id: String(findDocument._id) },
      JWT_SECRET,
      { algorithm: ALGORITHM, expiresIn: "1h" }
    );
    response.status(200).json(accessToken);
  });
});
myServer.post("/forgot-password", async (request, response) => {
  const email = request.body.email;
  await client.connect();
  const collection = await client.db("ecommerceProducts").collection("users");
  const findDocument = await collection.findOne({ email: email });
  if (!findDocument) {
    return response.status(401).json({ message: "User doesn't exist" });
  }
  const userID = findDocument._id;
  const tokenCollection = await client
    .db("ecommerceProducts")
    .collection("tokens");
  const token = jwt.sign({ id: userID }, JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "5m",
  });
  const hashToken = await bcrypt.hash(token, 10);
  tokenCollection.insertOne({
    _id: userID,
    token: hashToken,
    date: new Date(),
  });
  const resetLink = `/reset-password?token=${hashToken}&id=${userID}`;
  response.status(200).json(resetLink);
});
myServer.post("/reset-password/:userID", async (request, response) => {
  const userID = request.params.userID;
  const resetPassword = request.body.resetPassword;
  const token = request.body.token;
  await client.connect();
  const tokenCollection = await client
    .db("ecommerceProducts")
    .collection("tokens");
  const findDocument = await tokenCollection.findOne({
    _id: new ObjectId(String(userID)),
  });
  if (findDocument) {
    const userCollection = await client
      .db("ecommerceProducts")
      .collection("users");
    const filter = { _id: new ObjectId(String(userID)) };
    const operation = { $set: {} };
    const hashPass = await bcrypt.hash(resetPassword, 10);
    operation.$set["password"] = hashPass;
    const updated = await userCollection.updateOne(filter, operation, {
      upsert: true,
    });
    tokenCollection.deleteOne();
    response.status(200).json("Password Reset Successfully");
  } else {
    response.status(401).json("Invalid Token");
  }
});

createEndPoints(myServer);
myServer.listen(port, () => {
  console.log("My server running on port", port);
});
module.exports = { JWT_SECRET, ALGORITHM };
