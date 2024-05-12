const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

//Must remove "/" from your production URL
//Must remove "/" from your production URL
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://onlinestudy-908ec.web.app",
      "https://onlinestudy-908ec.firebaseapp.com"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.v2tnkbl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req,res,next) =>{
  const token = req.cookies?.token;
  // if(!token) res.status()
    console.log("token in the ",token);
  next()
}

async function run() {
  try {
    const database = client.db("studyDB");
    const assignmentCollection = database.collection("assignment")

    //set cookieOption for sign in and log out ===============================
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    };
    
    //jwt token request
    app.post('/jwt',async(req,res)=>{
      const user= req.body;
      const token = jwt.sign(user,process.env.SECRET_KEY,{expiresIn:'1h'})
      res.cookie("token", token, cookieOptions).send({ success: true });
    })
    //clear cookie when user logged out====================
    app.post('/logout',async(req,res)=>{
      const user = req.body;
      console.log("logging out", user);
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    })

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
// apply get method for fetch data by id 
app.get('/assignment/:id',async(req,res)=>{
  const id = req.params.id;
  const options = {_id : new ObjectId(id)}
  const result = await assignmentCollection.findOne(options);
  res.send(result)
  
})

//apply put method for update a documents from db

app.put('/assignment/:id',async(req,res)=>{
  const id = req.params.id;
  const filter ={_id : new ObjectId(id)};
  const options ={ upsert:true};
  const updateAssignment = req.body;
  const update ={
    $set:{
      title:updateAssignment.title,
      image:updateAssignment.image,
      difficulty:updateAssignment.difficulty,
      marks:updateAssignment.marks,
      description:updateAssignment.description
    }
  }
  const result = await assignmentCollection.updateOne(filter,update,options)
  res.send(result)
})

    //assignment data post
    app.post('/assignment',async(req,res)=>{
      const assignment = req.body;
      const result = await assignmentCollection.insertOne(assignment);
      res.send(result)
      
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


    //apply delete method 
    app.delete('/assignment/:id',async(req,res)=>{
      const id = req.params.id;
      const query ={_id : new ObjectId(id)}
      const result = await assignmentCollection.deleteOne(query)
      res.send(result)
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
