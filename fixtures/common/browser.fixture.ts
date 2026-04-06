import { test as base, Page } from '@playwright/test';

type BrowserFixture = {
    page: Page;
};

export const test = base.extend<BrowserFixture>({
    page: async ({ browser }, use) => {
        const context = await browser.newContext({
            acceptDownloads: true,
        });

        const page = await context.newPage();

        await use(page);

        await context.close();
    },
});

export { expect } from '@playwright/test';
