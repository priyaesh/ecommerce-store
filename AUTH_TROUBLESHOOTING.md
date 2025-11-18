# Authentication Troubleshooting

## Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error means the frontend is receiving HTML instead of JSON from the API. Here's how to fix it:

### Step 1: Verify Backend is Running

Check if the backend server is running on port 5000:

```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000
```

You should see the backend listening. If not, start it:

```bash
cd backend
npm run dev
```

### Step 2: Test Backend API Directly

Test the register endpoint from command line:

```powershell
# Test register endpoint
Invoke-WebRequest -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

If this works, the backend is fine. If not, check backend logs.

### Step 3: Check API_BASE_URL

Make sure the frontend is using the correct API URL. Check browser console:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Type: `process.env.NEXT_PUBLIC_API_BASE_URL`
4. Or check Network tab to see what URL is being called

The default should be `http://localhost:5000`

### Step 4: Check CORS

Make sure CORS is enabled in the backend. Check `backend/index.js`:

```javascript
app.use(cors());
```

### Step 5: Verify Environment Variables

Create `frontend/.env.local` if needed:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Then restart the Next.js dev server.

### Step 6: Check Browser Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to register again
4. Look at the request to `/api/auth/register`
5. Check:
   - Request URL (should be `http://localhost:5000/api/auth/register`)
   - Response (should be JSON, not HTML)
   - Status code (should be 201 for success, 400/500 for errors)

### Common Issues:

1. **Backend not running** - Start it with `cd backend && npm run dev`
2. **Wrong port** - Make sure backend is on port 5000
3. **CORS blocked** - Check browser console for CORS errors
4. **Next.js proxy** - Make sure there's no Next.js API route interfering
5. **Environment variable not set** - Check `NEXT_PUBLIC_API_BASE_URL`

### Quick Fix:

1. **Restart both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

2. **Clear browser cache and localStorage:**
   - Open DevTools (F12)
   - Application tab → Local Storage → Clear all
   - Refresh page

3. **Check browser console for errors**

### Still Not Working?

Check the actual error in browser console:
1. Open DevTools (F12)
2. Console tab
3. Look for the full error message
4. Network tab - check the actual request/response

The improved error handling will now show you exactly what's wrong!

