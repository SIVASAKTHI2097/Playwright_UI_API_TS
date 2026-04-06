import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';
import { ApiClient } from '@utils/api-utils/api-client';

type MailMessage = {
    id: string;
    subject?: string;
    receivedDateTime?: string;
};

export type OrderStatusReportRow = {
    ID: string;
    fromFile: string;
    hubReference: string;
    status: string;
    importDate: string;
    result: string;
};

type DownloadYesterdayOrderStatusReportsOptions = {
    mailboxUser?: string;
    subjectContains?: string;
    downloadDir?: string;
};

type DownloadYesterdayOrderStatusReportsResult = {
    matchedMessages: MailMessage[];
    downloadedFiles: string[];
    excelRows: OrderStatusReportRow[];
};

/**
 * @remarks Returns yesterday's UTC range.
 * @returns { from: string; to: string }
 */

function getYesterdayUtcRange(): { from: string; to: string } {
    const now = new Date();

    const todayUtcStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));

    const yesterdayUtcStart = new Date(todayUtcStart);
    yesterdayUtcStart.setUTCDate(todayUtcStart.getUTCDate() - 1);

    return {
        from: yesterdayUtcStart.toISOString(),
        to: todayUtcStart.toISOString(),
    };
}

/**
 * @remarks Ensures the directory exists; creates it if missing.
 * @param dirPath - Folder path to check.
 * @returns void
 */

function ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * @remarks Checks if the attachment is an Excel file.
 * @param attachment - Input to validate.
 * @returns boolean
 */

function isExcelAttachment(attachment: any): boolean {
    const name = String(attachment.name ?? '').toLowerCase();
    const isFileAttachment = attachment['@odata.type'] === '#microsoft.graph.fileAttachment';

    return isFileAttachment && (name.endsWith('.xlsx') || name.endsWith('.xls'));
}

/**
 * @remarks Saves the attachment to a file.
 * @param attachment - File content/details.
 * @param downloadDir - Directory to save.
 * @returns string - Saved file path.
 */

function saveAttachmentToFile(attachment: any, downloadDir: string): string {
    if (!attachment.contentBytes) {
        throw new Error(`Attachment "${attachment.name}" does not contain contentBytes`);
    }

    const filePath = path.join(downloadDir, attachment.name);
    const fileBuffer = Buffer.from(attachment.contentBytes, 'base64');

    fs.writeFileSync(filePath, fileBuffer);

    return filePath;
}

/**
 * @remarks Normalizes a header value to string form.
 * @param value - Input header value.
 * @returns string
 */

function normalizeHeader(value: unknown): string {
    return String(value ?? '')
        .trim()
        .replace(/\s+/g, '')
        .toLowerCase();
}

/**
 * @remarks Returns cell value as text.
 * @param value - Cell input.
 * @returns string
 */

function getCellText(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'object' && value !== null && 'richText' in (value as object)) {
        const richText = (value as { richText: Array<{ text: string }> }).richText;
        return richText
            .map((part) => part.text)
            .join('')
            .trim();
    }

    return String(value).trim();
}

/**
 * @remarks Reads the order status report from Excel.
 * @param filePath - Path of the file.
 * @returns Promise<OrderStatusReportRow[]>
 */

