const { response } = require("express");
const mockData = require("./MOCK_DATA.json");
const { client } = require("./mongodb");
const getCollection = async (dbName, collection) => {
  return await client.db(dbName).collection(collection);
};
const createCategory = async (dbName, category) => {
  return await client.db(dbName).createCollection(category);
};
var uniqueID = 1000;
const createEndPoints = (myServer) => {
  myServer.post("/products/createCollections", async (request, response) => {
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
    console.log(categoryCollection);
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
          const collection = await getCollection("ecommerceProducts", category);
          const query = { id: item.id };
          const documentExists = await collection.findOne(query);
          if (!documentExists) {
            console.log(documentExists);
            collection.insertOne(item);
          }
        }
      });
    });
    response.send("Collections are created");
  });
  myServer.get("/products", async (request, response) => {
    await client.connect();

    const collections = await client
      .db("ecommerceProducts")
      .listCollections()
      .toArray();
    response.json(collections);
  });
  myServer.get("/products/:category/:id", async (request, response) => {
    await client.connect();
    const category = request.params.category;
    const itemID = Number(request.params.id);
    const collection = await getCollection("ecommerceProducts", category);
    const findDocument = await collection.findOne({ id: itemID });
    if (findDocument) {
      response.json(findDocument);
    } else {
      response.send("Document doesn't exist");
    }
  });
  myServer.delete("/products/:category/:id", async (request, response) => {
    await client.connect();
    const category = request.params.category;
    const itemID = Number(request.params.id);
    const collection = await getCollection("ecommerceProducts", category);
    const findDocument = await collection.findOne({ id: itemID });
    if (findDocument) {
      const deletedItem = await collection.deleteOne({
        id: itemID,
      });
      response.json({
        ItemDeleted: deletedItem,
      });
    } else {
      response.send("Document doesn't exist");
    }
  });
  myServer.post("/products/createItem", async (request, response) => {
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
      if (missingFields.length > 0) {
        throw new Error(`${missingFields.join(", ")} - fields are missing`);
      } else {
        uniqueID++;
        collection.insertOne({
          id: uniqueID,
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
      const created = await collection.findOne({ id: uniqueID });
      response.json({ CreatedItem: created });
    } catch (e) {
      response.json(e.message);
    }
  });
  myServer.put("/products/:category/:id", async (request, response) => {
    await client.connect();
    const category = request.params.category;
    const itemID = Number(request.params.id);
    const body = request.body;
    const valuesToUpdate = Object.keys(body);
    const collection = await getCollection("ecommerceProducts", category);
    try {
      await valuesToUpdate.map(async (value) => {
        const filter = { id: itemID };
        const operation = { $set: {} };
        operation.$set[value] = body[value];
        await collection.updateOne(filter, operation);
      });
    } catch (er) {
      response.json(er.message);
    }
    response.json({
      UpdatedDocument: await collection.findOne({ id: itemID }),
    });
  });
};

module.exports = { createEndPoints };
