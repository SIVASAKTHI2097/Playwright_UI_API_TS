import { Page, Locator } from '@playwright/test';

//#region Timeouts
/** Centralized timeout configuration for UI interactions. */
export const Timeouts = {
    DEFAULT: 7000,
    LONG: 30000,
    VERY_LONG: 45000,
};

/** Standard wait states for UI element synchronization. */
export enum WaitState {
    VISIBLE = 'visible',
    HIDDEN = 'hidden',
    ATTACHED = 'attached',
    DETACHED = 'detached',
}
//#endregion

/**
 * This is the base page object for all pages.
 * @export
 * @class BasePage
 * @extends {Page}
 */
export class BasePage {
    constructor(protected page: Page) {}

    //#region Locators
    //#endregion

    //#region Methods

    /** Reloads the current page */
    protected async reload(): Promise<void> {
        await this.page.reload();
    }

    /** Navigates back from current page */
    protected async goBack(): Promise<void> {
        await this.page.goBack();
    }

    /** Navigates forward from current page */
    protected async goForward(): Promise<void> {
        await this.page.goForward();
    }

    /** Wait for the page ready */
    protected async waitForPageReady(): Promise<void> {
        await this.page.waitForLoadState('networkidle');
    }

    /** Wait for a locator to reach a specific state */
    protected async waitFor(locator: Locator, state: WaitState = WaitState.VISIBLE, timeout: number = Timeouts.VERY_LONG): Promise<void> {
        await locator.waitFor({ state, timeout });
    }

    /** To Take the screenshot of current page and save it in the screenshot folder */
    protected async screenshot(name: string) {
        await this.page.screenshot({ path: `screenshots/${name}.png` });
    }

    /**
     * This is a safe click method that ensures the element is clickable before performing the click action.
     * @param locator The Locator object representing the element to be clicked.
     */
    protected async click(locator: Locator): Promise<void> {
        return this.guarded(async () => {
            await this.ensureClickableUsingJs(locator);
            await locator.click();
        });
    }

    /** This is a safe click method that clicks the element only if it is visible.
     * @param locator The Locator object representing the element to be clicked.
     * @param timeout Optional timeout for visibility check.
     */
    protected async clickIfVisible(locator: Locator, timeout = Timeouts.LONG): Promise<void> {
        if (await locator.isVisible({ timeout })) {
            await locator.click();
        }
    }

    /** This is a safe type method that ensures the element is clickable before performing the type action.
     * @param locator The Locator object representing the element to be typeed.
     * @param value The value to type into the element.
     */
    protected async type(locator: Locator, value: string): Promise<void> {
        return this.guarded(async () => {
            await locator.click();
            await locator.fill(value);
        });
    }

    /** This is a safe type method that types the value into the element sequentially with a delay between each keystroke.
     * @param locator The Locator object representing the element to be typed into.
     * @param value The value to type into the element.
     * @param delay Optional delay between each keystroke in milliseconds. Default is 50ms.
     */
    protected async typeSequentially(locator: Locator, value: string, delay = 50): Promise<void> {
        return this.guarded(async () => {
            await locator.pressSequentially(value, { delay });
        });
    }

    /** This is a safe type method that types the value into a lookup field and handles the lookup popup.
     * @param locator The Locator object representing the lookup field.
     * @param value The value to type into the lookup field.
     * @param options Optional settings for typing, including delay and postKey action.
     */
    protected async typeAndSubmit(locator: Locator, value: string, options?: { delay?: number; postKey?: 'Enter' | 'Escape' }): Promise<void> {
        const delay = options?.delay ?? 100;
        const postKey = options?.postKey ?? 'Enter';
        return this.guarded(async () => {
            await locator.pressSequentially(value, { delay });
            await this.waitForUIStabilityUsingJs();
            await this.page.keyboard.press(postKey);
            await this.waitForUIStabilityUsingJs();
            await this.ensureLookupPopupClosed();
        });
    }

    /** This is a safe type method that types the value into a lookup field and selects the item from the popup.
     * @param comboboxLoc The Locator object representing the lookup combobox.
     * @param value The value to type into the lookup field.
     */
    protected async typeAndClick(comboboxLoc: Locator, value: string): Promise<void> {
        return this.guarded(async () => {
            await comboboxLoc.clear();
            await comboboxLoc.pressSequentially(value, { delay: 100 });
            const isPopupVisible = await this.waitForLookupPopup();
            if (isPopupVisible) {
                const lookupItem = this.page.getByRole('dialog', { name: 'Lookup form' }).locator(`input[value="${value}"], input[title="${value}"]`);
                await this.click(lookupItem);
            }
        });
    }

    //#endregion

    //#region  waitFor helpers

    /** This method will wait for the lookup popup to appear
     * @param timeout Optional timeout in milliseconds. Default is LONG.
     * @returns A promise that resolves to true if the popup appears, false otherwise.
     */
    private async waitForLookupPopup(timeout = Timeouts.LONG): Promise<boolean> {
        const popup = this.page.getByRole('dialog', { name: 'Lookup form' });

        try {
            await popup.waitFor({ state: 'visible', timeout });
            return true;
        } catch {
            return false;
        }
    }

