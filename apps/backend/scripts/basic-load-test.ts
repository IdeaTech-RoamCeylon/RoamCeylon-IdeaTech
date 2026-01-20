
import { performance } from 'perf_hooks';

// CONFIGURATION
const API_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 20;
const TOTAL_BATCHES = 3;

async function runLoadTest() {
    console.log(`🚀 Starting Load Test on ${API_URL}`);
    console.log(`Concurrency: ${CONCURRENT_REQUESTS}, Batches: ${TOTAL_BATCHES}`);

    for (let i = 0; i < TOTAL_BATCHES; i++) {
        console.log(`\n[Batch ${i + 1}/${TOTAL_BATCHES}] Sending ${CONCURRENT_REQUESTS} requests...`);

        const start = performance.now();
        const promises = Array.from({ length: CONCURRENT_REQUESTS }).map((_, idx) =>
            makeRequest(idx)
        );

        const results = await Promise.all(promises);
        const end = performance.now();

        const duration = (end - start).toFixed(2);
        const successes = results.filter(r => r.success).length;
        const failures = results.filter(r => !r.success).length;

        console.log(`Batch finished in ${duration}ms`);
        console.log(`✅ Success: ${successes}`);
        console.log(`❌ Failed: ${failures}`);
    }
}

async function makeRequest(id: number) {
    try {
        // Simulate a transport lookup (Publicly accessible if we had a public endpoint, 
        // but Transport is guarded. We'll test a health/public endpoint or simulate auth failure to test load)
        // Actually, let's hit the 'auth/send-otp' endpoint as it triggers logic but is public
        // Or we can hit 'transport/drivers' and expect 401, which still tests server throughput

        const start = performance.now();
        const res = await fetch(`${API_URL}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNumber: `+947700000${id}` })
        });
        const end = performance.now();

        return {
            id,
            success: res.ok || res.status === 429 || res.status === 400 || res.status === 401, // 429/400/401 counts as "server handled it"
            status: res.status,
            duration: end - start
        };
    } catch (err) {
        return { id, success: false, status: 0, duration: 0 };
    }
}

runLoadTest().catch(console.error);
