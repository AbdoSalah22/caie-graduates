/**
 * Test Data Population Script
 * 
 * This script populates Firestore with sample data for testing
 * 
 * Usage:
 * 1. Ensure your .env.local file is configured
 * 2. Install dependencies: npm install
 * 3. Run: node scripts/populateTestData.js
 */

const admin = require('firebase-admin');
const testData = require('./testData');

// Note: For this script to work, you need to:
// 1. Download service account key from Firebase Console
// 2. Save it as 'serviceAccountKey.json' in the project root
// 3. Update the path below

try {
    const serviceAccount = require('../serviceAccountKey.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    });
} catch (error) {
    console.error('❌ Error: Could not load service account key.');
    console.log('\nTo use this script:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the file as "serviceAccountKey.json" in the project root');
    console.log('4. Run this script again\n');
    process.exit(1);
}

const db = admin.firestore();

async function populateTestData() {
    console.log('🚀 Starting test data population...\n');

    const batch = db.batch();
    let submissionCount = 0;
    let companyCount = 0;

    for (const company of testData.testCompanies) {
        console.log(`📊 Processing ${company.name}...`);

        // Create/update company document
        const companyRef = db.collection('companies').doc(company.name);
        batch.set(companyRef, {
            count: company.graduates.length,
            logoUrl: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23374151\'/%3E%3Cpath d=\'M30 40 h40 v30 h-40 z M40 35 h20 v5 h-20 z M35 50 h10 v5 h-10 z M55 50 h10 v5 h-10 z M35 60 h10 v5 h-10 z M55 60 h10 v5 h-10 z\' fill=\'%23555\'/%3E%3C/svg%3E'
        });
        companyCount++;

        // Create submission documents for each graduate
        for (const graduateName of company.graduates) {
            const submissionRef = db.collection('submissions').doc();
            batch.set(submissionRef, {
                name: graduateName,
                company: company.name,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
            submissionCount++;
        }

        console.log(`  ✓ Added ${company.graduates.length} graduates`);
    }

    // Commit the batch
    await batch.commit();

    console.log('\n✅ Test data population complete!');
    console.log(`📈 Statistics:`);
    console.log(`   - Companies: ${companyCount}`);
    console.log(`   - Submissions: ${submissionCount}`);
    console.log(`   - Total graduates: ${submissionCount}`);
    console.log('\n🎉 Visit http://localhost:3000 to see your data!\n');
}

// Run the script
populateTestData()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error populating test data:', error);
        process.exit(1);
    });
