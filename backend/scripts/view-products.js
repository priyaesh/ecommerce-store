require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/ecommerce-store";

async function viewProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB\n");
    console.log("=".repeat(60));

    const products = await Product.find({}).sort({ category: 1, name: 1 });
    console.log(`Total products: ${products.length}\n`);

    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Featured: ${product.featured ? "Yes" : "No"}`);
      console.log(`   Stock: ${product.stock}`);
      console.log(`   Rating: ${product.rating} (${product.reviews} reviews)`);
      console.log("");
    });

    // Summary
    const featuredCount = products.filter((p) => p.featured).length;
    const categories = [...new Set(products.map((p) => p.category))];
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

    console.log("=".repeat(60));
    console.log("Summary:");
    console.log(`  Featured products: ${featuredCount}`);
    console.log(`  Categories: ${categories.join(", ")}`);
    console.log(`  Total stock: ${totalStock} units`);
    console.log("=".repeat(60));

    await mongoose.connection.close();
    console.log("\nConnection closed");
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

viewProducts();

