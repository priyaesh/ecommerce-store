# How to Start MongoDB on Windows

MongoDB is installed at: `C:\Program Files\MongoDB\Server\8.0\bin\`

## Method 1: Start MongoDB Service (Recommended)

1. **Open PowerShell as Administrator:**
   - Right-click Start menu → Windows PowerShell (Admin)

2. **Start MongoDB service:**
   ```powershell
   net start MongoDB
   ```

3. **Verify it's running:**
   ```powershell
   Get-Service MongoDB
   ```
   Status should show "Running"

## Method 2: Start MongoDB Manually

If the service doesn't exist or won't start:

1. **Create data directory (if it doesn't exist):**
   ```powershell
   mkdir C:\data\db
   ```

2. **Start MongoDB manually:**
   ```powershell
   cd "C:\Program Files\MongoDB\Server\8.0\bin"
   .\mongod.exe --dbpath "C:\data\db"
   ```

   Keep this window open - MongoDB will run in this terminal.

## Method 3: Install MongoDB as a Service

If MongoDB wasn't installed as a service:

1. **Open PowerShell as Administrator**

2. **Install MongoDB as a Windows service:**
   ```powershell
   cd "C:\Program Files\MongoDB\Server\8.0\bin"
   .\mongod.exe --install --serviceName "MongoDB" --dbpath "C:\data\db" --logpath "C:\Program Files\MongoDB\Server\8.0\log\mongod.log"
   ```

3. **Start the service:**
   ```powershell
   net start MongoDB
   ```

## Verify MongoDB is Running

After starting, test the connection:

```powershell
# Test connection
mongosh --eval "db.adminCommand('ping')"
```

Or check if port 27017 is listening:

```powershell
netstat -an | findstr 27017
```

You should see:
```
TCP    0.0.0.0:27017          0.0.0.0:0              LISTENING
```

## After Starting MongoDB

Once MongoDB is running, seed your database:

```bash
cd backend
npm run seed
```

## Auto-Start MongoDB on Boot

To make MongoDB start automatically:

1. Open Services (Win + R → `services.msc`)
2. Find "MongoDB" service
3. Right-click → Properties
4. Set "Startup type" to "Automatic"
5. Click OK

## Quick Commands Reference

```powershell
# Start MongoDB service
net start MongoDB

# Stop MongoDB service
net stop MongoDB

# Check MongoDB status
Get-Service MongoDB

# Test MongoDB connection
mongosh
```

