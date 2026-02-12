#!/usr/bin/env ts-node

/**
 * Load Testing Script for Backend Day 42
 *
 * This script simulates:
 * 1. Repeated planner calls (50 sequential requests)
 * 2. Multiple concurrent users with preferences (20 concurrent users)
 *
 * Usage:
 *   1. Start the backend: npm run start:dev
 *   2. Run this script: npx ts-node scripts/load-test.ts
 *
 * Requirements:
 *   - Backend must be running on http://localhost:3000 (or set BASE_URL env var)
 *   - Valid test user credentials
 */

interface TestConfig {
    baseUrl: string;
    testEmail: string;
    testPassword: string;
    plannerIterations: number;
    concurrentUsers: number;
}

interface TestResult {
    success: number;
    failed: number;
    totalTime: number;
    avgResponseTime: number;
    errors: string[];
}

class LoadTester {
    private config: TestConfig;
    private authToken: string | null = null;

    constructor(config: TestConfig) {
        this.config = config;
    }

    /**
     * Authenticate and get JWT token
     */
    async authenticate(): Promise<void> {
        console.log('🔐 Authenticating...');

        try {
            const response = await fetch(`${this.config.baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: this.config.testEmail,
                    password: this.config.testPassword,
                }),
            });

            if (!response.ok) {
                throw new Error(`Authentication failed: ${response.statusText}`);
            }

            const data = (await response.json()) as { accessToken: string };
            this.authToken = data.accessToken;
            console.log('✅ Authentication successful\n');
        } catch (error) {
            console.error('❌ Authentication failed:', error);
            throw error;
        }
    }

    /**
     * Test 1: Repeated planner calls
     */
    async testRepeatedPlannerCalls(): Promise<TestResult> {
        console.log(
            `📊 Test 1: Simulating ${this.config.plannerIterations} sequential planner calls...\n`,
        );

        const result: TestResult = {
            success: 0,
            failed: 0,
            totalTime: 0,
            avgResponseTime: 0,
            errors: [],
        };

        const startTime = Date.now();

        for (let i = 0; i < this.config.plannerIterations; i++) {
            const tripData = {
                name: `Load Test Trip ${i + 1}`,
                destination: 'Colombo',
                startDate: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000,
                ).toISOString(),
                endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
                itinerary: {
                    days: [
                        { day: 1, activities: ['Beach visit', 'Temple tour'] },
                        { day: 2, activities: ['City tour'] },
                    ],
                },
                preferences: {
                    budget: i % 3 === 0 ? 'low' : i % 3 === 1 ? 'medium' : 'high',
                    interests: ['beach', 'culture', 'food'],
                    travelStyle: 'moderate',
                    accessibility: false,
                },
            };

            const requestStart = Date.now();

            try {
                const response = await fetch(`${this.config.baseUrl}/planner/save`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${this.authToken}`,
                    },
                    body: JSON.stringify(tripData),
                });

                const requestTime = Date.now() - requestStart;
                result.totalTime += requestTime;