async function readOrderStatusReport(filePath: string): Promise<OrderStatusReportRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
        throw new Error(`No worksheet found in Excel file: ${filePath}`);
    }

    const headerRow = worksheet.getRow(1);
    const headerMap = new Map<string, number>();

    for (let col = 1; col <= headerRow.cellCount; col++) {
        const headerText = normalizeHeader(headerRow.getCell(col).value);

        if (headerText) {
            headerMap.set(headerText, col);
        }
    }

    const idCol = headerMap.get('id') ?? 1;
    const fromFileCol = headerMap.get('fromfile') ?? 2;
    const hubReferenceCol = headerMap.get('hubreference') ?? 3;
    const statusCol = headerMap.get('status') ?? 4;
    const importDateCol = headerMap.get('importdate') ?? 5;
    const resultCol = headerMap.get('result') ?? 6;

    const rows: OrderStatusReportRow[] = [];

    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);

        const dataRow: OrderStatusReportRow = {
            ID: getCellText(row.getCell(idCol).value),
            fromFile: getCellText(row.getCell(fromFileCol).value),
            hubReference: getCellText(row.getCell(hubReferenceCol).value),
            status: getCellText(row.getCell(statusCol).value),
            importDate: getCellText(row.getCell(importDateCol).value),
            result: getCellText(row.getCell(resultCol).value),
        };

        const isEmpty = Object.values(dataRow).every((value) => value === '');

        if (isEmpty) {
            continue;
        }

        rows.push(dataRow);
    }

    return rows;
}

/**
 * @remarks Downloads yesterday's order status reports.
 * @param api - API client instance.
 * @param options - Optional filters/settings.
 * @returns Promise<DownloadYesterdayOrderStatusReportsResult>
 */

export async function downloadYesterdayOrderStatusReports(
    api: ApiClient,
    options: DownloadYesterdayOrderStatusReportsOptions = {}
): Promise<DownloadYesterdayOrderStatusReportsResult> {
    const mailboxUser = options.mailboxUser ?? process.env._USERNAME;
    const subjectContains = options.subjectContains ?? 'Order Status Report';
    const downloadDir = options.downloadDir ?? path.join(process.cwd(), 'downloads');

    ensureDirectoryExists(downloadDir);

    /* The below api is to get the mail records which is matching subject contains based on the from - to time -> Keeping it this commented code for the future need*/
    //const { from, to } = assign the getYesterdayUtcRange() here
    getYesterdayUtcRange();
    //const messagesRestPoint = `/v1.0/users/${mailboxUser}/mailFolders/inbox/messages` + `?$filter=receivedDateTime ge ${from} and receivedDateTime lt ${to}` + `&$top=100`;

    const messagesRestPoint = `/v1.0/users/${mailboxUser}/mailFolders/inbox/messages?$search="subject:${subjectContains}"&$top=5`;

    const messagesResponse = await api.get<any>(messagesRestPoint);

    if (messagesResponse.status !== 200) {
        throw new Error(`Failed to fetch emails. Status=${messagesResponse.status} Body=${JSON.stringify(messagesResponse.body)}`);
    }

    const messages = (messagesResponse.body.value ?? []) as MailMessage[];

    const matchedMessages = subjectContains ? messages.filter((mail) => String(mail.subject ?? '').includes(subjectContains)) : messages;

    if (matchedMessages.length === 0) {
        throw new Error(`No emails found from yesterday with subject containing "${subjectContains}"`);
    }

    const downloadedFiles: string[] = [];
    const excelRows: OrderStatusReportRow[] = [];

    for (const mail of matchedMessages) {
        const attachmentsRestPoint = `/v1.0/users/${mailboxUser}/messages/${mail.id}/attachments`;

        const attachmentsResponse = await api.get<any>(attachmentsRestPoint);

        if (attachmentsResponse.status !== 200) {
            throw new Error(`Failed to fetch attachments for messageId=${mail.id}. Status=${attachmentsResponse.status} Body=${JSON.stringify(attachmentsResponse.body)}`);
        }

        const attachments = attachmentsResponse.body.value ?? [];
        const excelAttachments = attachments.filter(isExcelAttachment);

        for (const excelAttachment of excelAttachments) {
            const filePath = saveAttachmentToFile(excelAttachment, downloadDir);

            downloadedFiles.push(filePath);

            const rows = await readOrderStatusReport(filePath);
            excelRows.push(...rows);
        }
    }

    if (downloadedFiles.length === 0) {
        throw new Error(`No Excel attachments found in matched emails for subject "${subjectContains}"`);
    }

    return {
        matchedMessages,
        downloadedFiles,
        excelRows,
    };
}
