import { mergeTests } from '@playwright/test';
import { test as pageObjectTest } from '@fixtures/finance/page-object.fixture';
import { test as testDataTest } from '@fixtures/data/test-data.fixture';
import { resolveCredentials } from '@utils/utils/credential-resolver';

export const test = mergeTests(pageObjectTest, testDataTest);

test.beforeEach(async ({ loginPage }, testInfo) => {
    const creds = resolveCredentials(testInfo);
    let url = process.env.BASE_URL ?? '';
    if (!url) throw new Error('BASE_URL missing in env');

    await loginPage.visit(url);

    await loginPage.userLogin(creds.username, creds.password);
});

test.afterEach(async ({ loginPage }) => {
    await loginPage.userLogout();
});
