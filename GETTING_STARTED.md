# Getting Started with GradBoard

Welcome! This guide will get you up and running quickly.

## Prerequisites

- Node.js 18+ installed
- A Google account for Firebase
- Git (optional, for version control)

## Step-by-Step Setup

### 1. Install Dependencies (2 minutes)

Open your terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including Next.js, React, Firebase, D3.js, and TailwindCSS.

### 2. Create Firebase Project (5 minutes)

1. **Go to Firebase Console**

   - Visit https://console.firebase.google.com/
   - Click "Add project" or "Create a project"
   - Enter project name: "gradboard" (or your choice)
   - Disable Google Analytics (optional for this project)
   - Click "Create project"

2. **Enable Firestore Database**

   - In your Firebase project, click "Firestore Database" in the left menu
   - Click "Create database"
   - Select "Start in test mode" (we'll secure it later)
   - Choose a location (e.g., us-central)
   - Click "Enable"

3. **Enable Firebase Storage**

   - Click "Storage" in the left menu
   - Click "Get started"
   - Start in test mode
   - Click "Done"

4. **Get Firebase Configuration**
   - Click the gear icon (⚙️) → "Project settings"
   - Scroll down to "Your apps" section
   - Click the web icon (`</>`) to add a web app
   - Enter app nickname: "GradBoard Web"
   - Don't check "Firebase Hosting"
   - Click "Register app"
   - Copy the `firebaseConfig` object that appears

### 3. Configure Environment Variables (1 minute)

1. **Copy the example file**

   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`**
   Open `.env.local` and paste your Firebase configuration:

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradboard-xxxxx.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradboard-xxxxx
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradboard-xxxxx.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

### 4. Start Development Server (30 seconds)

```bash
npm run dev
```

You should see:

```
✓ Ready on http://localhost:3000
```

### 5. Test the Application (2 minutes)

1. **Open the app**

   - Go to http://localhost:3000
   - You'll see an empty artboard (no companies yet)

2. **Submit your first graduate**

   - Click the "+ Add Graduate" button (bottom right)
   - Or go directly to http://localhost:3000/submit
   - Enter:
     - Name: "John Doe"
     - Company: "Siemens"
   - Click "Submit"
   - You'll be redirected back to the home page

3. **See the logo appear**

   - A gray building icon will appear (default logo)
   - This represents Siemens with 1 graduate

4. **Add more submissions**
   - Submit a few more graduates with different companies:
     - "Jane Smith" at "Google"
     - "Bob Johnson" at "Siemens" (same company)
     - "Alice Brown" at "Microsoft"
5. **Watch the magic happen**
   - Logos will automatically position themselves
   - Siemens logo will grow larger (2 graduates now)
   - Logos will spread out without overlapping
   - Smooth animations as the layout adjusts

### 6. Verify Firestore Data (Optional)

Go back to Firebase Console:

- Click "Firestore Database"
- You should see two collections:
  - `companies` - with documents for each company
  - `submissions` - with all graduate submissions

## What's Next?

### Upload Real Company Logos

The default gray icons work, but you'll want real logos:

1. **Collect Logo Images**

   - Find PNG logos for your companies
   - Recommended size: 512x512px
   - Transparent background preferred

2. **Upload to Firebase Storage**

   **Option A: Firebase Console (Manual)**

   - Go to Firebase Console → Storage
   - Create a folder called "logos"
   - Upload logo files
   - Rename files to match company names (e.g., "Siemens.png")
   - Click on each file → Copy download URL
   - Go to Firestore → companies → select company
   - Update `logoUrl` field with the download URL

   **Option B: Bulk Upload Script**

   - Place logos in `public/logos/` folder
   - Name them exactly as company names (e.g., "Siemens.png")
   - Set up Firebase Admin SDK (see `scripts/uploadLogos.js`)
   - Run the bulk upload script

### Customize the App

1. **Adjust Logo Sizes**
   Edit `lib/constants.ts`:

   ```typescript
   export const MIN_RADIUS = 50; // Make minimum logos bigger
   export const SCALING_FACTOR = 10; // Grow faster per graduate
   ```

2. **Change Force Layout**
   Edit `hooks/useForceGraph.ts`:

   ```typescript
   .force('charge', forceManyBody<Node>().strength(100))  // More repulsion
   ```

3. **Customize Colors**
   Edit Tailwind classes in components or modify `app/globals.css`

### Secure Your Firebase

Update security rules:

1. **Firestore Rules**

   - Go to Firebase Console → Firestore Database → Rules
   - Copy content from `firestore.rules` file
   - Publish the rules

2. **Storage Rules**
   - Go to Firebase Console → Storage → Rules
   - Copy content from `storage.rules` file
   - Publish the rules

### Deploy to Production

When ready to deploy:

1. Push code to GitHub
2. Connect to Vercel (vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

See `DEPLOYMENT.md` for detailed deployment instructions.

## Common Issues & Solutions

### Issue: "Firebase: Error (auth/invalid-api-key)"

**Solution**: Check that your `.env.local` file has correct Firebase credentials with no extra spaces.

### Issue: Logos not appearing on the artboard

**Solution**:

- Check Firebase Console → Firestore Database
- Verify companies collection exists with documents
- Check browser console for errors

### Issue: Form submission not working

**Solution**:

- Check browser console for errors
- Verify Firestore rules allow writes (should be in test mode)
- Check network tab to see if API call succeeds

### Issue: "Module not found" errors

**Solution**: Run `npm install` again to ensure all dependencies are installed.

### Issue: Port 3000 already in use

**Solution**: Run on a different port:

```bash
npm run dev -- -p 3001
```

### Issue: Real-time updates not working

**Solution**:

- Check browser console for WebSocket connection errors
- Verify Firestore rules allow reads
- Try refreshing the page

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Clean install (if issues)
rm -rf node_modules package-lock.json
npm install
```

## File Structure Quick Reference

```
artboard/
├── app/
│   ├── page.tsx              # Main artboard page ← Start here
│   ├── submit/page.tsx       # Submission form
│   └── api/submit/route.ts   # Form API endpoint
├── components/
│   ├── Artboard.tsx          # Canvas component
│   └── LogoNode.tsx          # Individual logo
├── hooks/
│   └── useForceGraph.ts      # D3 force simulation
├── lib/
│   ├── firebase.ts           # Firebase config ← Important
│   └── constants.ts          # Adjust sizes here
├── types/
│   └── index.ts              # TypeScript types
├── .env.local                # Your Firebase credentials ← Important
└── package.json
```

## Getting Help

- Read the full [README.md](README.md) for detailed documentation
- Check [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) for technical details
- Review Firebase Console for data issues
- Check browser console for JavaScript errors

## Success Checklist

- ✅ `npm install` completed without errors
- ✅ Firebase project created
- ✅ Firestore and Storage enabled
- ✅ `.env.local` configured with Firebase credentials
- ✅ `npm run dev` runs successfully
- ✅ Can access http://localhost:3000
- ✅ Can submit a graduate via form
- ✅ Logo appears on artboard
- ✅ Multiple logos position themselves correctly

## You're Ready! 🎉

Your GradBoard is now running locally. Submit some graduates, watch the logos organize themselves, and enjoy the force-directed magic!

**Pro Tip**: Open the browser DevTools (F12) and watch the Firestore real-time updates in the Network tab. Pretty cool! 🚀

---

**Need more help?** Check the documentation files or review the code comments—everything is thoroughly documented!
