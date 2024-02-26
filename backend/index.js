const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require('cors');
const jwt = require('jsonwebtoken'); // Add this import
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



// Connect to MongoDB database

app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb+srv://poojaas0202:pooja123@cluster0.wbcuxde.mongodb.net/test_1", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("MongoDB connection error:", error);
});

// Define a storage engine for multer
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with the defined storage engine
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1000000 } // Set file size limit (optional)
});

// Define a schema for Product model
const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  new_price: {
    type: Number,
    required: true
  },
  old_price: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  available: {
    type: Boolean,
    default: true
  }
});

// Create Product model using the schema
const Product = mongoose.model("Product", productSchema);

app.post("/upload", upload.single('product'), (req, res) => {
  console.log(req.file.filename)
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`
  });
});

// Define a route handler for adding a product
app.post("/addproduct", upload.single("product"), async (req, res) => {
  console.log("add triggered");
  try {
    let products = await Product.find({});
    let id = 1;
    if (products.length > 0) {
      let last_product_array = products.slice(-1);
      let last_product = last_product_array[0];
      id = last_product.id + 1;
    }
    const product = new Product({
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price
    });

    
    await product.save();
    console.log("Product saved:", product);
    res.json({
      success: true,
      name: req.body.name
    });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ success: false, error: "Error saving product" });
  }
});

// Serve uploaded images statically
app.use("/images", express.static("upload/images"));

// Define a default route handler for other requests
app.get("/", (req, res) => {
  res.send("Express app is running");
});

// Creating API for deleting Products
app.post('/removeproduct', async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
      success: true,
      name: req.body.name
    });
  } catch (error) {
    console.error("Error removing product:", error);
    res.status(500).json({ success: false, error: "Error removing product" });
  }
});

// Creating API for getting all products
app.get('/allproducts', async (req, res) => {
  try {
    let products = await Product.find({});
    console.log("All Products Fetched");
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Error fetching products" });
  }
});

// Define a schema for User model
const UsersSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,
  cartData: Object,
  date: {
    type: Date,
    default: Date.now,
  }
});

// Create Users model using the schema
const Users = mongoose.model('Users', UsersSchema);

// Creating Endpoint for registering user
app.post('/signup', async (req, res) => {
  console.log("Signup called",req.body)
  try {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({ success: false, errors: "Existing users found with same email id" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }
    const user = new Users({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      cartData: cart,
    });
    await user.save();
    const data = {
      user: {
        id: user.id
      }
    };
    const token = jwt.sign(data, 'secret_ecom');
    res.json({ success: true, token });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ success: false, error: "Error registering user" });
  }
});

// Creating Endpoint for user login
app.post('/login', async (req, res) => {
  
  
  try {
    let user = await Users.findOne({ email: req.body.email });
    console.log("Data",user)
    if (!user) {
      return res.json({ success: false, errors: "Wrong email id" });
    }
    const passCompare = req.body.password === user.password;
    if (passCompare) {
      const data = {
        user: {
          id: user.id
        }
      };
      const token = jwt.sign(data, 'secret_ecom');
      return res.json({ success: true, token });
    } else {
      return res.json({ success: false, errors: "Wrong Password" });
    }
  } catch (error) {
    console.error("Error login user:", error);
    return res.status(500).json({ success: false, error: "Error login user" });
  }
});

// creating endpoint for newcollection data
app.get('/newcolletions',async (req,res)=>{
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("NewCollection fetched");
  res.send(newcollection);
})

// creating endpoint for popular in women
app.get('/popularinwomen',async (req,res)=>{
  let products = await Product.find({category:"women"});
  let popular_in_women = products.slice(0,4);
  console.log("Popular in women fetched");
  res.send(popular_in_women);
})

//creating middleware to fetch user
const fetchuser = async (req,res,next)=>{
  const token = req.header("auth-token");
  if(!token){
    res.status(401).send({errors:"Please authenticate using valid token"})
  }
  else{
    try{
      const data = jwt.verify(token,'secret_ecom')
      req.user = data.user;
      next();
    }
    catch(error){
          res.status(401).send({errors:"please authenticate using a valid token"})
    }
  }
}



// creating endpoint for adding products in cartdata
app.post('/addtocart',fetchuser,async(req,res)=>{
  console.log("Added",req.body.itemId);
  let userData = await Users.findOne({_id:req.user.id});
 
  userData.cartData[req.body.itemId] +=1; 
  
  await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
  res.send("Added")
})

//creating endpoint to remove product from cartdata
app.post('/removefromcart',fetchuser,async (req,res)=>{
  console.log("removed",req.body.itemId);
  let userData = await Users.findOne({_id:req.user.id});
  if(userData.cartData[req.body.itemId]>0)
  {

  }
  userData.cartData[req.body.itemId] -=1; 
  
  await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData})
  res.send("Removed")

})
//creating endpoint to get cartdata
app.post('/getcart',fetchuser,async (req,res)=>{
  console.log("Getcart");
  let userData = await Users.findOne({_id:req.user.id});
  res.json(userData.cartData);
})

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

    
