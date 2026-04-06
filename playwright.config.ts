import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * STEP 0:
 * Load environment variables (.env.uat, .env.dev, etc.)
 */
if (!process.env.CI) {
    const envName = process.env.ENVIRONMENT ?? 'QA';
    const environmentPath = path.resolve(__dirname, `./env/.env.${envName}`);
    dotenv.config({ path: environmentPath });
}

/**
 * STEP 1:
 * Playwright configuration
 */
export default defineConfig({
    // NEW: Global setup (RUN_ID generation)
    // globalSetup: './global-setup',
    globalTeardown: './global-teardown',

    testDir: './tests',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if test.only is left */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only */
    retries: process.env.CI ? 1 : 0, //CI/Local

    /* Workers */
    workers: process.env.CI ? 4 : 4, //CI/Local

    /* Reporter */
    reporter: [['html'], ['allure-playwright']],

    /* Timeouts */
    timeout: 2000_000,
    expect: {
        timeout: 2000_000,
    },

    use: {
        trace: 'retain-on-failure',
        headless: true,
        actionTimeout: 2000_000,
        navigationTimeout: 2000_000,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        viewport: { width: 1920, height: 1200 },
    },

    /* Projects */
    projects: [
        {
            name: 'Sivasakthi-Automation',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
