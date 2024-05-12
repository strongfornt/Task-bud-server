const express = require("express");
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

//Must remove "/" from your production URL
app.use(
  cors()
);
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v2tnkbl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const database = client.db("studyDB");
    const assignmentCollection = database.collection("assignment")

    //assignment collection request
    app.get('/assignment',async(req,res)=>{
      const size = parseInt(req.query.size);
      const page = parseInt(req.query.page) -1;
      const filter = req.query.filter;
      let query ={}
      if(filter){
        query = {difficulty:filter}
      }
      const result = await assignmentCollection.find(query).skip(page*size).limit(size).toArray()
      res.send(result)
    })

    //assignment data post
    app.post('/assignment',async(req,res)=>{
      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result)
      console.log(assignment);
    })
   
    app.get('/assignmentCount',async(req,res)=>{
      const filter = req.query.filter;
      let query = {}
      if(filter) {
        query = {difficulty:filter}
      }
      console.log(filter);
      const count = await assignmentCollection.countDocuments(query)
      res.send({count});
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',async(req,res)=>{
    res.send('server running')
})

app.listen(port, () => {
    console.log(`server running on port ${port}`);
  });
