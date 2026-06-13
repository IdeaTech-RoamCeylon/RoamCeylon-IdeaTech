const jwt = require('jsonwebtoken');

// Create a dummy JWT token for local testing (matches what NhostJwtGuard expects)
const dummyToken = jwt.sign(
  {
    sub: 'test-guide-user-123',
    'https://hasura.io/jwt/claims': {
      'x-hasura-default-role': 'user'
    }
  },
  'dummy-secret-key', // Secret doesn't matter since the guard doesn't verify the signature
  { expiresIn: '1h' }
);

async function runTests() {
  const baseUrl = 'http://localhost:3001/tour-guide';
  const headers = {
    'Authorization': `Bearer ${dummyToken}`,
    'Content-Type': 'application/json'
  };

  console.log('1. Fetching dashboard stats...');
  const dashboardRes = await fetch(`${baseUrl}/dashboard`, { headers });
  console.log('Dashboard Status:', dashboardRes.status);
  console.log('Dashboard Data:', await dashboardRes.json());

  console.log('\n2. Creating a test package...');
  const createPackageRes = await fetch(`${baseUrl}/packages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Test Package',
      category: 'CULTURE',
      duration: 3,
      price: 150
    })
  });
  console.log('Create Package Status:', createPackageRes.status);
  const pkgData = await createPackageRes.json();
  console.log('Create Package Data:', pkgData);

  if (pkgData.id) {
    console.log('\n3. Creating a test booking...');
    const createBookingRes = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        packageId: pkgData.id,
        customerName: 'John Doe',
        tourName: pkgData.name,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString()
      })
    });
    console.log('Create Booking Status:', createBookingRes.status);
    console.log('Create Booking Data:', await createBookingRes.json());
  }
}

runTests().catch(console.error);
