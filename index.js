const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jr39v.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    console.log("Hitting database");
    const database = client.db("apartmentvillaDB");
    const apartmentsCollection = database.collection("apartments");
    const reviewsCollection = database.collection("reviews");
    const userCollection = database.collection("users");

    // GET ALL APARTMENT API
    app.get("/apartments", async (req, res) => {
      const cursor = apartmentsCollection.find({});
      const apartments = await cursor.toArray();
      res.send(apartments);
    });
    // GET ALL REVIEW API
    app.get("/reviews", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
    // SAVE USER BY EMAIL SIGN IN
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.json(result);
    });
    // SAVE USER BY GMAIL SIGN IN
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Running Green Villa Server!");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
