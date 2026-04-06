import { TestInfo } from '@playwright/test';

export type Credentials = {
    username: string;
    password: string;
};

export function resolveCredentials(testInfo: TestInfo): Credentials {
    const tags = testInfo.tags.map((t) => t.toLowerCase());

    const isManager = tags.includes('@manager');
    const isApprover = tags.includes('@approver');

    if (isManager && isApprover) {
        throw new Error('Test cannot have both @manager and @approver tags.');
    }

    let username: string | undefined;
    let password: string | undefined;

    if (isManager) {
        username = process.env._MANAGER_USERNAME;
        password = process.env._MANAGER_PASSWORD;
    } else if (isApprover) {
        username = process.env._APPROVER_USERNAME;
        password = process.env._APPROVER_PASSWORD;
    } else {
        username = process.env._USERNAME;
        password = process.env._PASSWORD;
    }

    if (!username || !password) {
        throw new Error('Missing credentials for selected role.');
    }

    return { username, password };
}
