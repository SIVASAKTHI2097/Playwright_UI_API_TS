import { test as base } from '@playwright/test';
import { apiTransport } from '@utils/api-utils/api-transport';
import { ApiClient } from '@utils/api-utils/api-client';
import { ApiRequestFn, ApiRequestParams } from '@utils/api-utils/api-types';

/**
 * API FIXTURE LAYER
 * This file integrates API client with Playwright fixtures.
 *
 * Responsibility:
 * - Create apiRequest function using Playwright request context
 * - Create ApiClient instance
 * - Inject `api` into tests
 *
 * It does NOT:
 * - Contain business logic
 * - Generate tokens
 * - Build payloads
 */

type ApiFixture = {
    api: ApiClient;
    deleteApi: ApiClient;
    mailApi: ApiClient;
};

function createApiRequest(request: any): ApiRequestFn {
    return async <T>(params: ApiRequestParams) => {
        return apiTransport<T>(request, params);
    };
}

export const test = base.extend<ApiFixture>({
    api: async ({ request }, use) => {
        const apiRequest = createApiRequest(request);

        const api = new ApiClient(apiRequest, process.env.BASE_URL!, 'test1', 'default');

        await use(api);
    },

    deleteApi: async ({ request }, use) => {
        const apiRequest = createApiRequest(request);

        const deleteApi = new ApiClient(apiRequest, process.env.BASE_URL!, 'test2', 'delete');

        await use(deleteApi);
    },

    mailApi: async ({ request }, use) => {
        const apiRequest = createApiRequest(request);

        const mailApi = new ApiClient(apiRequest, process.env.MSGRAPH_BASE_URL!, 'mail', 'default');

        await use(mailApi);
    },
});

export const expect = base.expect;
