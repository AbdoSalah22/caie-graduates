# GradBoard

A dynamic, self-organizing artboard that displays company logos sized according to how many graduates work at each company. Built with Next.js, React, TypeScript, TailwindCSS, D3.js, and Firebase.

## Features

- **Dynamic Logo Display**: Company logos are displayed with sizes proportional to the number of graduates
- **Force-Directed Layout**: Uses D3.js force simulation to automatically position logos without overlaps
- **Real-Time Updates**: Firestore listeners ensure the board updates instantly when new submissions arrive
- **Smooth Animations**: CSS transitions provide fluid movement as the layout adjusts
- **Graduate Submission Form**: Simple form with auto-suggest for existing companies
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Clean, modern dark aesthetic

## Tech Stack

### Frontend

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript** (strict mode)
- **TailwindCSS** for styling
- **D3.js** for force-directed layout

### Backend

- **Firebase Firestore** for real-time database
- **Firebase Storage** for company logos
- **Next.js API Routes** for form submissions

### Deployment

- **Vercel** (recommended)

## Project Structure

```
artboard/
├── app/
│   ├── api/
│   │   └── submit/
│   │       └── route.ts          # API endpoint for form submissions
│   ├── submit/
│   │   └── page.tsx              # Submission form page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Main artboard page
│   └── globals.css               # Global styles
├── components/
│   ├── Artboard.tsx              # Main canvas component
│   └── LogoNode.tsx              # Individual logo component
├── hooks/
│   └── useForceGraph.ts          # D3 force simulation hook
├── lib/
│   ├── firebase.ts               # Firebase initialization
│   └── constants.ts              # App constants
├── types/
│   └── index.ts                  # TypeScript interfaces
├── public/                       # Static assets
├── .env.example                  # Environment variables template
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── README.md
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd artboard
npm install
```

### 2. Firebase Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

#### Enable Firestore

1. In Firebase Console, go to **Firestore Database**
2. Click "Create database"
3. Start in **production mode** (or test mode for development)
4. Choose a location for your database

#### Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click "Get started"
3. Accept default security rules (you can modify later)

#### Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

#### Create Firestore Collections

The app will automatically create the collections when you submit the first form, but you can also manually create them:

1. In Firestore, create two collections:
   - `submissions` (documents will be auto-generated)
   - `companies` (document ID = company name)

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test the Application

1. Go to [http://localhost:3000/submit](http://localhost:3000/submit)
2. Submit a few graduates with different companies
3. Return to the home page to see the dynamic logo cloud

## Firestore Database Structure

### Collection: `submissions`

Stores each graduate submission:

```typescript
{
  name: string,           // Graduate's name
  company: string,        // Company name
  timestamp: Timestamp    // Server timestamp
}
```

### Collection: `companies`

Stores company data (document ID = company name):

```typescript
{
  count: number,          // Number of graduates
  logoUrl: string         // URL to logo image
}
```

## Uploading Company Logos

### Method 1: Firebase Console (Manual)

1. Go to Firebase Console → Storage
2. Upload logo images (PNG format recommended)
3. Get the download URL for each image
4. In Firestore → `companies` collection:
   - Find the company document
   - Update the `logoUrl` field with the download URL

### Method 2: Programmatically via Firebase Admin SDK

Create a script to bulk upload logos:

```typescript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from './lib/firebase';

async function uploadLogo(companyName: string, filePath: string) {
  const file = // ... load file from filesystem
  const storageRef = ref(storage, `logos/${companyName}.png`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  const companyRef = doc(db, 'companies', companyName);
  await updateDoc(companyRef, { logoUrl: downloadURL });
}
```

### Default Logo

New companies automatically get a default gray building icon (SVG). Replace this with actual company logos as they become available.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/gradboard.git
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables:
   - Copy all `NEXT_PUBLIC_*` variables from `.env.local`
6. Click "Deploy"

### 3. Update Firebase Settings

After deployment:

1. Go to Firebase Console → Authentication → Settings
2. Add your Vercel domain to authorized domains
3. Update CORS settings in Firebase Storage if needed

## Customization

### Adjust Logo Sizes

Edit `lib/constants.ts`:

```typescript
export const MIN_RADIUS = 40; // Minimum logo size (px)
export const SCALING_FACTOR = 8; // Size increase per graduate (px)
```

### Modify Force Simulation

Edit `hooks/useForceGraph.ts`:

```typescript
.force('charge', forceManyBody<Node>().strength(50))  // Repulsion strength
.force('collide', forceCollide<Node>().radius(d => d.radius + 5))  // Padding
```

### Change Color Scheme

Edit `app/globals.css` and TailwindCSS classes in components.

### Add More Form Fields

Edit `app/submit/page.tsx` and `app/api/submit/route.ts` to handle additional fields.

## API Routes

### POST /api/submit

Submit a new graduate entry.

**Request Body:**

```json
{
  "name": "John Doe",
  "company": "Siemens"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Submission successful",
  "data": {
    "name": "John Doe",
    "company": "Siemens"
  }
}
```

**Error Response (400/500):**

```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

## Troubleshooting

### Logos Not Appearing

- Check Firebase Storage rules allow read access
- Verify logo URLs in Firestore are accessible
- Check browser console for CORS errors

### Real-Time Updates Not Working

- Verify Firestore rules allow read access to `companies` collection
- Check browser console for Firebase connection errors
- Ensure environment variables are correctly set

### Force Layout Issues

- If logos overlap, increase collision padding in `useForceGraph.ts`
- If logos spread too far, adjust `forceManyBody` strength
- Ensure canvas dimensions are properly calculated

### Build Errors

- Run `npm install` to ensure all dependencies are installed
- Check TypeScript errors with `npm run build`
- Verify all environment variables are set

## Performance Optimization

- Logos are lazy-loaded with error fallbacks
- Force simulation stops when stable to save CPU
- Firestore listeners are cleaned up on unmount
- CSS transitions handle animations (GPU-accelerated)

## Security Considerations

### Firestore Rules (Production)

Update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to companies
    match /companies/{company} {
      allow read: if true;
      allow write: if false; // Only API can write
    }

    // Allow read access to submissions (optional)
    match /submissions/{submission} {
      allow read: if false;
      allow write: if false; // Only API can write
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /logos/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Only admin uploads
    }
  }
}
```

## Future Enhancements

- **Admin Dashboard**: Manage companies and uploads
- **Search/Filter**: Search for specific companies
- **Analytics**: Track submission trends
- **Export Data**: Download company statistics
- **Logo Upload UI**: Allow admins to upload logos via web interface
- **Animations**: Add entrance animations for new logos
- **Clustering**: Group companies by industry
- **3D Mode**: Three.js-based 3D visualization

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

Built with ❤️ using Next.js and Firebase
