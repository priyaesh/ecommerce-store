# MongoDB Connection Troubleshooting

## Error: `connect ECONNREFUSED ::1:27017`

This error means MongoDB is not running or not accessible. Here's how to fix it:

## Solution 1: Check if MongoDB is Installed

### Windows:
1. Check if MongoDB is installed:
   ```powershell
   where.exe mongod
   ```
   If it shows a path, MongoDB is installed. If not, you need to install it.

2. Check if MongoDB service is running:
   ```powershell
   Get-Service -Name "*mongo*"
   ```
   Or check in Services app:
   - Press `Win + R`, type `services.msc`
   - Look for "MongoDB" service
   - If it exists, right-click and select "Start"

### Install MongoDB on Windows:
1. Download MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Check "Install MongoDB as a Service"
5. Click "Install"
6. MongoDB will start automatically

## Solution 2: Start MongoDB Manually

### If MongoDB is installed but not running:

**Windows (as a service):**
```powershell
# Start MongoDB service
net start MongoDB
```

**Windows (manual start):**
```powershell
# Find MongoDB installation path (usually):
cd "C:\Program Files\MongoDB\Server\7.0\bin"

# Start MongoDB
.\mongod.exe --dbpath "C:\data\db"
```

**Note:** You may need to create the data directory first:
```powershell
mkdir C:\data\db
```

## Solution 3: Use MongoDB Atlas (Cloud - No Installation Needed)

If you don't want to install MongoDB locally, use MongoDB Atlas (free tier available):

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a cluster (free tier)
4. Create database user
5. Whitelist your IP (or use 0.0.0.0/0 for development)
6. Get connection string
7. Update `backend/.env`:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce-store
   ```

## Solution 4: Fix IPv6 Connection Issue

Sometimes Windows tries to connect via IPv6 (::1) instead of IPv4 (127.0.0.1). Fix the connection string:

Update `backend/.env`:
```
MONGODB_URI=mongodb://127.0.0.1:27017/ecommerce-store
```

Or update `backend/config/database.js`:
```javascript
const conn = await mongoose.connect(
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecommerce-store",
  // ...
);
```

## Quick Test: Check if MongoDB is Running

```powershell
# Try to connect with mongosh
mongosh

# Or test connection
mongosh --eval "db.adminCommand('ping')"
```

If this works, MongoDB is running. If not, you need to start it.

## Verify MongoDB is Running

After starting MongoDB, verify it's working:

```powershell
# Check if port 27017 is listening
netstat -an | findstr 27017
```

You should see something like:
```
TCP    0.0.0.0:27017          0.0.0.0:0              LISTENING
```

## Common Issues

### Issue 1: MongoDB service won't start
- Check Windows Event Viewer for errors
- Make sure port 27017 is not used by another application
- Try running MongoDB manually to see error messages

### Issue 2: Permission denied
- Run PowerShell as Administrator
- Check MongoDB data directory permissions

### Issue 3: Port already in use
- Another MongoDB instance might be running
- Check: `netstat -ano | findstr 27017`
- Kill the process or use a different port

## After Fixing: Seed the Database

Once MongoDB is running:

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

## Still Having Issues?

1. Check MongoDB logs (usually in `C:\Program Files\MongoDB\Server\7.0\log\`)
2. Verify firewall isn't blocking port 27017
3. Try using MongoDB Atlas (cloud) instead
4. Check if antivirus is blocking MongoDB

