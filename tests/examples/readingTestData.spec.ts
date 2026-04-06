import { test } from '@fixtures/common/common.ui.api.fixture';
import { getRowsByTestCaseId } from '@utils/data-utils/json-data';
const rows = getRowsByTestCaseId('Finance', '1234');

test.describe('Finance Data Flow', () => {
    test.use({ sheetName: 'Finance' });
    console.log('ROWS COUNT:', rows.length);
    test.describe.parallel('Create Records', () => {
        test.describe.parallel(`First Reading test data TC${'1234'}`, () => {
            rows.forEach((_, index) => {
                test(
                    `Iteration ${index + 1}`,
                    {
                        tag: ['@examples'],
                        annotation: [
                            { type: 'TC', description: '1234' },
                            { type: 'ROW', description: String(index) },
                        ],
                    },
                    async ({ testData, runtimeData }) => {
                        console.log('Running with data:', testData);

                        await runtimeData.save({
                            poId: index,
                            soId: 'SO456',
                            customerId: 'C789',
                            token: 'abc123',
                            amount: 5000,
                        });
                    }
                );
            });
        });
    });
    test.describe.serial('Update Data Phase', () => {
        test.describe('Consume Data', () => {
            /** Test to read and store test data */
            test(
                'Reading Test Data',
                {
                    tag: ['@examples'],
                    annotation: { type: 'TC', description: '1235' },
                },
                async ({ testData, runtimeData }) => {
                    console.log('Running with data:', testData);
                    const data = await runtimeData.readAll<any>('1234');
                    if (!data) return;
                    console.log(data);
                    const data1 = await runtimeData.readOne('1234', 1);
                    if (!data1) return;
                    console.log(data1);

                    await runtimeData.save({
                        testData: testData,
                    });
                }
            );
        });
    });
});
