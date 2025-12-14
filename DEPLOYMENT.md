# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables set in `.env.local`
- [ ] Firebase project created and configured
- [ ] Firestore database created
- [ ] Firebase Storage enabled
- [ ] Test locally with `npm run dev`
- [ ] Submit test data and verify display
- [ ] Check responsive design on mobile

## Firebase Configuration

- [ ] Update Firestore security rules (use `firestore.rules`)
- [ ] Update Storage security rules (use `storage.rules`)
- [ ] Enable billing if needed (for production usage)
- [ ] Set up Firestore indexes if needed

## Vercel Deployment

- [ ] Repository pushed to GitHub
- [ ] Vercel project created and linked
- [ ] All environment variables added to Vercel
- [ ] Domain configured (if custom domain)
- [ ] Deployment successful
- [ ] Test production URL

## Post-Deployment

- [ ] Verify real-time updates work
- [ ] Upload company logos
- [ ] Test submission form on production
- [ ] Check performance and loading times
- [ ] Monitor Firebase usage and costs
- [ ] Set up error tracking (optional: Sentry)

## Ongoing Maintenance

- [ ] Regularly update company logos
- [ ] Monitor Firestore document count
- [ ] Review Firebase billing
- [ ] Update dependencies (`npm update`)
- [ ] Back up Firestore data
