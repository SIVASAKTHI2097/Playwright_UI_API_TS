import { test, expect } from '@fixtures/api/api.fixture';
import { downloadYesterdayOrderStatusReports } from '@utils/data-utils/mail-data';

test('Mail Excel Download', { tag: '@examples' }, async ({ mailApi }) => {
    const mailData = await downloadYesterdayOrderStatusReports(mailApi);

    expect(mailData.excelRows.length).toBeGreaterThan(0);

    // First row
    const firstRow = mailData.excelRows[0];
    console.log(firstRow.result);
    console.log(firstRow.status);

    // All rows
    for (const row of mailData.excelRows) {
        console.log(row.result);
        console.log(row.status);
        console.log(row.hubReference);
    }
});
