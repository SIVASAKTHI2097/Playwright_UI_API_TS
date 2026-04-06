import fs from 'fs';
import path from 'path';
import { ITestDataStore } from '@storedataUtils/test-data-store.interface';

/**
 * JSON-based implementation of ITestDataStore.
 * Stores test data in a JSON file at 'test-data/runtime-testdata.json'.
 * Only saves data when status is 'PASSED'.
 * Implements ITestDataStore interface.
 */
export class JsonTestDataStore implements ITestDataStore {
    private filePath = path.resolve(process.cwd(), 'test-data/dynamic-data', 'runtime-testdata.json');

    /** Ensures that the JSON file exists; creates it if not.
     * Creates the directory and file if they do not exist.
     */
    private ensureFileExists() {
        const dir = path.dirname(this.filePath);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2));
            console.log('Runtime data file created at:', this.filePath);
        }
    }

    /** Reads all data from the JSON file.
     * @return Parsed JSON data as an object
     */
    private readAll(): Record<string, any> {
        this.ensureFileExists();
        return JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
    }

    /** Writes all data to the JSON file.
     * @param data The data object to write
     */
    private writeAll(data: Record<string, any>) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    async save<T>(testCaseId: string, rowIndex: number, data: T, status: 'PASSED' | 'FAILED'): Promise<void> {
        if (status !== 'PASSED') {
            console.log(`Skipping store for ${testCaseId}[${rowIndex}] because status is ${status}`);
            return;
        }

        const all = this.readAll();
        const key = `${testCaseId}_${rowIndex}`;

        all[key] = {
            testCaseId,
            rowIndex,
            status,
            data,
            updatedAt: new Date().toISOString(),
        };

        this.writeAll(all);
        console.log(`Runtime data stored for: ${testCaseId}[${rowIndex}] (JSON)`);
    }

    async getAll<T>(testCaseId: string): Promise<T[]> {
        const all = this.readAll();

        return Object.values(all)
            .filter((r: any) => r.testCaseId === testCaseId && r.status === 'PASSED')
            .sort((a: any, b: any) => a.rowIndex - b.rowIndex)
            .map((r: any) => r.data as T);
    }

    async getOne<T>(testCaseId: string, rowIndex: number): Promise<T> {
        const all = this.readAll();
        const key = `${testCaseId}_${rowIndex}`;

        const record = all[key];
        if (!record || record.status !== 'PASSED') throw new Error('Skipping due to missing runtime data');

        return record.data as T;
    }
}
