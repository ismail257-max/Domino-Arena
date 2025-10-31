# 🚀 DOMINO ARENA BACKEND - QUICK SETUP GUIDE

## 📁 Step 1: Create Project Structure

Open your terminal and run these commands:

```bash
# Create the main project folder
mkdir domino-arena-backend
cd domino-arena-backend

# Create all required folders
mkdir config models controllers middleware routes utils

# Your project structure should now look like this:
# domino-arena-backend/
# ├── config/
# ├── models/
# ├── controllers/
# ├── middleware/
# ├── routes/
# └── utils/
```

---

## 📋 Step 2: Copy Files to Correct Locations

### Root Level Files (copy to: domino-arena-backend/)
- ✅ `package.json`
- ✅ `server.js`
- ✅ `.env` (from this download)
- ✅ `.env.example` (from this download)
- ✅ `.gitignore` (from this download)

### config/ folder
- ✅ `db.js` → copy to `config/db.js`

### models/ folder
- ✅ `User.js` → copy to `models/User.js`

### controllers/ folder
- ✅ `authController.js` → copy to `controllers/authController.js`

### middleware/ folder
- ✅ `authMiddleware.js` → copy to `middleware/authMiddleware.js`
- ✅ `rateLimiter.js` → copy to `middleware/rateLimiter.js`

### routes/ folder
- ✅ `authRoutes.js` → copy to `routes/authRoutes.js`

### utils/ folder
- ✅ `validators.js` → copy to `utils/validators.js`

---

## 🔧 Step 3: Final File Structure

Your project should look exactly like this:

```
domino-arena-backend/
│
├── config/
│   └── db.js
│
├── models/
│   └── User.js
│
├── controllers/
│   └── authController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── rateLimiter.js
│
├── routes/
│   └── authRoutes.js
│
├── utils/
│   └── validators.js
│
├── .env                    ← Environment variables (NEVER commit)
├── .env.example            ← Template for .env
├── .gitignore              ← Git ignore rules
├── package.json            ← Dependencies
├── server.js               ← Main entry point
└── README.md               ← (optional) Project documentation
```

---

## ⚙️ Step 4: Install Dependencies

```bash
# Make sure you're in the project folder
cd domino-arena-backend

# Install all required packages
npm install

# This will install:
# - express (web framework)
# - mongoose (MongoDB driver)
# - bcryptjs (password hashing)
# - jsonwebtoken (JWT authentication)
# - express-validator (input validation)
# - express-rate-limit (rate limiting)
# - helmet (security headers)
# - cors (CORS policy)
# - dotenv (environment variables)
# - nodemon (development auto-restart)
```

---

## 🗄️ Step 5: Set Up MongoDB

### Option A: Local MongoDB (Recommended for learning)

1. Install MongoDB Community Edition:
   - Windows: https://www.mongodb.com/try/download/community
   - Mac: `brew install mongodb-community`
   - Linux: `sudo apt-get install mongodb`

2. Start MongoDB:
   - Windows: MongoDB runs as a service automatically
   - Mac/Linux: `brew services start mongodb-community` or `sudo systemctl start mongod`

3. Your `.env` file is already configured for local MongoDB:
   ```
   MONGO_URI=mongodb://localhost:27017/domino_arena
   ```

### Option B: MongoDB Atlas (Cloud - Free)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Get your connection string
5. Update `.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/domino_arena
   ```

---

## ✅ Step 6: Verify Everything Works

```bash
# Start the development server
npm run dev

# You should see:
# "Server running on port 5000"
# "MongoDB Connected: localhost" (or your Atlas cluster)
```

If you see these messages, congratulations! Your backend is running! 🎉

---

## 🧪 Step 7: Test the API

### Test Registration (POST /api/auth/register)

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "test@example.com",
    "password": "test1234"
  }'
```

**Using Postman / Thunder Client:**
- Method: POST
- URL: http://localhost:5000/api/auth/register
- Headers: Content-Type: application/json
- Body (raw JSON):
```json
{
  "username": "testplayer",
  "email": "test@example.com",
  "password": "test1234"
}
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testplayer",
    "email": "test@example.com"
  }
}
```

### Test Login (POST /api/auth/login)

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test1234"
  }'
```

**Expected Response:** Same as registration

### Test Protected Route (GET /api/auth/me)

**Using curl (replace YOUR_TOKEN with the token from login):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testplayer",
    "email": "test@example.com",
    "level": 1,
    "xp": 0,
    "wins": 0,
    "losses": 0
  }
}
```

---

## 🎯 Step 8: Initialize Git Repository

```bash
# Initialize Git
git init

# Check status (verify .env is NOT listed)
git status

# Add all files
git add .

# Make first commit
git commit -m "Initial backend setup with authentication system"

# Verify .env was not committed
git log --stat
```

**Important:** The `.env` file should NEVER appear in git status. If it does, your `.gitignore` isn't working properly.

---

## ✅ Success Checklist

Before moving to the next phase, verify:

- [ ] All files organized in correct folders
- [ ] `npm install` completed successfully
- [ ] MongoDB is running (local or Atlas)
- [ ] Server starts with `npm run dev`
- [ ] Registration endpoint works (POST /api/auth/register)
- [ ] Login endpoint works (POST /api/auth/login)
- [ ] Protected route works (GET /api/auth/me with Bearer token)
- [ ] Rate limiting works (try logging in 6 times with wrong password)
- [ ] Git repository initialized
- [ ] `.env` file is NOT in git (verify with `git status`)

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot find module './config/db'"
**Solution:** Make sure `db.js` is in the `config/` folder, not the root.

### Issue: "MongoServerError: connect ECONNREFUSED"
**Solution:** MongoDB is not running. Start MongoDB or check your MONGO_URI.

### Issue: "jwt secret is required"
**Solution:** Make sure your `.env` file has `JWT_SECRET` defined.

### Issue: "npm install" fails
**Solution:** Make sure you're in the project folder and have Node.js installed.

### Issue: Port 5000 already in use
**Solution:** Change `PORT=5000` to `PORT=5001` in your `.env` file.

---

## 🎉 Next Steps

Once everything is working:

1. ✅ **Backend Authentication Complete!**
2. ⏭️ **Next Phase: Game Logic** (Draw Domino rules implementation)
3. ⏭️ **Then: Socket.io** (Real-time multiplayer)
4. ⏭️ **Then: Frontend UI** (React components)
5. ⏭️ **Then: Wallet System** (Financial transactions)
6. ⏭️ **Finally: Deployment** (Vercel + Render.com)

---

**Need help? Come back to Claude with:**
- Screenshots of errors
- Your file structure (use `tree` command or `ls -R`)
- The specific step where you're stuck

Good luck! 🚀
