# 🚀 DOMINO ARENA FRONTEND - PHASE 1 SETUP GUIDE

## ✅ WHAT'S INCLUDED IN THIS FOLDER:

- ✅ Complete authentication system (Login/Register)
- ✅ React 18.2 + React Router v6
- ✅ Tailwind CSS styling (dark theme)
- ✅ Framer Motion animations
- ✅ Howler.js sound effects
- ✅ Axios API integration with your backend
- ✅ JWT authentication
- ✅ Protected routes
- ✅ Toast notifications
- ✅ Responsive design (mobile-friendly)

---

## 📋 PREREQUISITES:

1. **Node.js** installed (v16+ recommended)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **Backend running** on http://localhost:5000
   - Your Domino Arena backend must be running
   - Test: Open http://localhost:5000 in browser

---

## 🛠️ INSTALLATION STEPS:

### Step 1: Navigate to this folder
```bash
cd domino-arena-frontend-phase1
```

### Step 2: Install dependencies
```bash
npm install
```

This will install:
- react, react-dom
- react-router-dom
- axios
- framer-motion (animations)
- howler (sounds)
- react-icons
- tailwindcss

**Note:** Installation may take 2-5 minutes depending on your internet speed.

### Step 3: Create .env file (if not exists)
```bash
# Copy the example
cp .env.example .env
```

Your `.env` file should contain:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENABLE_SOUNDS=true
```

### Step 4: Download sound effects (OPTIONAL)
1. Go to `public/sounds/` folder
2. Read the `README.md` for instructions
3. Download free sounds from:
   - https://pixabay.com/sound-effects/
   - https://freesound.org/
4. Place them in `public/sounds/` folder

**Required files:**
- `click.mp3`
- `success.mp3`
- `error.mp3`
- `notification.mp3`

**Note:** App works fine without sounds. You can add them later.

### Step 5: Start the development server
```bash
npm start
```

The app will open automatically at:
**http://localhost:3000**

---

## 🧪 TESTING THE APP:

### 1. Test Home Page
- Open: http://localhost:3000
- You should see: "Welcome to Domino Arena"
- Click "Get Started" → Should go to Register page
- Click "Login" → Should go to Login page

### 2. Test Registration
- Go to: http://localhost:3000/register
- Fill in the form:
  - Username: testuser123
  - Email: test@example.com
  - Password: password123
  - Confirm Password: password123
- Click "Sign Up"
- If successful:
  - ✅ Green toast notification
  - ✅ Success sound plays
  - ✅ Redirects to /dashboard

### 3. Test Login
- Go to: http://localhost:3000/login
- Use the same credentials you registered with
- Click "Log In"
- If successful:
  - ✅ Green toast notification
  - ✅ Success sound plays
  - ✅ Redirects to /dashboard
  - ✅ Navbar shows "Welcome, testuser123!"

### 4. Test Protected Routes
- While logged out, try accessing: http://localhost:3000/dashboard
- Should redirect you to /login ✅

### 5. Test Logout
- While logged in, click "Logout" button in navbar
- Should redirect to home page ✅
- Navbar should show "Login" and "Register" again ✅

---

## 📂 PROJECT STRUCTURE:

```
domino-arena-frontend-phase1/
├── public/
│   ├── index.html
│   └── sounds/
│       └── README.md (sound instructions)
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── AnimatedButton.jsx
│   │       ├── LoadingSpinner.jsx
│   │       ├── Navbar.jsx
│   │       ├── ProtectedRoute.jsx
│   │       └── Toast.jsx
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   └── DashboardPage.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── authService.js
│   ├── utils/
│   │   ├── api.js (Axios instance)
│   │   └── soundManager.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── .env (your config)
├── .env.example (template)
├── .gitignore
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

---

## 🎨 FEATURES IMPLEMENTED:

### ✅ Authentication System
- User registration with validation
- User login
- JWT token management
- Auto-logout on 401 errors
- Protected routes

### ✅ Animations (Framer Motion)
- Page transitions (fade in/out)
- Button hover effects (scale up)
- Button click effects (scale down)
- Form entrance animations (slide in)
- Loading spinner rotation
- Toast notifications (slide from top)

### ✅ Sound Effects (Howler.js)
- Button click sounds
- Success notification sounds
- Error notification sounds
- General notification sounds
- Enable/disable via .env

### ✅ UI/UX
- Dark theme (professional gaming look)
- Blue/green color scheme
- Responsive design (mobile-ready)
- Loading states
- Error handling
- Toast notifications
- Password show/hide toggle

---

## 🔧 TROUBLESHOOTING:

### Issue: "Cannot find module..."
**Solution:** Run `npm install` again

### Issue: "Port 3000 is already in use"
**Solution:** Kill the process or change port:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: "Network Error" when logging in
**Solution:** 
1. Check if backend is running on http://localhost:5000
2. Check `.env` file has correct `REACT_APP_API_URL`
3. Check backend logs for errors

### Issue: Tailwind styles not working
**Solution:**
1. Make sure `tailwind.config.js` exists
2. Make sure `postcss.config.js` exists
3. Restart the dev server: `npm start`

### Issue: Sounds not playing
**Solution:**
1. Check if sound files exist in `public/sounds/`
2. Check if `REACT_APP_ENABLE_SOUNDS=true` in `.env`
3. Check browser console for errors
4. **Note:** Sounds are optional - app works without them

### Issue: Login/Register not working
**Solution:**
1. Open browser console (F12)
2. Check "Network" tab
3. Look for API request errors
4. Common causes:
   - Backend not running
   - Wrong API URL in .env
   - CORS errors (check backend CORS config)

---

## 🔐 SECURITY NOTES:

✅ JWT stored in localStorage (key: "domino_token")
✅ Tokens automatically attached to API requests
✅ Auto-logout on 401 errors
✅ Password validation (min 6 chars)
✅ Username validation (3-20 chars, alphanumeric + underscore)
✅ Email validation
✅ XSS protection (React sanitizes by default)
✅ CSRF tokens (will add in production)

---

## 📝 WHAT'S NEXT? (PHASE 2)

Once Phase 1 is working perfectly, we'll build:

### Phase 2: Wallet System
- Display wallet balance
- Transaction history
- Deposit/Withdraw UI
- Real-time balance updates

---

## 🆘 GETTING HELP:

If you encounter any issues:

1. **Check the console:** Browser DevTools (F12) → Console tab
2. **Check the network:** DevTools → Network tab
3. **Check backend logs:** Look at your backend terminal
4. **Take screenshots** of any errors
5. **Send me:**
   - Error message
   - Console logs
   - Network tab (if API error)
   - What you were trying to do

---

## ✅ SUCCESS CHECKLIST:

Before moving to Phase 2, verify:

- [ ] `npm install` completed successfully
- [ ] Backend is running on http://localhost:5000
- [ ] Frontend starts with `npm start`
- [ ] Home page loads at http://localhost:3000
- [ ] Registration works (creates user in database)
- [ ] Login works (receives JWT token)
- [ ] Dashboard shows after login
- [ ] Navbar shows username when logged in
- [ ] Logout works
- [ ] Protected routes redirect to /login
- [ ] Toast notifications appear
- [ ] Animations work smoothly
- [ ] Mobile view looks good
- [ ] No console errors

---

## 🎯 PHASE 1 STATUS: READY FOR TESTING

**Everything is configured and ready to go!**

Just run:
```bash
npm install
npm start
```

And start testing! 🚀

---

**Good luck! Let me know when Phase 1 is working so we can move to Phase 2!** 🎉