                if (response.ok) {
                    result.success++;
                    process.stdout.write(`✓`);
                } else {
                    result.failed++;
                    const errorText = await response.text();
                    result.errors.push(
                        `Request ${i + 1}: ${response.status} - ${errorText}`,
                    );
                    process.stdout.write(`✗`);
                }
            } catch (error) {
                result.failed++;
                result.errors.push(`Request ${i + 1}: ${String(error)}`);
                process.stdout.write(`✗`);
            }

            // Add small delay to avoid overwhelming the server
            if (i < this.config.plannerIterations - 1) {
                await new Promise((resolve) => setTimeout(resolve, 50));
            }
        }

        const totalTime = Date.now() - startTime;
        result.avgResponseTime =
            result.totalTime / (result.success + result.failed);

        console.log(`\n\n📈 Test 1 Results:`);
        console.log(`   Total requests: ${result.success + result.failed}`);
        console.log(`   Successful: ${result.success}`);
        console.log(`   Failed: ${result.failed}`);
        console.log(`   Total time: ${totalTime}ms`);
        console.log(`   Avg response time: ${result.avgResponseTime.toFixed(2)}ms`);
        console.log(
            `   Success rate: ${((result.success / (result.success + result.failed)) * 100).toFixed(2)}%\n`,
        );

        if (result.errors.length > 0) {
            console.log(`   Errors (first 5):`);
            result.errors.slice(0, 5).forEach((err) => console.log(`   - ${err}`));
            console.log();
        }

        return result;
    }

    /**
     * Test 2: Multiple concurrent users updating preferences
     */
    async testConcurrentUserUpdates(): Promise<TestResult> {
        console.log(
            `👥 Test 2: Simulating ${this.config.concurrentUsers} concurrent user updates...\n`,
        );

        const result: TestResult = {
            success: 0,
            failed: 0,
            totalTime: 0,
            avgResponseTime: 0,
            errors: [],
        };

        const startTime = Date.now();

        // Create array of concurrent update promises
        const promises = Array.from(
            { length: this.config.concurrentUsers },
            async (_, i) => {
                const userData = {
                    name: `Test User ${i + 1}`,
                    birthday: `199${i % 10}-0${(i % 9) + 1}-15`,
                    gender: i % 3 === 0 ? 'Male' : i % 3 === 1 ? 'Female' : 'Other',
                };

                const requestStart = Date.now();

                try {
                    const response = await fetch(`${this.config.baseUrl}/users/me`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${this.authToken}`,
                        },
                        body: JSON.stringify(userData),
                    });

                    const requestTime = Date.now() - requestStart;
                    result.totalTime += requestTime;

                    if (response.ok) {
                        result.success++;
                        process.stdout.write(`✓`);
                        return { success: true, time: requestTime };
                    } else {
                        result.failed++;
                        const errorText = await response.text();
                        result.errors.push(
                            `User ${i + 1}: ${response.status} - ${errorText}`,
                        );
                        process.stdout.write(`✗`);
                        return { success: false, time: requestTime };
                    }
                } catch (error) {
                    result.failed++;
                    result.errors.push(`User ${i + 1}: ${String(error)}`);
                    process.stdout.write(`✗`);
                    return { success: false, time: 0 };
                }
            },
        );

        // Execute all promises concurrently
        await Promise.all(promises);

        const totalTime = Date.now() - startTime;
        result.avgResponseTime =
            result.totalTime / (result.success + result.failed);

        console.log(`\n\n📈 Test 2 Results:`);
        console.log(`   Total requests: ${result.success + result.failed}`);
        console.log(`   Successful: ${result.success}`);
        console.log(`   Failed: ${result.failed}`);
        console.log(`   Total time: ${totalTime}ms`);
        console.log(`   Avg response time: ${result.avgResponseTime.toFixed(2)}ms`);
        console.log(
            `   Success rate: ${((result.success / (result.success + result.failed)) * 100).toFixed(2)}%\n`,
        );

        if (result.errors.length > 0) {
            console.log(`   Errors (first 5):`);
            result.errors.slice(0, 5).forEach((err) => console.log(`   - ${err}`));
            console.log();
        }

        return result;
    }

    /**
     * Run all tests
     */
    async runTests(): Promise<void> {
        console.log('🚀 Starting Load Tests\n');
        console.log('='.repeat(60));
        console.log();

        try {
            await this.authenticate();

            const test1 = await this.testRepeatedPlannerCalls();
            const test2 = await this.testConcurrentUserUpdates();

            console.log('='.repeat(60));
            console.log('\n✅ All tests completed!\n');

            // Overall summary
            const totalRequests =
                test1.success + test1.failed + test2.success + test2.failed;
            const totalSuccess = test1.success + test2.success;
            const totalFailed = test1.failed + test2.failed;

            console.log('📊 Overall Summary:');
            console.log(`   Total requests: ${totalRequests}`);
            console.log(`   Successful: ${totalSuccess}`);
            console.log(`   Failed: ${totalFailed}`);
            console.log(
                `   Overall success rate: ${((totalSuccess / totalRequests) * 100).toFixed(2)}%`,
            );

            if (totalFailed > 0) {
                console.log(
                    '\n⚠️  Some tests failed. Check the errors above for details.',
                );
                process.exit(1);
            } else {
                console.log('\n🎉 All tests passed successfully!');
                process.exit(0);
            }
        } catch (error) {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        }
    }
}

// Main execution
const config: TestConfig = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    testEmail: process.env.TEST_EMAIL || 'test@example.com',
    testPassword: process.env.TEST_PASSWORD || 'password123',
    plannerIterations: parseInt(process.env.PLANNER_ITERATIONS || '50', 10),
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '20', 10),
};

console.log('⚙️  Configuration:');
console.log(`   Base URL: ${config.baseUrl}`);
console.log(`   Test Email: ${config.testEmail}`);
console.log(`   Planner Iterations: ${config.plannerIterations}`);
console.log(`   Concurrent Users: ${config.concurrentUsers}`);
console.log();

const tester = new LoadTester(config);
tester.runTests();
