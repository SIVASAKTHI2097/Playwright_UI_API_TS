import { test } from '@fixtures/common/common.ui.api.fixture';
test.describe('D365 SMOKE TEST', () => {
    test.use({ sheetName: 'Smoke' });
    test(
        `Login And Logout`,
        {
            tag: ['@smoke'],
            annotation: [{ type: 'TC', description: 'Smoke1' }],
        },
        async () => {
            console.log(`Just checking whether able to login and logout into D365`);
        }
    );
});
