import { authManager, Product, AuthProfile } from '@utils/api-utils/auth-manager';
import { ApiRequestFn, ApiResponse } from '@utils/api-utils/api-types';

export class ApiClient {
    constructor(
        private readonly apiRequest: ApiRequestFn,
        private readonly baseUrl: string,
        private readonly product: Product,
        private readonly authProfile: AuthProfile = 'default'
    ) {}

    private async withAuth<T>(params: Omit<Parameters<ApiRequestFn>[0], 'baseUrl' | 'token'>): Promise<ApiResponse<T>> {
        const token = await authManager.getToken(this.product, this.authProfile);

        return this.apiRequest<T>({
            ...params,
            baseUrl: this.baseUrl,
            token,
        });
    }

    async get<T>(restPoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.withAuth<T>({
            method: 'GET',
            restPoint,
            headers,
        });
    }

    async post<T>(restPoint: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.withAuth<T>({
            method: 'POST',
            restPoint,
            body,
            headers,
        });
    }

    async put<T>(restPoint: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.withAuth<T>({
            method: 'PUT',
            restPoint,
            body,
            headers,
        });
    }

    async patch<T>(restPoint: string, body?: unknown, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.withAuth<T>({
            method: 'PATCH',
            restPoint,
            body,
            headers,
        });
    }

    async delete<T>(restPoint: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
        return this.withAuth<T>({
            method: 'DELETE',
            restPoint,
            headers,
        });
    }
}
