const { response } = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const uri = process.env.MONGO_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const getCollection = async (dbName, collection) => {
  return await client.db(dbName).collection(collection);
};

const run = async () => {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
    const airbnbCollection = await getCollection("sample_mflix", "sessions");
    const allValues = await airbnbCollection.find().toArray();
  } finally {
    await client.close();
  }
};
run().catch(console.dir);

const createNetflixEndPoints = (myServer) => {
  myServer.get("/netflix/session", async (request, response) => {
    await client.connect();
    const sessionsCollection = await getCollection("sample_mflix", "sessions");
    const allValues = await sessionsCollection.find().toArray();
    response.json(allValues);
  });

  myServer.get("/netflix/movies/:id", async (request, response) => {
    await client.connect();
    const movieID = request.params.id;
    const commentCollection = await getCollection("sample_mflix", "comments");
    const movieCollection = await getCollection("sample_mflix", "movies");
    const movieValues = await movieCollection
      .find({ _id: new ObjectId(String(movieID)) })
      .toArray();
    const commentValues = await commentCollection
      .find({
        movie_id: new ObjectId(String(movieID)),
      })
      .toArray();
    response.json({ ...movieValues[0], comments: commentValues });
  });
  myServer.delete("/netflix/movies/:id", async (request, response) => {
    await client.connect();
    const movieID = request.params.id;
    const movieCollection = await getCollection("sample_mflix", "movies");
    const commentCollection = await getCollection("sample_mflix", "comments");
    const deletedMovie = await movieCollection.deleteOne({
      _id: new ObjectId(String(movieID)),
    });
    const deletedComments = await commentCollection.deleteMany({
      movie_id: new ObjectId(String(movieID)),
    });
    response.json({
      DeletedMovie: deletedMovie,
      DeletedComments: deletedComments,
    });
  });
  myServer.post("/netflix/create", async (request, response) => {
    await client.connect();
    const body = request.body;
    const {
      plot,
      genre,
      runtime,
      cast,
      num_mflix_comments,
      title,
      fullplot,
      languages,
      released,
      directors,
      writers,
      lastupdated,
      year,
      imdb,
      countries,
      type,
      tomatoes,
    } = body;
    const params = {
      plot: plot,
      runtime: runtime,
      cast: cast,
      num_mflix_comments: num_mflix_comments,
      fullplot: fullplot,
      languages: languages,
      released: released,
      directors: directors,
      lastupdated: lastupdated,
      imdb: imdb,
      countries: countries,
      tomatoes: tomatoes,
      year: year,
      genre: genre,
      title: title,
      type: type,
      writers: writers,
    };
    let missingFields = Object.keys(params).filter((value) => {
      return !Object.keys(body).includes(value);
    });
    try {
      const movieCollection = await getCollection("sample_mflix", "movies");
      if (missingFields.length > 0) {
        throw new Error(`${missingFields.join(", ")} - fields are missing`);
      } else {
        movieCollection.insertOne({
          plot: plot,
          runtime: runtime,
          cast: cast,
          num_mflix_comments: num_mflix_comments,
          fullplot: fullplot,
          languages: languages,
          released: released,
          directors: directors,
          lastupdated: lastupdated,
          imdb: imdb,
          countries: countries,
          tomatoes: tomatoes,
          year: year,
          genre: genre,
          title: title,
          type: type,
          writers: writers,
        });
      }
      response.json(await movieCollection.find({ title: title }).toArray());
    } catch (e) {
      response.json(e.message);
    }
  });
  myServer.put("/netflix/movies/:id", async (request, response) => {
    await client.connect();
    const movieID = request.params.id;
    const movieCollection = await getCollection("sample_mflix", "movies");
    let updated = "";
    try {
      updated = await movieCollection.updateOne(
        { _id: new ObjectId(String(movieID)) },
        [{ $set: { title: "New Updated Title", lastupdated: "$$NOW" } }]
      );
    } catch (er) {
      response.json(er.message);
    }
    response.json({
      UpdatedDocument: updated,
    });
  });
};

module.exports = { createNetflixEndPoints, client };
