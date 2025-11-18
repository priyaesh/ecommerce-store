# How to View Your Local MongoDB Database

There are several ways to view and interact with your local MongoDB database. Here are the most common methods:

## Method 1: MongoDB Compass (Recommended - GUI Tool)

MongoDB Compass is the official GUI tool for MongoDB. It's the easiest way to view and manage your database.

### Installation:
1. Download MongoDB Compass from: https://www.mongodb.com/try/download/compass
2. Install and launch the application

### Connection:
1. Open MongoDB Compass
2. In the connection string field, enter:
   ```
   mongodb://localhost:27017
   ```
   Or click "Fill in connection fields individually" and use:
   - **Host:** localhost
   - **Port:** 27017
   - **Authentication:** None (for local MongoDB)
3. Click "Connect"

### View Your Database:
1. You'll see a list of databases on the left
2. Click on `ecommerce-store` database
3. Click on `products` collection
4. You'll see all your products in a nice table/grid view
5. You can:
   - View documents in table or JSON format
   - Edit documents
   - Add new documents
   - Delete documents
   - Run queries
   - View indexes

## Method 2: MongoDB Shell (mongosh) - Command Line

MongoDB Shell is a command-line interface for MongoDB.

### Installation:
MongoDB Shell usually comes with MongoDB installation. If not:
- Download from: https://www.mongodb.com/try/download/shell

### Usage:

1. **Connect to MongoDB:**
   ```bash
   mongosh
   ```
   Or specify the database:
   ```bash
   mongosh ecommerce-store
   ```

2. **List all databases:**
   ```javascript
   show dbs
   ```

3. **Switch to your database:**
   ```javascript
   use ecommerce-store
   ```

4. **List collections:**
   ```javascript
   show collections
   ```

5. **View all products:**
   ```javascript
   db.products.find().pretty()
   ```

6. **Count products:**
   ```javascript
   db.products.countDocuments()
   ```

7. **Find a specific product:**
   ```javascript
   db.products.findOne({ id: "aurora-lamp" })
   ```

8. **Find featured products:**
   ```javascript
   db.products.find({ featured: true }).pretty()
   ```

9. **Exit mongosh:**
   ```javascript
   exit
   ```

## Method 3: VS Code Extension

If you use VS Code, you can install a MongoDB extension.

### Installation:
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "MongoDB for VS Code" by MongoDB
4. Install the extension

### Usage:
1. Click the MongoDB icon in the left sidebar
2. Click "Add Connection"
3. Enter connection string: `mongodb://localhost:27017`
4. Click "Connect"
5. Navigate to `ecommerce-store` → `products` collection
6. View and edit documents directly in VS Code

## Method 4: Studio 3T (Alternative GUI)

Studio 3T is another popular MongoDB GUI tool.

### Installation:
- Download from: https://studio3t.com/download/
- Free version available

### Connection:
1. Create a new connection
2. Server: `localhost`
3. Port: `27017`
4. Authentication: None
5. Connect and browse your database

## Method 5: Using Node.js Script (Quick View)

Create a simple script to view your data:

```javascript
// backend/scripts/view-products.js
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-store";

async function viewProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");

    const products = await Product.find({});
    console.log(`Total products: ${products.length}\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Featured: ${product.featured}`);
      console.log(`   Stock: ${product.stock}`);
      console.log("");
    });

    await mongoose.connection.close();
    console.log("Connection closed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

viewProducts();
```

Run it:
```bash
cd backend
node scripts/view-products.js
```

## Quick Reference Commands (mongosh)

```javascript
// Connect
mongosh ecommerce-store

// View all products
db.products.find().pretty()

// View first product
db.products.findOne()

// Count products
db.products.countDocuments()

// Find by category
db.products.find({ category: "Lighting" }).pretty()

// Find featured products
db.products.find({ featured: true }).pretty()

// Find by price range
db.products.find({ price: { $gte: 100, $lte: 500 } }).pretty()

// Update a product
db.products.updateOne(
  { id: "aurora-lamp" },
  { $set: { stock: 30 } }
)

// Delete a product
db.products.deleteOne({ id: "aurora-lamp" })

// View database stats
db.stats()
```

## Troubleshooting

**"mongosh: command not found"**
- Make sure MongoDB is installed
- Add MongoDB bin directory to your PATH
- Or use full path: `C:\Program Files\MongoDB\Server\7.0\bin\mongosh.exe`

**"Connection refused"**
- Make sure MongoDB service is running
- Windows: Check Services app, look for "MongoDB"
- Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongodb`

**"Database not found"**
- Run the seed script first: `npm run seed` in the backend folder
- The database will be created automatically when you seed it

## Recommended Approach

For beginners: **MongoDB Compass** - It's visual, easy to use, and free.

For developers: **mongosh** - Fast, powerful, and great for scripting.

For VS Code users: **MongoDB for VS Code extension** - Integrated with your editor.

