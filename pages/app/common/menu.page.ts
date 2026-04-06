//#region Menu Definition
export const Menu = {
    AccountsPayable: {
        module: 'Accounts payable',

        Vendors: {
            parent: 'Vendors',
            AllVendors: {
                label: 'All vendors',
            },
            VendorsOnHold: {
                label: 'Vendors on hold',
            },
        },
    },

    AccountsReceivable: {
        module: 'Accounts receivable',

        Customers: {
            parent: 'Customers',
            AllCustomers: {
                label: 'All customers',
            },
        },
    },

    Inventorymanagement: {
        module: 'Inventory management',

        Setup: {
            label: 'Setup',

            Inventory: {
                label: 'Inventory',

                Itemgroups: {
                    label: 'Item groups',
                },
            },
        },
    },
} as const;

export type MenuNode = {
    module: string;
    parent?: string;
    label: string;
};
//#endregion
