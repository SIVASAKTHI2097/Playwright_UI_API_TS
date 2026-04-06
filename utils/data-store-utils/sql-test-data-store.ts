import sql, { config as SqlConfig } from 'mssql';
import { ITestDataStore } from '@utils/data-store-utils/test-data-store.interface';

export class SqlTestDataStore implements ITestDataStore {
    private pool: Promise<sql.ConnectionPool>;

    constructor() {
        const dbConfig: SqlConfig = {
            server: '',
            database: '',
            user: '',
            password: '@#1',
            port: 1111,
            options: { encrypt: true, trustServerCertificate: true },
        };
        this.pool = new sql.ConnectionPool(dbConfig).connect();
    }

    async save<T>(testCaseId: string, rowIndex: number, data: T, status: 'PASSED' | 'FAILED'): Promise<void> {
        if (status !== 'PASSED') {
            console.log(`Skipping store for ${testCaseId}[${rowIndex}] because status is ${status}`);
            return;
        }

        const db = await this.pool;
        const json = JSON.stringify(data);

        await db
            .request()
            .input('testCaseId', sql.NVarChar, testCaseId)
            .input('rowIndex', sql.Int, rowIndex)
            .input('data', sql.NVarChar(sql.MAX), json)
            .input('status', sql.NVarChar, status)
            .query(` PASS THE SQL QURY TO UPSERT THE DATA INTO THE TABLE `);

        console.log(`Runtime data stored for: ${testCaseId}[${rowIndex}] (SQL)`);
    }

    async getAll<T>(testCaseId: string): Promise<T[]> {
        const db = await this.pool;

        const result = await db.request().input('testCaseId', sql.NVarChar, testCaseId).query(`
                SELECT DataJson
                FROM AutomationTestData
                WHERE TestCaseId = @testCaseId AND Status = 'PASSED'
                ORDER BY RowIndex
            `);

        return result.recordset.map((r) => JSON.parse(r.DataJson));
    }

    async getOne<T>(testCaseId: string, rowIndex: number): Promise<T | null> {
        const db = await this.pool;

        const result = await db.request().input('testCaseId', sql.NVarChar, testCaseId).input('rowIndex', sql.Int, rowIndex).query(`
                SELECT DataJson
                FROM AutomationTestData
                WHERE TestCaseId = @testCaseId 
                  AND RowIndex = @rowIndex
                  AND Status = 'PASSED'
            `);

        if (!result.recordset.length) return null;

        return JSON.parse(result.recordset[0].DataJson);
    }
}
