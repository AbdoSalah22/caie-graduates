/**
 * Example script for uploading company logos to Firebase Storage
 * 
 * This is a Node.js script that can be run separately to bulk-upload logos
 * 
 * Usage:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Download service account key from Firebase Console
 * 3. Place logos in a /logos folder with filename = company name (e.g., "Siemens.png")
 * 4. Run: node scripts/uploadLogos.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'your-project-id.appspot.com'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function uploadLogo(companyName, filePath) {
    try {
        const fileName = `logos/${companyName}.png`;

        // Upload file to Storage
        await bucket.upload(filePath, {
            destination: fileName,
            metadata: {
                contentType: 'image/png',
                cacheControl: 'public, max-age=31536000',
            },
        });

        // Get download URL
        const file = bucket.file(fileName);
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        // Update Firestore
        await db.collection('companies').doc(companyName).update({
            logoUrl: publicUrl
        });

        console.log(`✓ Uploaded logo for ${companyName}`);
        return publicUrl;
    } catch (error) {
        console.error(`✗ Failed to upload logo for ${companyName}:`, error.message);
        return null;
    }
}

async function uploadAllLogos(logosDir) {
    const files = fs.readdirSync(logosDir);

    for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg')) {
            const companyName = path.parse(file).name;
            const filePath = path.join(logosDir, file);
            await uploadLogo(companyName, filePath);
        }
    }

    console.log('\n✓ All logos uploaded!');
}

// Run the script
const logosDirectory = path.join(__dirname, '../logos');
uploadAllLogos(logosDirectory);
