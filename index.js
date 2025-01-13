const express = require('express')
require('dotenv').config()
const app = express();
var jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



// user:BistroBossRasturant
// pass:28xozWxoi0fC6ZUT
// middele ware
app.use(cors());
app.use(express.json());

app.get('/', (req,res) => {
  res.send('boss is running');  
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rxtju.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

 const menuCollection = client.db('bistroDb').collection('menu')
 const userCollection = client.db('bistroDb').collection('users')

 const reviewsCollection = client.db('bistroDb').collection('reviews')
 const cartCollection = client.db('bistroDb').collection('carts')
 const adminCollection = client.db('bistroDb').collection('admins')


  //jwt related api 
  app.post("/jwt", async(req,res) => {
    const user = req.body;
    const token = jwt.sign(user,process.env.JWT_SECRET, {
      expiresIn: "10h"
    })
    res.send({token})
  } )

//middleware verify token
const verifyToken = (req,res,next) => {
   if(req.headers.authorization){
    return res.status(401).send({message:'forbidden access' })
   }
   const token = req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.JWT_SECRET,(err, decoded))
  if(err){
    return res.status(401).send({message: 'forbidden access'})
  }
  req.decoded = decoded;
  next();

}




//  user related api 


app.get('/users',verifyToken, async (req, res) => {

  const result = await userCollection.find().toArray();
  res.send(result);
});

app.get('/users/admin/:email', verifyToken, async(req,res) => {
    const email = req.params.email;
    if(email !== req.decoded.email){
      return res.status(403).send({message: 'unauthorized access'})
    }
    const query = {email: email};
    const user = await userCollection.findOne(query);
    let admin = false;
    if(user){
     admin =  user?.role === "admin";

    }
    res.send({admin});

})

app.post('/users', async (req, res) => {
  const user = req.body;
  console.log("Received Data:", user); // লগে ডেটা দেখুন

  const query = { email: user.email };
  const existingUser = await userCollection.findOne(query);
  console.log("Existing User:", existingUser); // লগে দেখুন

  if (existingUser) {
    return res.send({ message: "User already exists", insertedId: null });
  }

  try {
    const result = await userCollection.insertOne(user);
    console.log("Insert Result:", result);
    res.send(result);
  } catch (error) {
    console.error("Insert Error:", error);
    res.status(500).send({ message: "Failed to insert user", error });
  }
});

  app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: "admin"
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc)
      res.send(result)
  })

   //user delete 

   app.delete('/users/:id', async(req, res) => {
       const id = req.params.id;
       const query = {_id: new ObjectId(id)}
       const result = await  userCollection.deleteOne(query);
       res.send(result);
   })

 
   app.get("/menu", async(req,res) => {
    const result = await menuCollection.find().toArray();
    res.send(result);
   });
   app.get("/reviews", async(req,res) => {
    const result = await reviewsCollection.find().toArray();
    res.send(result);
   })


//get cart....jei user jei cart add korse just oitai dekhabe
  app.get('/carts', async(req,res) => {
    const email = req.query.email;
    const query = {email : email};
     const result = await cartCollection.find(query).toArray();
     res.send(result)
  });

    // carts collection
    app.post ("/carts", async(req,res) =>{
      const cartItem = req.body;
    const result = await cartCollection.insertOne(cartItem)
    res.send(result);
    })
    
    app.delete('/carts/:id', async(req,res) => {
       const id = req.params.id;
       const query = {_id: new ObjectId (id)}
       const result = await cartCollection.deleteOne(query);
       res.send(result)
    })

   
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => 
 console.log(`Bistro boss is running in port ${port}`)
)