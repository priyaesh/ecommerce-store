const mongoose = require("mongoose");
const Product = require("../models/Product");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-store";

const products = [
  {
    id: "aurora-lamp",
    name: "Aurora Minimal Lamp",
    price: 129,
    category: "Lighting",
    rating: 4.8,
    reviews: 214,
    tagline: "Soft glow for modern spaces",
    stock: 24,
    colors: ["Matte Black", "Sandstone"],
    image:
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
    badge: "Bestseller",
    description:
      "Adjustable LED lamp with a frosted glass diffuser that brings hotel-level ambience to your home office or bedroom.",
    features: [
      "Touch dimmer with 3 presets",
      "Integrated 45,000-hour LED strip",
      "Weighted steel base for stability",
    ],
    featured: true,
  },
  {
    id: "solstice-chair",
    name: "Solstice Lounge Chair",
    price: 499,
    category: "Furniture",
    rating: 4.9,
    reviews: 132,
    tagline: "Cloud-soft cushioning meets sculpted wood",
    stock: 8,
    colors: ["Walnut / Fog", "Oak / Sand"],
    image:
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80",
    badge: "Design Award",
    description:
      "Ergonomic curves, kiln-dried hardwood, and down-alternative cushions keep you supported during long reading sessions.",
    features: [
      "Removable, stain-resistant covers",
      "Responsibly sourced timber frame",
      "Ships fully assembled",
    ],
    featured: true,
  },
  {
    id: "caldera-mug-set",
    name: "Caldera Stoneware Mug Set",
    price: 68,
    category: "Kitchen",
    rating: 4.7,
    reviews: 412,
    tagline: "Hand-glazed, dishwasher safe",
    stock: 61,
    colors: ["Mineral", "Seafoam", "Dune"],
    image:
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80",
    badge: "Staff Pick",
    description:
      "Set of four stackable mugs with generous handles and a reactive glaze finish—no two pieces look exactly alike.",
    features: [
      "Microwave + dishwasher safe",
      "Lead-free glaze",
      "Insulated double-wall design",
    ],
    featured: false,
  },
  {
    id: "noon-cutlery",
    name: "Noon 16-Piece Cutlery",
    price: 159,
    category: "Kitchen",
    rating: 4.5,
    reviews: 98,
    tagline: "German steel, mirror polished",
    stock: 35,
    colors: ["Brushed Steel", "Onyx"],
    image:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1200&q=80",
    badge: "Limited",
    description:
      "Flatware that balances timeless silhouettes with everyday durability. Weighted handles feel luxurious in-hand.",
    features: [
      "18/10 stainless steel",
      "Scratch-resistant finish",
      "Lifetime warranty against rust",
    ],
    featured: false,
  },
  {
    id: "atlas-planter",
    name: "Atlas Self-Watering Planter",
    price: 89,
    category: "Decor",
    rating: 4.6,
    reviews: 176,
    tagline: "Two-week watering intervals",
    stock: 40,
    colors: ["Pebble", "Forest", "Terracotta"],
    image:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1200&q=80",
    badge: "Low Stock",
    description:
      "Double-walled planter with a hidden reservoir that feeds roots from below so you water less and enjoy more greenery.",
    features: [
      "Breathable ceramic shell",
      "Water-level viewing window",
      "Includes repotting mat + scoop",
    ],
    featured: false,
  },
  {
    id: "linen-duvet",
    name: "Coastline Linen Duvet",
    price: 259,
    category: "Bedding",
    rating: 4.8,
    reviews: 301,
    tagline: "Hotel-cool, stonewashed softness",
    stock: 17,
    colors: ["Ivory", "Mist", "Slate"],
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80",
    badge: "Organic",
    description:
      "Belgian flax linen duvet cover with hidden interior ties and oversized buttons to keep inserts perfectly in place.",
    features: [
      "Pre-washed for lived-in feel",
      "Thermoregulating fibers",
      "Certified organic dyes",
    ],
    featured: false,
  },
  {
    id: "flux-desk",
    name: "Flux Adjustable Desk",
    price: 799,
    category: "Office",
    rating: 4.9,
    reviews: 89,
    tagline: "Sit-to-stand with smart presets",
    stock: 12,
    colors: ["Walnut", "Matte White"],
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
    badge: "New",
    description:
      "Ultra-quiet dual motors, cable management tray, and an anti-collision system keep your workspace intentional and tidy.",
    features: [
      "4 programmable height presets",
      "Integrated wireless charger",
      "Rounded edges + spill-resistant finish",
    ],
    featured: true,
  },
  {
    id: "dawn-coffee-table",
    name: "Dawn Oak Coffee Table",
    price: 349,
    category: "Furniture",
    rating: 4.4,
    reviews: 67,
    tagline: "Floating silhouette, storage shelf",
    stock: 19,
    colors: ["Natural Oak", "Smoked Oak"],
    image:
      "https://images.unsplash.com/photo-1616628182501-1c3f9a3bd5c4?auto=format&fit=crop&w=1200&q=80",
    badge: "Back in stock",
    description:
      "Waterfall edges meet a soft-close drawer and magazine shelf, hand-finished in a matte UV-protected lacquer.",
    features: [
      "Soft-close drawer",
      "Scratch-resistant top coat",
      "Ships in recyclable packaging",
    ],
    featured: false,
  },
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // Clear existing products
    await Product.deleteMany({});
    console.log("Cleared existing products");

    // Insert products
    await Product.insertMany(products);
    console.log(`Seeded ${products.length} products successfully`);

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();

