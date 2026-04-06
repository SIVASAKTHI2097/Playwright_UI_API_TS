import { test } from '@playwright/test';
import { TestDataStoreFactory } from '@utils/data-store-utils/test-data-store-factory';

const store = TestDataStoreFactory.getStore();

export async function StoreTestData<T>(data: T): Promise<void> {
    const info = test.info();

    const testCaseId = info.annotations.find((a) => a.type === 'TC')?.description || info.title;

    const rowIndex = Number(info.annotations.find((a) => a.type === 'ROW')?.description || 0);

    const status = info.status === 'passed' ? 'PASSED' : 'FAILED';

    await store.save(testCaseId, rowIndex, data, status);
}
