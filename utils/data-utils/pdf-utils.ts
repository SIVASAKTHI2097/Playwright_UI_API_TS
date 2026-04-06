import { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { PDFParse } from 'pdf-parse';

export type InvoiceFields = {
    invoiceNumber?: string | null;
    salesOrder?: string | null;
    invoiceDate?: string | null;
};

/**
 * Downloads the PDF using Playwright download event and returns extracted text.
 * @param page Playwright Page object
 * @param clickDownload Function that triggers the download click
 * @returns Extracted PDF text
 */
export async function downloadPdfAndRead(page: Page, clickDownload: () => Promise<void>): Promise<string> {
    const [download] = await Promise.all([page.waitForEvent('download'), clickDownload()]);

    const stream = await download.createReadStream();
    if (!stream) {
        throw new Error('Downloaded PDF is empty. Please check the download action.');
    }

    const chunks: Buffer[] = [];

    const data = await new Promise<Buffer>((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const parser = new PDFParse({ data });

    return (await parser.getText()).text;
}

/**
 * Reads local PDF file and returns Buffer.
 * @param filePath Local PDF file path
 * @returns PDF file buffer
 */
export async function readLocalPdfAsBuffer(filePath: string): Promise<Buffer> {
    return await readFile(filePath);
}

/**
 * Reads local PDF file and returns parsed text.
 * @param filePath Local PDF file path
 * @returns Extracted PDF text
 */
export async function readLocalPdf(filePath: string): Promise<string> {
    const buffer = await readFile(filePath);
    const uint = new Uint8Array(buffer);

    const parser = new PDFParse({ data: uint });

    return (await parser.getText()).text;
}

/**
 * Extracts a SINGLE value from PDF text using regex.
 * Uses group 1 if available, else uses full match.
 * @param text PDF text
 * @param pattern Regex pattern
 * @returns Extracted value or null
 */
export function extractSingleText(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);

    if (match?.[1]) return match[1].trim();
    if (match?.[0]) return match[0].trim();

    return null;
}

/**
 * Extracts MULTIPLE values from PDF text using regex.
 * Uses group 1 if available, else uses full match.
 * @param text PDF text
 * @param pattern Regex pattern (use /g or /gi)
 * @returns Array of extracted values
 */
export function extractMultipleTexts(text: string, pattern: RegExp): string[] {
    const matches = [...text.matchAll(pattern)];

    return matches.map((m) => (m[1] ?? m[0])?.trim()).filter((v): v is string => Boolean(v));
}

/**
 * Extracts invoice fields (InvoiceNumber, SalesOrder, InvoiceDate) from PDF text.
 * @param text PDF text
 * @returns InvoiceFields object
 */
export function extractInvoiceFields(text: string): InvoiceFields {
    const invoiceNumber = extractSingleText(text, /Invoice\s*Number\s+(INV\d+)/i);

    const salesOrder = extractSingleText(text, /Sales\s*Order\s+([0-9A-Z]+)/i);

    const invoiceDate = extractSingleText(text, /Invoice\s*Date\s+(\d{2}\/\d{2}\/\d{4})/i);

    return {
        invoiceNumber,
        salesOrder,
        invoiceDate,
    };
}

/**
 * Downloads PDF and extracts SINGLE value.
 * @param page Playwright Page object
 * @param clickDownload Function that triggers the download click
 * @param pattern Regex pattern
 * @returns Extracted value or null
 */
export async function downloadPdfAndExtractSingleText(page: Page, clickDownload: () => Promise<void>, pattern: RegExp): Promise<string | null> {
    const pdfText = await downloadPdfAndRead(page, clickDownload);
    return extractSingleText(pdfText, pattern);
}

/**
 * Downloads PDF and extracts MULTIPLE values.
 * @param page Playwright Page object
 * @param clickDownload Function that triggers the download click
 * @param pattern Regex pattern (use /g or /gi)
 * @returns Extracted values array
 */
export async function downloadPdfAndExtractMultipleTexts(page: Page, clickDownload: () => Promise<void>, pattern: RegExp): Promise<string[]> {
    const pdfText = await downloadPdfAndRead(page, clickDownload);
    return extractMultipleTexts(pdfText, pattern);
}

/**
 * Downloads PDF and extracts invoice fields.
 * @param page Playwright Page object
 * @param clickDownload Function that triggers the download click
 * @returns InvoiceFields object
 */
export async function downloadPdfAndExtractInvoiceFields(page: Page, clickDownload: () => Promise<void>): Promise<InvoiceFields> {
    const pdfText = await downloadPdfAndRead(page, clickDownload);
    return extractInvoiceFields(pdfText);
}
