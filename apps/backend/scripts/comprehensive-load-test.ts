
import { performance } from 'perf_hooks';

// CONFIGURATION
const API_URL = 'http://localhost:3000';
const TOTAL_REQUESTS = 80; // Enough to exceed 60 limit
const CONCURRENCY = 20;

async function runLoadTest() {
    console.log(`🚀 Starting Comprehensive Load Test on ${API_URL}`);

    // 1. Authenticate
    console.log('🔑 Authenticating...');
    const token = await getAuthToken();
    if (!token) {
        console.error('❌ Authentication failed. Aborting.');
        process.exit(1);
    }
    console.log('✅ Authenticated.');

    console.log(`\nTesting Throttling provided limit=60/min. Sending ${TOTAL_REQUESTS} requests...`);

    const transportResults: any[] = [];
    const aiResults: any[] = [];

    // We will send batches
    for (let i = 0; i < TOTAL_REQUESTS; i += CONCURRENCY) {
        console.log(`\n sending batch ${i} to ${i + CONCURRENCY}...`);

        const batchPromises = Array.from({ length: CONCURRENCY }).map(async (_, idx) => {
            const id = i + idx;
            // Mixed requests: Transport and AI
            const tRes = await makeRequest(`${API_URL}/transport/drivers?lat=6&lng=80&limit=5`, token, 'Transport');
            const aRes = await makeRequest(`${API_URL}/ai/search?query=beach`, token, 'AI');
            return { tRes, aRes };
        });

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(r => {
            transportResults.push(r.tRes);
            aiResults.push(r.aRes);
        });

        // Small delay between batches to be realistic but fast enough to hit rate limit
        await new Promise(r => setTimeout(r, 500));
    }

    printAnalysis('Transport API', transportResults);
    printAnalysis('AI Planner API', aiResults);
}

async function getAuthToken() {
    try {
        const res = await fetch(`${API_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: '+94771234567', otp: '1234' })
        });
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        return data.accessToken;
    } catch (e) {
        console.error('Auth Error:', e);
        return null;
    }
}

async function makeRequest(url: string, token: string, label: string) {
    const start = performance.now();
    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const duration = performance.now() - start;
        return { success: res.ok, status: res.status, duration };
    } catch (e) {
        return { success: false, status: 0, duration: performance.now() - start };
    }
}

function printAnalysis(name: string, results: any[]) {
    const total = results.length;
    const ok = results.filter(r => r.status === 200 || r.status === 201).length;
    const rateLimited = results.filter(r => r.status === 429).length;
    const failures = results.filter(r => r.status !== 200 && r.status !== 201 && r.status !== 429).length;
    const avgTime = results.reduce((a, b) => a + b.duration, 0) / total;

    console.log(`\n📊 ${name} Results:`);
    console.log(`   Total: ${total}`);
    console.log(`   ✅ OK (2xx): ${ok}`);
    console.log(`   ⛔ Rate Limited (429): ${rateLimited}`);
    console.log(`   ❌ Failed (Other): ${failures}`);
    console.log(`   ⏱ Avg Duration: ${avgTime.toFixed(2)}ms`);

    if (rateLimited > 0) {
        console.log(`   ✅ Throttling IS working on ${name}.`);
    } else {
        console.log(`   ⚠️ Throttling NOT triggered on ${name} (Expected if limit > traffic, or check config).`);
    }
}

runLoadTest().catch(console.error);
