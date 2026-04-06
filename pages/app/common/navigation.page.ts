import { BasePage, Timeouts } from '@pages/app/common/base.page';
import { Page, Locator, test } from '@playwright/test';
import { Menu } from '@pages/app/common/menu.page';

/**
 * This is the page object for the Navigation.
 * @export
 * @class Navigation
 * @extends {BasePage}
 */
export class Navigation extends BasePage {
    static Menu = Menu;
    get Menu() {
        return Navigation.Menu;
    }
    constructor(protected readonly page: Page) {
        super(page);
    }

    //#region Locators
    private get modulesToggle(): Locator {
        return this.page.locator(`//div[@aria-label='Modules']`);
    }

    private moduleItem(label: string): Locator {
        return this.page.locator(`//a[text()='${label}']`);
    }
    //#endregion

    //#region Methods

    /** Ensure that the modules pane is expanded */
    private async ensureModulesExpanded(): Promise<void> {
        const expanded = await this.modulesToggle.getAttribute('aria-expanded');

        if (expanded !== 'true') {
            await this.click(this.modulesToggle);
        }
    }
    /** Expand a module if it is collapsed */
    private async expandIfCollapsed(label: string): Promise<void> {
        const locator = this.moduleItem(label);

        await locator.waitFor({ state: 'visible' });
        const expanded = await locator.getAttribute('aria-expanded');

        if (expanded === 'false') {
            await this.click(locator);
        }
    }
    /** Verify that the page title contains the expected text
     * @param expected The expected text in the page title
     */
    private async verifyPageTitle(expected: string): Promise<void> {
        await this.page.waitForFunction((expectedText) => document.title.toLowerCase().includes(expectedText.toLowerCase()), expected, { timeout: Timeouts.VERY_LONG });

        const actual = await this.page.title();

        if (!actual.toLowerCase().includes(expected.toLowerCase())) {
            throw new Error(`Navigation failed. Expected page title to contain "${expected}" but got "${actual}"`);
        }
    }

    /** Navigate to a menu item
     * @param menu The menu item to navigate to
     */
    async goTo(menu: { label: string }): Promise<void> {
        await test.step(`Navigate to ${menu.label}`, async () => {
            await this.ensureModulesExpanded();

            const meta = this.resolveMenuPath(Menu, menu);

            if (!meta) {
                throw new Error(`Menu item not found for label: ${menu.label}`);
            }

            // 1) Click module
            await this.moduleItem(meta.module).click();

            // 2) Expand/click each level in the path
            for (const label of meta.path) {
                await this.expandIfCollapsed(label);
            }

            // 3) Click final leaf
            await this.click(this.moduleItem(menu.label));

            await this.verifyPageTitle(menu.label);
        });
    }

    /** Resolve menu metadata such as module and parent
     * @param root The root menu object
     * @param target The target menu item
     * @returns An object containing module and parent information
     */
    private resolveMenuPath(root: any, target: any, path: string[] = [], currentModule?: string): { module: string; path: string[] } | null {
        if (!root || typeof root !== 'object') return null;

        // if this node defines module, update it
        const module = root.module ?? currentModule;

        for (const key of Object.keys(root)) {
            const node = root[key];

            if (!node || typeof node !== 'object') continue;

            // leaf match
            if (node === target) {
                return { module, path };
            }

            // if this node is a "menu level" with label
            if (node.label) {
                const result = this.resolveMenuPath(node, target, [...path, node.label], module);
                if (result) return result;
            } else {
                const result = this.resolveMenuPath(node, target, path, module);
                if (result) return result;
            }
        }

        return null;
    }
    //#endregion
}
