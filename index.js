const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const app = express();
const port = process.env.PORT || 5000;

var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jr39v.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split(" ")[1];
    try {
      const decodeUser = await admin.auth().verifyIdToken(idToken);
      req.decodeEmail = decodeUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();
    console.log("Hitting database");
    const database = client.db("apartmentvillaDB");
    const apartmentsCollection = database.collection("apartments");
    const reviewsCollection = database.collection("reviews");
    const userCollection = database.collection("users");
    const orderCollection = database.collection("orders");

    // GET ALL APARTMENT API
    app.get("/apartments", async (req, res) => {
      const cursor = apartmentsCollection.find({});
      const apartments = await cursor.toArray();
      res.send(apartments);
    });
    //GET SINGLE DATA API
    app.get("/apartments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const apartments = await apartmentsCollection.findOne(query);
      res.send(apartments);
    });
    // GET ALL REVIEW API
    app.get("/reviews", async (req, res) => {
      const cursor = reviewsCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
    //ADD APARTMENTS API
    app.post("/apartments", async (req, res) => {
      const apartments = req.body;
      const result = await apartmentsCollection.insertOne(apartments);
      res.json(result);
    });
    //ADD REVIEW API
    app.post("/reviews", async (req, res) => {
      const reviews = req.body;
      const result = await reviewsCollection.insertOne(reviews);
      res.json(result);
    });
    //ADD ORDERS API
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
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
    // MAKE ADMIN API
    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;
      const requester = req.decodeEmail;
      console.log("decode email:", req.decodeEmail);
      if (requester) {
        const requesterAccount = await userCollection.findOne({
          email: requester,
        });
        console.log("req role:", requesterAccount.role);
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: "admin" } };
          const result = await userCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res
          .status(403)
          .json({ message: "You do not have access to make admin" });
      }
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
