const { response } = require("express");
const mockData = require("./MOCK_DATA.json");
const { client } = require("./mongodb");
const { expressjwt } = require("express-jwt");
const { ObjectId } = require("mongodb");

require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;
const ALGORITHM = process.env.ALGORITHM;

const getCollection = async (dbName, collection) => {
  return await client.db(dbName).collection(collection);
};
const createCategory = async (dbName, category) => {
  return await client.db(dbName).createCollection(category);
};
const createEndPoints = (myServer) => {
  myServer.post(
    "/products/createCollections",
    expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
    async (request, response) => {
      const categories = [];
      let categoryCollection = [];
      await client.connect();
      mockData.filter((value) => {
        let category = value.category.toString().split(" ").join("-");
        if (!categories.includes(category)) {
          categories.push(category);
        }
      });
      categoryCollection = await client
        .db("ecommerceProducts")
        .listCollections()
        .toArray();
      categoryCollection = categoryCollection.map((value) => value.name);
      const collectionExists = categories.filter(
        (collection) => !categoryCollection.includes(collection)
      );
      //Create Collection
      await collectionExists.map(async (value) => {
        await createCategory("ecommrceProducts", value);
      });
      //Create document
      await categories.map(async (category) => {
        mockData.map(async (item) => {
          if (item.category.split(" ").join("-") === category) {
            const collection = await getCollection(
              "ecommerceProducts",
              category
            );
            const query = { id: item.id };
            const documentExists = await collection.findOne(query);
            if (!documentExists) {
              collection.insertOne(item);
            }
          }
        });
      });
      response.send("Collections are created");
    }
  );
  myServer.get(
    "/products",
    expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
    async (request, response) => {
      await client.connect();
      const collections = await client
        .db("ecommerceProducts")
        .listCollections()
        .toArray();
      const allData = [];
      const allPromises = collections.map(async (value) => {
        const collection = await getCollection("ecommerceProducts", value.name);
        const findCollection = await collection.find().toArray();
        allData.push(...findCollection);
      });
      await Promise.all(allPromises);
      response.json(allData);
    }
  );
  myServer.get(
    "/products/:category",
    expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
    async (request, response) => {
      await client.connect();
      const category = request.params.category;
      const collection = await getCollection("ecommerceProducts", category);
      const findCollection = await collection.find().toArray();
      response.json(findCollection);
    }
  );
  myServer.get(
    "/products/:category/:id",
    expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
    async (request, response) => {
      await client.connect();
      const category = request.params.category;
      const itemID = request.params.id;
      const collection = await getCollection("ecommerceProducts", category);
      try {
        const findDocument = await collection.findOne({
          _id: new ObjectId(String(itemID)),
        });
        if (findDocument) {
          response.json(findDocument);
        }
      } catch (error) {
        response.json("Document Doesn't Exist");
      }
    }
  );
  myServer.delete(
    "/products/:category/:id",
    expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
    async (request, response) => {
      await client.connect();
      const category = request.params.category;
      const itemID = request.params.id;
      const collection = await getCollection("ecommerceProducts", category);
      try {
        const findDocument = await collection.findOne({
          _id: new ObjectId(String(itemID)),
        });
        if (findDocument) {
          const deletedItem = await collection.deleteOne({
            _id: new ObjectId(String(itemID)),
          });
          response.json({
            ItemDeleted: deletedItem,
          });
        }
      } catch (error) {
        response.json("Document doesn't exist");
      }
    }
  );
  myServer.post(
    "/products/createItem",
    expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
    async (request, response) => {
      await client.connect();
      const body = request.body;
      const {
        product_name,
        description,
        price,
        quantity_available,
        brand,
        category,
        color,
        size,
        release_date,
      } = body;
      const params = {
        product_name: product_name,
        description: description,
        price: price,
        quantity_available: quantity_available,
        brand: brand,
        category: category,
        color: color,
        size: size,
        release_date: release_date,
      };
      let missingFields = Object.keys(params).filter((value) => {
        return !Object.keys(body).includes(value);
      });
      try {
        const collection = await getCollection("ecommerceProducts", category);
        if (!collection) {
          collection = await createCategory("ecommerceProducts", category);
        }
        let someID;
        if (missingFields.length > 0) {
          throw new Error(`${missingFields.join(", ")} - fields are missing`);
        } else {
          someID = await collection.insertOne({
            product_name: product_name,
            description: description,
            price: price,
            quantity_available: quantity_available,
            brand: brand,
            category: category,
            color: color,
            size: size,
            release_date: release_date,
          });
        }
        const created = await collection.findOne({
          _id: someID["insertedId"],
        });
        response.json({ CreatedItem: created });
      } catch (e) {
        response.json(e.message);
      }
    }
  );
  myServer.put(
    "/products/:category/:id",
    expressjwt({ secret: JWT_SECRET, algorithms: [ALGORITHM] }),
    async (request, response) => {
      await client.connect();
      const category = request.params.category;
      const itemID = request.params.id;
      const body = request.body;
      const valuesToUpdate = Object.keys(body);
      const collection = await getCollection("ecommerceProducts", category);
      let updatedDoc;
      try {
        await valuesToUpdate.map(async (value) => {
          const filter = { _id: new ObjectId(String(itemID)) };
          const operation = { $set: {} };
          operation.$set[value] = body[value];
          const updated = await collection.updateOne(filter, operation);
          updatedDoc = {
            UpdatedDocument: await collection.findOne({
              _id: new ObjectId(String(itemID)),
            }),
          };
          response.json(updatedDoc);
        });
      } catch (er) {
        response.json(er.message);
      }
    }
  );
};

module.exports = { createEndPoints };
