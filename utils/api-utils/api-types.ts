/**
 * This file contains only TypeScript types and interfaces.
 * No HTTP calls, no Playwright, no business logic.
 *
 * Responsibility:
 * - Define how an API request should look (method, url, body, token, etc.)
 * - Define how an API response should look (status, body)
 *
 * Used by:
 * - api-core (to build requests)
 * - api-transport (to know input/output structure)
 *
 * Example:
 * ApiRequestParams = { method, url, body, token }
 * ApiResponse<T>   = { status, body }
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiRequestParams = {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    restPoint: string;
    baseUrl: string;
    token: string;
    body?: unknown;
    headers?: Record<string, string>;
};

export type ApiResponse<T> = {
    status: number;
    body: T;
};

export type ApiRequestFn = <T>(params: ApiRequestParams) => Promise<ApiResponse<T>>;
