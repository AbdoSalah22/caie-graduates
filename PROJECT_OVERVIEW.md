# GradBoard - Project Overview

## 🎯 What is GradBoard?

GradBoard is a dynamic, self-organizing artboard that visualizes company logos sized proportionally to how many graduates work at each company. It's similar to Slido word clouds, but with company logos instead of words.

## ✨ Key Features

1. **Dynamic Logo Sizing**: Logos scale based on graduate count
2. **Force-Directed Layout**: Automatic positioning with no overlaps using D3.js
3. **Real-Time Updates**: Instant updates when new submissions arrive via Firestore
4. **Smooth Animations**: Fluid transitions as the layout adjusts
5. **Simple Submission Form**: Graduate name + company with auto-suggest
6. **Dark Modern Design**: Clean aesthetic with TailwindCSS
7. **Responsive**: Works on all devices

## 📁 Complete File List

### Configuration Files

- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration (strict mode)
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - TailwindCSS configuration
- `postcss.config.js` - PostCSS configuration
- `.eslintrc.json` - ESLint rules
- `.gitignore` - Git ignore rules
- `.env.example` - Environment variables template

### Application Files

#### Core App (`/app`)

- `app/layout.tsx` - Root layout with metadata
- `app/page.tsx` - Main artboard page with Firestore listener
- `app/globals.css` - Global styles and Tailwind directives
- `app/submit/page.tsx` - Graduate submission form with auto-suggest
- `app/api/submit/route.ts` - API endpoint for form submissions

#### Components (`/components`)

- `components/Artboard.tsx` - Main canvas component managing force simulation
- `components/LogoNode.tsx` - Individual logo component with hover effects

#### Hooks (`/hooks`)

- `hooks/useForceGraph.ts` - Custom hook for D3.js force simulation

#### Library (`/lib`)

- `lib/firebase.ts` - Firebase initialization (Firestore + Storage)
- `lib/constants.ts` - App constants (logo sizes, defaults)
- `lib/utils.ts` - Utility functions

#### Types (`/types`)

- `types/index.ts` - TypeScript interfaces (Node, Company, Submission)

#### Scripts (`/scripts`)

- `scripts/uploadLogos.js` - Bulk logo upload script
- `scripts/tsconfig.json` - TypeScript config for scripts

#### Public Assets (`/public`)

- `public/logos/README.md` - Instructions for logo management

#### Documentation

- `README.md` - Comprehensive documentation
- `QUICKSTART.md` - Quick start guide
- `DEPLOYMENT.md` - Deployment checklist

#### Firebase Configuration

- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules

## 🔧 How It Works

### Data Flow

1. **Submission**:

   - User fills form at `/submit`
   - Form calls `POST /api/submit`
   - API creates submission in Firestore `submissions` collection
   - API updates/creates company in `companies` collection
   - Company `count` increments

2. **Display**:

   - Main page sets up Firestore listener on `companies`
   - On data change, converts companies to nodes
   - Calculates radius: `MIN_RADIUS + count * SCALING_FACTOR`
   - Passes nodes to `<Artboard>`

3. **Force Simulation**:

   - `useForceGraph` hook initializes D3 force simulation
   - Forces applied:
     - `forceCenter`: Pull toward center
     - `forceManyBody`: Repulsion between nodes
     - `forceCollide`: Prevent overlaps (respects radius + padding)
   - Simulation updates node positions on each tick
   - React re-renders with new positions

4. **Rendering**:
   - `<LogoNode>` renders each logo with absolute positioning
   - CSS transitions provide smooth movement
   - Hover shows company name and graduate count

### Force Layout Details

```typescript
forceSimulation<Node>(nodes)
  .force("center", forceCenter(width / 2, height / 2)) // Center gravity
  .force("charge", forceManyBody<Node>().strength(50)) // Repulsion
  .force(
    "collide",
    forceCollide<Node>().radius((d) => d.radius + 5)
  ); // Collision
```

- **Center force**: Pulls all nodes toward canvas center
- **Many-body force**: Creates repulsion (strength=50) to spread logos
- **Collide force**: Prevents overlaps with 5px padding

### Logo Sizing Formula

```typescript
radius = 40 + count * 8;
```

- Minimum radius: 40px (even with 1 graduate)
- Scaling factor: 8px per graduate
- A company with 10 graduates: 40 + 80 = 120px diameter

## 🎨 Visual Design