    /** This method will ensure that the lookup popup is closed
     * @param timeout Optional timeout in milliseconds. Default is 3000ms.
     */
    private async ensureLookupPopupClosed(timeout = 3000): Promise<void> {
        try {
            await this.page.waitForFunction(
                () => {
                    const el = document.querySelector('[data-dyn-role="Popup"]');
                    if (!el) return true;

                    const ariaHidden = el.getAttribute('aria-hidden');
                    const displayNone = getComputedStyle(el).display === 'none';

                    return ariaHidden === 'true' || displayNone;
                },
                { timeout }
            );
        } catch {
            // If still not closed, force ESC once
            await this.page.keyboard.press('Escape');
        }
    }

    //#endregion

    //#region waitFor UI stability helpers using JS

    /** This method will wait for the UI to be stable by checking for common loading indicators
     * @param quietMs The duration in milliseconds that the UI must remain stable. Default is 100ms.
     * @param timeout The maximum duration in milliseconds to wait for UI stability. Default is VERY_LONG.
     */
    private async waitForUIStabilityUsingJs(quietMs = 100, timeout = Timeouts.VERY_LONG): Promise<void> {
        await this.page.waitForLoadState('domcontentloaded');

        const start = Date.now();

        while (Date.now() - start < timeout) {
            const hasPendingActivity = await this.page.evaluate(() => {
                return !!document.querySelector('[aria-busy="true"], .loading, .busy');
            });

            if (!hasPendingActivity) {
                await this.page.waitForTimeout(quietMs);
                return;
            }
        }
    }

    /** This method will wait for the initial page to be ready using JS
     * @param timeout Optional timeout in milliseconds. Default is VERY_LONG.
     */
    async waitForInitialReadyUsingJs(timeout = Timeouts.VERY_LONG): Promise<void> {
        await this.page.waitForFunction(
            () => {
                const shell = document.querySelector('#ShellBlockingDiv');
                const main = document.querySelector('#mainContainer');

                if (!main) return false;

                const shellHidden = !shell || getComputedStyle(shell).display === 'none';

                const mainVisible = getComputedStyle(main).visibility === 'visible';

                return shellHidden && mainVisible;
            },
            { timeout }
        );

        await this.page.waitForLoadState('domcontentloaded');
    }

    /** This method will wait for the shell blocking div to be hidden using JS
     * @param stableMs The duration in milliseconds that the shell blocking div must remain hidden. Default is 200ms.
     * @param timeout The maximum duration in milliseconds to wait for the shell blocking div to be hidden. Default is VERY_LONG.
     */
    private async waitForShellBlockingToFinishUsingJs(stableMs = 200, timeout = Timeouts.VERY_LONG): Promise<void> {
        await this.page.waitForFunction(
            (stableMs) => {
                const el = document.querySelector('#ShellBlockingDiv');

                const isBlocking = el && getComputedStyle(el).display !== 'none';

                const w = window as any;
                if (isBlocking) {
                    w.__shellBlockingLastSeen = Date.now();
                    return false;
                }

                if (!w.__shellBlockingLastSeen) {
                    w.__shellBlockingLastSeen = Date.now();
                    return false;
                }

                return Date.now() - w.__shellBlockingLastSeen >= stableMs;
            },
            stableMs,
            { timeout }
        );
    }

    /** This method will ensure that the locator is clickable using JS
     * @param locator The Locator object representing the element to be clicked.
     * @param timeout Optional timeout in milliseconds. Default is VERY_LONG.
     */
    private async ensureClickableUsingJs(locator: Locator, timeout = Timeouts.VERY_LONG): Promise<void> {
        await locator.waitFor({ state: 'visible', timeout });

        if (!(await locator.isEnabled())) {
            await this.page.waitForFunction((el) => !(el as HTMLButtonElement).disabled, await locator.elementHandle(), { timeout });
        }

        await this.page.waitForFunction(
            (el) => {
                if (!el) return false;

                const rect = el.getBoundingClientRect();
                if (!rect || rect.width === 0 || rect.height === 0) return false;

                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;

                const topEl = document.elementFromPoint(x, y);
                return topEl === el || el.contains(topEl);
            },
            await locator.elementHandle(),
            { timeout }
        );
    }

    //#endregion

    //#region Guarded action helpers

    /** Called before every action */
    private async beforeAction() {
        await this.waitForShellBlockingToFinishUsingJs();
    }

    /** Called after every action */
    private async afterAction() {
        await this.waitForShellBlockingToFinishUsingJs();
    }

    /** This method wraps an action with before and after guards */
    private async guarded<T>(action: () => Promise<T>): Promise<T> {
        try {
            await this.beforeAction();
            const result = await action();
            await this.afterAction();
            return result;
        } catch (error: any) {
            throw error;
        }
    }
    /**
     * This method is used for scrolling to the element and clicking on it. This is useful in scenarios where the element is not in the viewport and needs to be scrolled into view before clicking.
     * Scrolls the locator into view and clicks it.
     * @param locator The locator to scroll into view and click.
     * @returns A promise that resolves when the click is complete.
     */
    protected async scrollAndClick(locator: Locator): Promise<void> {
        return this.guarded(async () => {
            await locator.scrollIntoViewIfNeeded();
            await this.ensureClickableUsingJs(locator);
            await locator.click();
        });
    }
    //#endregion
}
