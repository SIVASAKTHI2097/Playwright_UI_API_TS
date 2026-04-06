import { test as base } from '@fixtures/finance/page-object.fixture';
import { generateExcelJsonForSheetIfNeeded } from '@utils/data-utils/excel-data';
import { getRowByTestCaseAndIndex } from '@utils/data-utils/json-data';

type TestDataFixture = {
    testData: Record<string, string>;
    sheetName?: string;
};

export const test = base.extend<TestDataFixture>({
    sheetName: [undefined, { option: true }],

    testData: async ({ sheetName }, use, testInfo) => {
        const tc = testInfo.annotations.find((a) => a.type === 'TC')?.description;

        const rowIndex = Number(testInfo.annotations.find((a) => a.type === 'ROW')?.description ?? 0);

        const sheetFromAnnotation = testInfo.annotations.find((a) => a.type === 'SHEET')?.description || testInfo.annotations.find((a) => a.type === 'Sheet')?.description;

        const finalSheetName = sheetName ?? sheetFromAnnotation;

        if (!finalSheetName) {
            await use({});
            return;
        }

        await generateExcelJsonForSheetIfNeeded(finalSheetName);

        const row = getRowByTestCaseAndIndex(finalSheetName, tc!, rowIndex);

        if (!row) {
            console.log(`No test data found for SHEET=${finalSheetName} TC=${tc} ROW=${rowIndex}`);
            await use({});
            return;
        }

        await use(row);
    },
});

export { expect } from '@playwright/test';
