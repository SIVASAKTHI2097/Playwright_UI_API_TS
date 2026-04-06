import type { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiRequestParams, ApiResponse } from '@utils/api-utils/api-types';

/**
 * This file is the only place where real HTTP calls happen.
 * It uses Playwright's APIRequestContext to send requests.
 *
 * Responsibility:
 * - Add headers (Authorization, Content-Type)
 * - Build full URL
 * - Call request.get / post / put / delete
 * - Parse response (JSON / text)
 *
 * It does NOT:
 * - Know about business logic
 * - Know about OAuth details
 * - Know about test cases
 *
 * Flow:
 * ApiClient → apiRequestFn → apiTransport → Real Server
 *
 * @param {APIRequestContext} request Playwright request context
 * @param {ApiRequestParams} params The API request parameters
 * @returns {Promise<ApiResponse<T>>}
 */
export async function apiTransport<T = unknown>(request: APIRequestContext, params: ApiRequestParams): Promise<ApiResponse<T>> {
    const { method, restPoint, baseUrl, body, token } = params;

    const options: any = {
        headers: {
            'Content-Type': 'application/json',
            ...(params.headers || {}),
        },
    };

    if (params.token) {
        options.headers['Authorization'] = `Bearer ${params.token}`;
    }

    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (body) {
        options.data = body;
    }

    const fullUrl = baseUrl ? `${baseUrl}${restPoint}` : restPoint;

    let response: APIResponse;

    switch (method) {
        case 'GET':
            response = await request.get(fullUrl, options);
            break;
        case 'POST':
            response = await request.post(fullUrl, options);
            break;
        case 'PUT':
            response = await request.put(fullUrl, options);
            break;
        case 'DELETE':
            response = await request.delete(fullUrl, options);
            break;
        default:
            throw new Error(`Unsupported method: ${method}`);
    }

    const status = response.status();
    let responseBody: any = null;

    try {
        responseBody = await response.json();
    } catch {
        responseBody = await response.text();
    }

    return { status, body: responseBody as T };
}
