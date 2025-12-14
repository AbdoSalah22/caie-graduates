# Quick Start Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Firebase

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Enable Firebase Storage
4. Get your Firebase config from Project Settings

## 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials.

## 4. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## 5. Test the App

1. Visit http://localhost:3000/submit
2. Submit a few graduates with company names
3. Go back to home page to see the dynamic logo cloud

## 6. Upload Company Logos (Optional)

- Place logos in `public/logos/` folder
- Use the script in `scripts/uploadLogos.js` to bulk upload
- Or manually upload via Firebase Console → Storage

## Next Steps

- Read the full [README.md](README.md) for detailed instructions
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for deployment checklist
- Customize colors and sizes in `lib/constants.ts`

## Common Issues

**Logos not showing?**

- Default gray icons will appear until you upload actual logos
- Check Firebase Storage security rules allow public read access

**Real-time updates not working?**

- Verify Firestore security rules allow read access to `companies` collection
- Check browser console for Firebase errors

**Build errors?**

- Run `npm install` to ensure all dependencies are installed
- Check that all environment variables are set correctly
