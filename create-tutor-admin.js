/**
 * Quick script to create a tutor admin account
 * Run with: node create-tutor-admin.js your-email@example.com "Your Name"
 */

const email = process.argv[2];
const name = process.argv[3] || 'Tutor Admin';

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: node create-tutor-admin.js your-email@example.com "Your Name"');
  process.exit(1);
}

// Get API URL from environment or use default
const API_URL = process.env.API_URL || 'https://mobilaws-backend.vercel.app/api';

async function createTutorAdmin() {
  try {
    console.log(`📧 Creating tutor admin for: ${email}`);
    console.log(`🌐 Using API: ${API_URL}`);
    
    const response = await fetch(`${API_URL}/tutor-admin/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        name: name,
        specializations: ['General Law'],
        bio: 'Tutor admin account',
      }),
    });

    const data = await response.json();

    if (data.success && data.tutor) {
      console.log('✅ Tutor admin created successfully!');
      console.log(`   ID: ${data.tutor.id}`);
      console.log(`   Email: ${data.tutor.email}`);
      console.log(`   Name: ${data.tutor.name}`);
      console.log('\n🎉 You can now access the tutor admin portal at:');
      console.log('   https://www.mobilaws.com/tutor-admin');
    } else if (data.tutor) {
      console.log('ℹ️  Tutor admin already exists!');
      console.log(`   ID: ${data.tutor.id}`);
      console.log(`   Email: ${data.tutor.email}`);
      console.log(`   Name: ${data.tutor.name}`);
      console.log('\n✅ You can access the tutor admin portal at:');
      console.log('   https://www.mobilaws.com/tutor-admin');
    } else {
      console.error('❌ Failed to create tutor admin:', data.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error creating tutor admin:', error.message);
    console.log('\n💡 Alternative: Create manually in Firebase Console:');
    console.log('   1. Go to Firebase Console → Firestore Database');
    console.log('   2. Create collection: tutorAdmins');
    console.log('   3. Add document with:');
    console.log(`      email: "${email}"`);
    console.log(`      name: "${name}"`);
    console.log('      active: true');
    console.log('      createdAt: [current timestamp]');
    console.log('      updatedAt: [current timestamp]');
    process.exit(1);
  }
}

createTutorAdmin();

