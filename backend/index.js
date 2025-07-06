const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;

// 📂 Import Data
const books = require('./data/books');
const groceries = require('./data/groceries');
const electronics = require('./data/electronics');

// 🛒 Combine Data
const productDatabases = {
  books,
  groceries,
  electronics
};

// 🔧 Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 🧪 Basic Routes
app.get('/', (req, res) => {
  res.send('working');
});

app.get('/done', (req, res) => {
  res.send('done');
});

// 📦 Barcode Scan Route
app.post('/api/products/scan', (req, res) => {
  console.log("Incoming Scan Request:", req.body);

  const { value } = req.body;
  for (const [category, db] of Object.entries(productDatabases)) {
    const product = db[value];
    if (product) {
      return res.json({ ...product, category });
    }
  }

  res.status(400).json({ error: `Product not found for barcode: ${value}` });
});

// 📁 Image Upload Route (Bag Scan Stub)
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, `upload-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

app.post('/api/products/image', upload.single('image'), async (req, res) => {
  const imagePath = req.file.path;

  // ✨ Stub logic for image recognition (replace with real TensorFlow logic)
  const predictedCategory = "groceries"; // mock prediction
  const product = getProductFromCategory(predictedCategory);

  res.json({ product });
});

// 🔎 Product Lookup by Label
function getProductFromCategory(label) {
  const allProducts = [
    ...Object.values(books),
    ...Object.values(groceries),
    ...Object.values(electronics)
  ];

  return allProducts.find(product =>
    label.toLowerCase().includes(product.title.toLowerCase())
  );
}

// 🔐 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "page not found" });
});

// ▶️ Start Server
app.listen(port, () => {
  console.log(`🚀 Backend is running at http://localhost:${port}`);
});