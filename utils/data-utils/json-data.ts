import fs from 'fs';
import path from 'path';

type Row = Record<string, any>;

type Cache = {
    allRows: Row[];
    testCaseIndex: Record<string, Row[]>;
};

/**
 * Cache per sheet (per Playwright worker)
 */
const sheetCache: Record<string, Cache> = {};

function resolveSheetJsonPath(sheetName: string): string {
    const generatedDir = process.env.GENERATED_DIR ?? 'test-data';

    const safeSheetName = sheetName.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.resolve(process.cwd(), generatedDir, `${safeSheetName}.json`);
}

function loadAndIndexData(sheetName: string): void {
    if (sheetCache[sheetName]) return;

    const filePath = resolveSheetJsonPath(sheetName);

    // If file not present, treat as empty dataset
    if (!fs.existsSync(filePath)) {
        sheetCache[sheetName] = { allRows: [], testCaseIndex: {} };
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const rows: Row[] = JSON.parse(fileContent);

    const testCaseIndex: Record<string, Row[]> = {};

    for (const row of rows) {
        const tc = row.TestCaseID;
        if (!tc) continue;

        if (!testCaseIndex[tc]) testCaseIndex[tc] = [];
        testCaseIndex[tc].push(row);
    }

    sheetCache[sheetName] = { allRows: rows, testCaseIndex };
}

export function getAllRows(sheetName: string): Row[] {
    loadAndIndexData(sheetName);
    return sheetCache[sheetName]?.allRows ?? [];
}

export function getRowsByTestCaseId(sheetName: string, testCaseId: string): Row[] {
    loadAndIndexData(sheetName);
    return sheetCache[sheetName]?.testCaseIndex?.[testCaseId] ?? [];
}

export function getRowByTestCaseAndIndex(sheetName: string, testCaseId: string, index: number): Row | undefined {
    const rows = getRowsByTestCaseId(sheetName, testCaseId);
    return rows[index];
}

export function resetTestDataCache(): void {
    for (const key of Object.keys(sheetCache)) {
        delete sheetCache[key];
    }
}
