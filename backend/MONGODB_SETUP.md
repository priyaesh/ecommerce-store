# MongoDB Setup Guide

This guide will help you set up MongoDB for the e-commerce backend.

## Quick Start

### 1. Install MongoDB

**Windows:**
- Download MongoDB Community Server from https://www.mongodb.com/try/download/community
- Run the installer and follow the setup wizard
- MongoDB will start automatically as a Windows service

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your MongoDB connection string:

**For local MongoDB:**
```
MONGODB_URI=mongodb://localhost:27017/ecommerce-store
PORT=5000
```

**For MongoDB Atlas (Cloud):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-store
PORT=5000
```

### 3. Seed the Database

Populate the database with sample products:

```bash
cd backend
npm run seed
```

You should see:
```
Connected to MongoDB
Cleared existing products
Seeded 8 products successfully
Database connection closed
```

### 4. Start the Backend

```bash
npm run dev
```

The server will connect to MongoDB and start on port 5000.

## MongoDB Atlas Setup (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (choose the free tier)
4. Create a database user:
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Save the username and password
5. Whitelist your IP:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your specific IP
6. Get your connection string:
   - Go to "Clusters"
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `ecommerce-store`

Example connection string:
```
mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/ecommerce-store?retryWrites=true&w=majority
```

## Verifying the Setup

1. Check if products are in the database:
   - Visit `http://localhost:5000/api/health`
   - You should see `"products": 8` and `"database": "connected"`

2. Test the products endpoint:
   - Visit `http://localhost:5000/api/products`
   - You should see a JSON response with 8 products

## Troubleshooting

**Error: "MongoServerError: Authentication failed"**
- Check your MongoDB Atlas username and password
- Make sure you've whitelisted your IP address

**Error: "MongooseServerSelectionError: connect ECONNREFUSED"**
- Make sure MongoDB is running locally
- Check if the connection string is correct
- For local MongoDB, verify it's running: `mongosh` or check services

**Error: "Products not showing"**
- Run the seed script again: `npm run seed`
- Check MongoDB connection in the health endpoint

## Database Structure

The database uses a single collection: `products`

Each product document has:
- `id` (String, unique) - Product identifier
- `name` (String) - Product name
- `price` (Number) - Product price
- `category` (String) - Product category
- `rating` (Number) - Product rating (0-5)
- `reviews` (Number) - Number of reviews
- `tagline` (String) - Product tagline
- `stock` (Number) - Available stock
- `colors` (Array) - Available colors
- `image` (String) - Product image URL
- `badge` (String, optional) - Product badge
- `description` (String) - Product description
- `features` (Array) - Product features
- `featured` (Boolean) - Whether product is featured
- `createdAt` (Date) - Creation timestamp
- `updatedAt` (Date) - Last update timestamp

