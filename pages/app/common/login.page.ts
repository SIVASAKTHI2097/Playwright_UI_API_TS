import { Page, Locator } from '@playwright/test';
import { BasePage } from '@pages/app/common/base.page';

/**
 * This is the page object for the Login Page.
 * @export
 * @class LoginPage
 * @extends {BasePage}
 */
export class LoginPage extends BasePage {
    constructor(protected page: Page) {
        super(page);
    }

    //#region Login In Locators

    /** Sign in text box locator in oauth sign in page */
    private get signIn(): Locator {
        return this.page.getByRole('textbox', { name: 'Sign in with your email address' });
    }

    /** Enter password text box locator in oauth sign in page */
    private get passWord(): Locator {
        return this.page.getByPlaceholder('Password');
    }

    /** Next Button in oauth sign in page */
    private get nxtBtn(): Locator {
        return this.page.getByRole('button', { name: 'Next' });
    }

    /** Next and login button Locators in oauth sign in page */
    private get nextAndLogin(): Locator {
        return this.page.getByRole('button', { name: 'Sign in' });
    }

    /** Logout Icon Button */
    private get logoutIcon(): Locator {
        return this.page.locator('#UserBtn');
    }

    /** Sign Out Button */
    private get signOut(): Locator {
        return this.page.getByRole('link', { name: 'Sign out' });
    }

    //#endregion

    //#region Methods

    /**
     * Visit a URL
     */
    async visit(url: string): Promise<void> {
        await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    }

    /**
     * This method will login to based on the provided credentials
     *
     * @param {string} email - Pass the email address.
     * @param {string} passWord - pass the password.
     */
    async userLogin(email: string, passWord: string): Promise<void> {
        await this.type(this.signIn, email);
        await this.click(this.nxtBtn);
        await this.type(this.passWord, passWord);
        await this.click(this.nextAndLogin);
        await this.waitForInitialReadyUsingJs(180000);
    }

    /** Logout from the application */
    async userLogout(): Promise<void> {
        await this.click(this.logoutIcon);
        await this.click(this.signOut);
    }
    //#endregion
}
