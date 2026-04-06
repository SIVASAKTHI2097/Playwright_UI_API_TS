export type TestDataRecord<T> = {
    testCaseId: string;
    rowIndex: number;
    status: 'PASSED' | 'FAILED';
    data: T;
    updatedAt: string;
};

export interface ITestDataStore {
    /**
     * Save data for a specific TestCaseId and rowIndex.
     * If already exists, it will be overwritten.
     * @example TC_101[0]
     * @param testCaseId The Test Case Identifier
     * @param rowIndex The row index for the test data
     * @param data The data to be saved
     * @param status The status of the test case ('PASSED' | 'FAILED')
     */
    save<T>(testCaseId: string, rowIndex: number, data: T, status: 'PASSED' | 'FAILED'): Promise<void>;

    /**
     * Get all data records for a specific TestCaseId.
     * @example TC_101
     * @return Array of data records
     */
    getAll<T>(testCaseId: string): Promise<T[]>;

    /**
     * Get a single data record for a specific TestCaseId and rowIndex.
     * @example TC_101[0]
     * @return The data record or null if not found
     */
    getOne<T>(testCaseId: string, rowIndex: number): Promise<T | null>;
}
