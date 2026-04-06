import { test as base } from '@fixtures/common/browser.fixture';
import { Helpers } from '@utils/utils/helpers';
import { LoginPage } from '@pages/app/common/login.page';

export type PageObjectFixtures = {
    loginPage: LoginPage;
    helpers: Helpers;
};

export const test = base.extend<PageObjectFixtures>({
    helpers: async ({}, use) => {
        await use(new Helpers());
    },

    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },
});

export { expect } from '@playwright/test';
