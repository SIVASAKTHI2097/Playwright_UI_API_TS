import { test } from '@fixtures/common/common.ui.api.fixture';
/** Test to read and store test data */
test.describe.serial('Storing and Reading Data Example', () => {
    test(
        'TC001_Create_Data',
        {
            tag: ['@examples'],
            annotation: { type: 'TC', description: '1111' },
        },
        async ({ runtimeData }) => {
            let num: number = 1;
            await runtimeData.save({
                poId: ++num,
                soId: 'SO456',
                customerId: 'C789',
                token: 'abc123',
                amount: 5000,
            });
        }
    );

    /** Test to use the stored data */
    test('TC002_Use_Data', { tag: ['@examples'], annotation: { type: 'TC', description: '1222' } }, async ({ runtimeData }) => {
        const data = await runtimeData.readAll<any>('TC001_Create_Data');
        if (!data) return;
        await Promise.all(
            data.map(async (d) => {
                console.log(d.poId, d.customerId);
            })
        );

        data?.map((d) => console.log(d.amount));
    });
});
