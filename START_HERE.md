# 🚀 START HERE - GradBoard Setup

## Quick Start (10 minutes to running app)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Firebase

1. Go to https://console.firebase.google.com/
2. Create a new project called "gradboard"
3. Enable **Firestore Database** (test mode)
4. Enable **Storage** (test mode)
5. Get your config from Project Settings → General → Your apps → Web app

### Step 3: Create Environment File

```bash
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` and paste your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 4: Run the App

```bash
npm run dev
```

Open http://localhost:3000

### Step 5: Test It

1. Click "+ Add Graduate" button
2. Submit a few graduates with company names
3. Watch the logos appear and organize automatically!

## 📖 Need More Help?

- **Detailed Setup**: Read `GETTING_STARTED.md`
- **Full Documentation**: See `README.md`
- **Technical Details**: Check `PROJECT_OVERVIEW.md`
- **Deployment**: Follow `DEPLOYMENT.md`
- **File Reference**: See `FILES_INDEX.md`

## ⚡ Quick Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Run production build

# Utilities
npm run lint         # Check for code issues
```

## 🎯 What You Get

- ✅ Dynamic logo artboard with force-directed layout
- ✅ Real-time updates via Firebase Firestore
- ✅ Graduate submission form with auto-suggest
- ✅ Smooth animations and responsive design
- ✅ Dark mode aesthetic
- ✅ Production-ready code with TypeScript

## 🆘 Troubleshooting

**"Firebase error"**: Check your `.env.local` file has correct credentials

**"Port 3000 in use"**: Run on different port: `npm run dev -- -p 3001`

**"Module not found"**: Run `npm install` again

**Logos not showing**: Default gray icons will show until you upload real logos

## ✅ Checklist

- [ ] Ran `npm install` successfully
- [ ] Created Firebase project
- [ ] Enabled Firestore and Storage
- [ ] Created `.env.local` with Firebase config
- [ ] Ran `npm run dev` successfully
- [ ] Tested submission form
- [ ] Saw logos appear on artboard

## 🎉 You're Ready!

Once the checklist is complete, your GradBoard is fully functional!

**Next steps:**

- Upload real company logos (optional)
- Customize colors and sizes
- Deploy to Vercel when ready

---

**Questions?** Check the documentation files or review the code comments!
