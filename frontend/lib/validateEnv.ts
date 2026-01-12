/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are set
 * and have valid values. It should be called during app initialization.
 */

import { validateNetworkConfig, isValidAddress } from './networkConfig';

/**
 * Validate all environment variables
 * This function should be called early in the app initialization
 * 
 * @throws Error if validation fails
 */
export function validateEnvironment(): void {
    try {
        // Validate network configuration
        validateNetworkConfig();

        // Additional validations
        validateApiUrls();
        validateWalletConnectConfig();

        console.log('✅ Environment validation passed');
    } catch (error) {
        console.error('❌ Environment validation failed:', error);
        throw error;
    }
}

/**
 * Validate API URLs
 */
function validateApiUrls(): void {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    if (!apiUrl) {
        throw new Error('NEXT_PUBLIC_API_URL is not set');
    }

    if (!wsUrl) {
        throw new Error('NEXT_PUBLIC_WS_URL is not set');
    }

    // Validate URL format
    try {
        new URL(apiUrl);
    } catch {
        throw new Error(`Invalid NEXT_PUBLIC_API_URL: ${apiUrl}`);
    }

    // Validate WebSocket URL format
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
        throw new Error(`Invalid NEXT_PUBLIC_WS_URL: ${wsUrl} (must start with ws:// or wss://)`);
    }
}

/**
 * Validate WalletConnect configuration
 */
function validateWalletConnectConfig(): void {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

    if (!projectId) {
        console.warn(
            '⚠️  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set. ' +
            'Using fallback project ID. For production, get your own project ID from https://cloud.walletconnect.com/'
        );
    }
}

/**
 * Get a summary of the current environment configuration
 * Useful for debugging and logging
 */
export function getEnvironmentSummary(): Record<string, string | boolean | number> {
    return {
        network: process.env.NEXT_PUBLIC_NETWORK || 'not set',
        chainId: process.env.NEXT_PUBLIC_CHAIN_ID || 'not set',
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'not set',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'not set',
        wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'not set',
        networkName: process.env.NEXT_PUBLIC_NETWORK_NAME || 'not set',
        tokenSymbol: process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'not set',
        explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || 'not set',
        faucetEnabled: process.env.NEXT_PUBLIC_ENABLE_FAUCET === 'true',
        debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
    };
}

/**
 * Check if the app is running in development mode
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

/**
 * Check if the app is running in production mode
 */
export function isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
}

/**
 * Safe environment validation that doesn't throw
 * Returns validation result and any errors
 */
export function safeValidateEnvironment(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        validateEnvironment();
        return { isValid: true, errors, warnings };
    } catch (error) {
        if (error instanceof Error) {
            errors.push(error.message);
        } else {
            errors.push('Unknown validation error');
        }
        return { isValid: false, errors, warnings };
    }
}

