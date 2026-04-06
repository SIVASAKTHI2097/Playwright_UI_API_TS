import { ITestDataStore } from '@utils/data-store-utils/test-data-store.interface';
import { JsonTestDataStore } from '@utils/data-store-utils/json-test-data-store';
import { SqlTestDataStore } from '@utils/data-store-utils/sql-test-data-store';

export class TestDataStoreFactory {
    static getStore(): ITestDataStore {
        const mode = process.env.DATA_STORE?.toUpperCase();

        if (mode === 'SQL') {
            console.log('Using SQL Test Data Store');
            return new SqlTestDataStore();
        }

        console.log('Using JSON Test Data Store');
        return new JsonTestDataStore();
    }
}