- **Background**: Dark gradient (gray-900 → black → gray-900)
- **Logos**: Rounded corners with shadow effects
- **Hover**: Increased shadow + tooltip with company info
- **Transitions**: 700ms ease-out for smooth movement
- **Typography**: Inter font, white on dark
- **Buttons**: Blue accents with hover scaling

## 🔐 Security

### Firestore Rules

- **companies**: Read by all, write by API only
- **submissions**: No public access, write by API only

### Storage Rules

- **logos**: Read by all, write by admin only

### API Validation

- Input sanitization (trim, length checks)
- Type validation
- Server-side timestamp generation

## 📊 Database Schema

### Collection: `companies`

```
Document ID: "Siemens" (company name)
Fields:
  - count: 15 (number)
  - logoUrl: "https://..." (string)
```

### Collection: `submissions`

```
Auto-generated document ID
Fields:
  - name: "John Doe" (string)
  - company: "Siemens" (string)
  - timestamp: (server timestamp)
```

## 🚀 Performance Optimizations

1. **Force Simulation**: Stops when stable to save CPU
2. **CSS Transitions**: GPU-accelerated animations
3. **Lazy Loading**: Images load on-demand with error fallbacks
4. **Firestore Listeners**: Efficient real-time subscriptions
5. **React Hooks**: Proper cleanup to prevent memory leaks
6. **Next.js**: Server-side rendering + automatic code splitting

## 📦 Dependencies

### Core

- `next` - React framework with App Router
- `react` & `react-dom` - UI library
- `typescript` - Type safety

### Firebase

- `firebase` - Firestore + Storage

### Visualization

- `d3-force` - Force-directed graph layout
- `@types/d3-force` - TypeScript types

### Styling

- `tailwindcss` - Utility-first CSS
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixes

## 🎯 Key Implementation Details

### Real-Time Listener

```typescript
const unsubscribe = onSnapshot(
  query(collection(db, "companies")),
  (snapshot) => {
    // Update nodes
  }
);
return () => unsubscribe(); // Cleanup
```

### Force Simulation Hook

```typescript
useEffect(() => {
  const simulation = forceSimulation(nodes)
    .force("center", forceCenter(w / 2, h / 2))
    .on("tick", () => setSimulatedNodes([...nodes]));
  return () => simulation.stop();
}, [nodes, width, height]);
```

### API Route Structure

```typescript
export async function POST(request: NextRequest) {
  // 1. Validate input
  // 2. Add to submissions collection
  // 3. Update/create company document
  // 4. Return success
}
```

## 🎨 Customization Points

1. **Logo Sizes**: Edit `MIN_RADIUS` and `SCALING_FACTOR` in `lib/constants.ts`
2. **Force Strength**: Adjust `.strength()` values in `useForceGraph.ts`
3. **Colors**: Modify Tailwind classes and `globals.css`
4. **Animation Speed**: Change `duration-700` to other values
5. **Form Fields**: Add more fields to submission form and API

## 📈 Scalability

- Firestore: Handles millions of documents
- Storage: Unlimited file storage
- Force Simulation: Performs well up to ~100 nodes
- Real-time: Efficient subscriptions with Firestore

## 🐛 Debugging Tips

1. **Check Firebase Console**: View collections and documents
2. **Browser DevTools**: Check console for errors
3. **Network Tab**: Monitor API calls and Firestore requests
4. **React DevTools**: Inspect component state
5. **Force Layout**: Log node positions to debug layout issues

## 🎓 Learning Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [D3 Force](https://d3js.org/d3-force)
- [TailwindCSS](https://tailwindcss.com/docs)

## ✅ Testing Checklist

- [ ] Submit form with new company
- [ ] Submit form with existing company
- [ ] Verify count increments
- [ ] Check real-time updates
- [ ] Test auto-suggest
- [ ] Verify logo sizing
- [ ] Check no overlaps
- [ ] Test responsive design
- [ ] Verify smooth animations
- [ ] Test error handling

---

## 🎉 Ready to Deploy!

Your complete GradBoard application is ready. Follow the QUICKSTART.md to get started, then use DEPLOYMENT.md when ready to deploy to production.

**Next Steps:**

1. Run `npm install`
2. Configure Firebase
3. Set up `.env.local`
4. Run `npm run dev`
5. Test locally
6. Deploy to Vercel

Good luck with your GradBoard! 🚀
