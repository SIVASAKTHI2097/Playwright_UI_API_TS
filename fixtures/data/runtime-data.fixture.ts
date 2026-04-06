import { test as base } from '@fixtures/data/test-data.fixture';
import { TestDataStoreFactory } from '@utils/data-store-utils/test-data-store-factory';

type RuntimeDataFixture = {
    runtimeData: {
        save: <T>(data: T) => Promise<void>;
        readAll: <T>(producerTc: string) => Promise<T[]>;
        readOne: <T>(producerTc: string, rowIndex: number) => Promise<T>;
    };
};

export const test = base.extend<RuntimeDataFixture>({
    runtimeData: async ({}, use, testInfo) => {
        const store = TestDataStoreFactory.getStore();

        const testCaseId = testInfo.annotations.find((a) => a.type === 'TC')?.description || testInfo.title;

        const rowIndex = Number(testInfo.annotations.find((a) => a.type === 'ROW')?.description || 0);

        await use({
            async save<T>(data: T) {
                const status = testInfo.status === 'passed' ? 'PASSED' : 'FAILED';
                await store.save(testCaseId, rowIndex, data, status);
            },

            async readAll<T>(producerTc: string): Promise<T[]> {
                const records = await store.getAll<T>(producerTc);

                if (!records || records.length === 0) {
                    testInfo.skip(true, `Skipping test: No runtime data found for producer TC "${producerTc}"`);
                }

                return records;
            },

            async readOne<T>(producerTc: string, idx: number): Promise<T> {
                const record = await store.getOne<T>(producerTc, idx);

                if (!record) {
                    testInfo.skip(true, `Skipping test: No runtime data found for producer TC "${producerTc}" row ${idx}`);
                    throw new Error('Test skipped due to missing runtime data');
                }

                return record;
            },
        });
    },
});

export { expect } from '@playwright/test';
