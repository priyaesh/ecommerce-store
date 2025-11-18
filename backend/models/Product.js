const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      required: true,
      min: 0,
    },
    tagline: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    colors: {
      type: [String],
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    badge: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    features: {
      type: [String],
      required: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
productSchema.index({ category: 1, featured: 1 });
productSchema.index({ stock: 1 }); // Index for low stock queries
// Note: id index is already created by unique: true, so we don't need to add it again

// Instance method to check if product is in stock
productSchema.methods.isInStock = function (quantity = 1) {
  return this.stock >= quantity;
};

// Instance method to reduce stock
productSchema.methods.reduceStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`);
  }
  this.stock -= quantity;
  return await this.save();
};

// Instance method to increase stock (for restocking)
productSchema.methods.increaseStock = async function (quantity) {
  this.stock += quantity;
  return await this.save();
};

// Static method to get low stock products
productSchema.statics.getLowStock = function (threshold = 10) {
  return this.find({ stock: { $lte: threshold, $gt: 0 } });
};

// Static method to get out of stock products
productSchema.statics.getOutOfStock = function () {
  return this.find({ stock: 0 });
};

module.exports = mongoose.model("Product", productSchema);

