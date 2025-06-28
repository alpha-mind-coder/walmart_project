const express = require('express');
const app = express();
const cors = require("cors");
let port = 3000;
app.use(cors());
app.use(express.urlencoded({extended: true}))
app.use(express.json()); 

// product-service.js
const productDatabases = {
   books: require('./data/books'),
   groceries: require('./data/groceries'),
electronics: require('./data/electronics')
};
app.get("/" , (req , res)=> {
   res.send("working");
})
app.get("/done" , (req , res)=> {
  res.send("done");
})
app.post('/api/products/scan', (req, res) => {
  console.log(req.body)
  const { value } = req.body;
  // Check all categories
  for (const [category, db] of Object.entries(productDatabases)) {
    const product = db[value];
    if (product) {
      return res.json({ ...product, category });
    }
  }
  
  res.status(400).json({ error: "Product not found" });
  // res.send("we get")
});

app.get(/.*/ , (error , req, res , next)=> {
  res.status(404).json({error: "page not found"});
})
function getProductFromCategory(label) {
  const allProducts = [...books, ...groceries, ...electronics];

  return allProducts.find(product =>
    label.toLowerCase().includes(product.name.toLowerCase())
  );
}

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `upload-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
app.post('/api/products/image', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;
  const predictedCategory = await recognizeCategoryFromImage(imagePath);
  const product = getProductFromCategory(predictedCategory);
  res.json({ product });
});



app.listen(port , ()=> {
    console.log(`app listen at ${port}`);
})