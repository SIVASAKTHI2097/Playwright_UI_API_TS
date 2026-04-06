import { request as playwrightRequest } from '@playwright/test';

export type Product = 'test1' | 'test2' | 'mail';
export type AuthProfile = 'default' | 'delete';

type TokenInfo = {
    accessToken: string;
    expiresAt: number;
};

type AuthDetails = {
    oauthUrl: string;
    tenantId: string;
    clientId: string;
    clientSecret: string;
    resource: string;
};

/**
 * Central OAuth token manager
 *
 * Supports:
 * - test1 default client
 * - test2 default client
 * - mail (MS Graph) client
 *
 * Caches token by:
 * - product + authProfile
 *
 * Example cache keys:
 * - test1:default
 * - test2:default
 * - mail:default
 */
class AuthManager {
    private static instance: AuthManager;

    // Token cache per product + auth profile
    private tokenCache = new Map<string, TokenInfo>();

    // In-flight token generation per product + auth profile
    private tokenPromises = new Map<string, Promise<string>>();

    private constructor() {}

    static getInstance(): AuthManager {
        if (!this.instance) {
            this.instance = new AuthManager();
        }
        return this.instance;
    }

    /**
     * Get valid token for product + auth profile
     */
    async getToken(product: Product, authProfile: AuthProfile = 'default'): Promise<string> {
        const cacheKey = this.getCacheKey(product, authProfile);
        const cachedToken = this.tokenCache.get(cacheKey);

        // Reuse valid token
        if (cachedToken && !this.isTokenExpired(cachedToken)) {
            return cachedToken.accessToken;
        }

        // Reuse in-flight token request for same key
        const existingPromise = this.tokenPromises.get(cacheKey);
        if (existingPromise) {
            return existingPromise;
        }

        const tokenPromise = this.generateAndCacheToken(product, authProfile);

        this.tokenPromises.set(cacheKey, tokenPromise);

        try {
            return await tokenPromise;
        } finally {
            // Always cleanup in-flight promise
            this.tokenPromises.delete(cacheKey);
        }
    }

    private getCacheKey(product: Product, authProfile: AuthProfile): string {
        return `${product}:${authProfile}`;
    }

    private isTokenExpired(tokenInfo: TokenInfo): boolean {
        return Date.now() >= tokenInfo.expiresAt;
    }

    private async generateAndCacheToken(product: Product, authProfile: AuthProfile = 'default'): Promise<string> {
        const cacheKey = this.getCacheKey(product, authProfile);
        const authDetails = this.getAuthDetails(product, authProfile);
        const tokenInfo = await this.generateToken(authDetails);

        this.tokenCache.set(cacheKey, tokenInfo);

        return tokenInfo.accessToken;
    }

    private getAuthDetails(product: Product, authProfile: AuthProfile = 'default'): AuthDetails {
        switch (product) {
            case 'test1':
                if (authProfile === 'delete') {
                    return {
                        oauthUrl: process.env.OAUTH_TOKEN_URL!,
                        tenantId: process.env.OAUTH_TENANT_ID!,
                        clientId: process.env.DELETE_CLIENT_ID!,
                        clientSecret: process.env.DELETE_CLIENT_SECRET!,
                        resource: process.env.BASE_URL!,
                    };
                }

                return {
                    oauthUrl: process.env.OAUTH_TOKEN_URL!,
                    tenantId: process.env.OAUTH_TENANT_ID!,
                    clientId: process.env.OAUTH_CLIENT_ID!,
                    clientSecret: process.env.OAUTH_CLIENT_SECRET!,
                    resource: process.env.BASE_URL!,
                };

            case 'mail':
                return {
                    oauthUrl: process.env.OAUTH_TOKEN_URL!,
                    tenantId: process.env.MSGRAPH_OAUTH_TENANT_ID!,
                    clientId: process.env.MSGRAPH_OAUTH_CLIENT_ID!,
                    clientSecret: process.env.MSGRAPH_OAUTH_CLIENT_SECRET!,
                    resource: process.env.MSGRAPH_BASE_URL!, // IMPORTANT: no /v1.0
                };

            default:
                throw new Error(`Unsupported product: ${product}`);
        }
    }

    private async generateToken(authDetails: AuthDetails): Promise<TokenInfo> {
        const tokenEndpoint = `${authDetails.oauthUrl}/${authDetails.tenantId}/oauth2/token`;

        const apiContext = await playwrightRequest.newContext();

        try {
            const response = await apiContext.post(tokenEndpoint, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                form: {
                    client_id: authDetails.clientId,
                    client_secret: authDetails.clientSecret,
                    grant_type: 'client_credentials',
                    resource: authDetails.resource,
                },
            });

            if (!response.ok()) {
                const errorText = await response.text();
                throw new Error(`OAuth token generation failed: ${errorText}`);
            }

            const data = await response.json();

            return {
                accessToken: data.access_token,
                // Refresh 1 minute before expiry
                expiresAt: Date.now() + data.expires_in * 1000 - 60_000,
            };
        } finally {
            await apiContext.dispose();
        }
    }

    /**
     * Optional: clear specific token
     */
    clearToken(product: Product, authProfile: AuthProfile = 'default'): void {
        const cacheKey = this.getCacheKey(product, authProfile);
        this.tokenCache.delete(cacheKey);
        this.tokenPromises.delete(cacheKey);
    }

    /**
     * Optional: clear all tokens
     */
    clearAllTokens(): void {
        this.tokenCache.clear();
        this.tokenPromises.clear();
    }
}

export const authManager = AuthManager.getInstance();
