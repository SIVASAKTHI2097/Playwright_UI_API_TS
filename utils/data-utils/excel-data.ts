import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

function normalizeHeader(header: string): string {
    return header
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .trim();
}

function normalizeValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);

    if (typeof value === 'object') {
        if ('text' in value) return String((value as { text: unknown }).text);
        if ('result' in value) return String((value as { result: unknown }).result);
    }
    return String(value);
}

function getRowValues(row: ExcelJS.Row): unknown[] {
    return Array.isArray(row.values) ? row.values : [];
}

function loadEnv() {
    const envName = process.env.ENVIRONMENT ?? 'uat';
    dotenv.config({ path: path.resolve(process.cwd(), `env/.env.${envName}`) });

    if (!process.env.EXCEL_PATH) {
        throw new Error('EXCEL_PATH missing in env');
    }

    if (!process.env.GENERATED_DIR) {
        throw new Error('GENERATED_DIR missing in env');
    }
}

/**
 * Reads all rows from a given sheet.
 * Supports multiple header blocks inside same sheet.
 */
export async function readAllExcelRowsFromSheet(sheetName: string): Promise<Record<string, string>[]> {
    const workbook = new ExcelJS.Workbook();
    const excelPath = path.resolve(process.cwd(), process.env.EXCEL_PATH!);

    await workbook.xlsx.readFile(excelPath);

    const sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
        throw new Error(`Excel sheet not found: ${sheetName}`);
    }

    const rows: Record<string, string>[] = [];
    let currentHeaders: string[] = [];

    const isRowEmpty = (row: ExcelJS.Row) => {
        const values = getRowValues(row).slice(1);
        return values.every((v) => normalizeValue(v).trim() === '');
    };

    const isHeaderRow = (row: ExcelJS.Row) => {
        const values = getRowValues(row)
            .slice(1)
            .map((v) => normalizeHeader(normalizeValue(v)));

        return values.includes('TestCaseID');
    };

    sheet.eachRow({ includeEmpty: true }, (row) => {
        if (isRowEmpty(row)) return;

        // If this row contains TestCaseID => treat as header row
        if (isHeaderRow(row)) {
            const headers: string[] = [];

            row.eachCell({ includeEmpty: true }, (cell) => {
                headers.push(normalizeHeader(normalizeValue(cell.value)));
            });

            currentHeaders = headers;
            return;
        }

        // If we haven't seen a header row yet, skip
        if (!currentHeaders.length) return;

        // Map row cells to headers
        const data: Record<string, string> = {};

        currentHeaders.forEach((h, i) => {
            if (!h) return;
            data[h] = normalizeValue(row.getCell(i + 1).value);
        });

        // If no TestCaseID => ignore (prevents garbage rows)
        if (!data.TestCaseID) return;

        rows.push(data);
    });

    return rows;
}

/**
 * Generates a JSON file for a given sheet.
 * Output:
 * test-data/<sheetName>.json
 */
export async function generateExcelJsonForSheetIfNeeded(sheetName: string): Promise<string> {
    loadEnv();

    const excelPath = path.resolve(process.cwd(), process.env.EXCEL_PATH!);
    const outDir = path.resolve(process.cwd(), process.env.GENERATED_DIR!);

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    // Make file name safe
    const safeSheetName = sheetName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const outFile = path.join(outDir, `${safeSheetName}.json`);

    const excelMtime = fs.statSync(excelPath).mtimeMs;
    const jsonMtime = fs.existsSync(outFile) ? fs.statSync(outFile).mtimeMs : 0;

    // If JSON already up-to-date, return path
    if (excelMtime <= jsonMtime) {
        return outFile;
    }

    const rows = await readAllExcelRowsFromSheet(sheetName);

    if (!rows.length) {
        console.log(`No rows found in sheet=${sheetName}. Writing empty json.`);
    }

    fs.writeFileSync(outFile, JSON.stringify(rows, null, 2), 'utf-8');

    console.log(`Generated test data JSON for sheet=${sheetName} => ${outFile}`);

    return outFile;
}
