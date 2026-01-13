/**
 * Network Configuration Utilities
 * 
 * This module provides utilities for managing network configurations
 * across different EVM-compatible chains (U2U, Celo, etc.)
 */

import { Chain } from 'viem';
import { mantleSepolia } from './wagmi';

/**
 * Supported network identifiers
 */
export type NetworkType = 'mantle-sepolia';

/**
 * Network configuration interface
 */
export interface NetworkConfig {
    /** Network identifier */
    network: NetworkType;
    /** Chain ID */
    chainId: number;
    /** RPC URL */
    rpcUrl: string;
    /** Contract address */
    contractAddress: string;
    /** API base URL */
    apiUrl: string;
    /** WebSocket URL */
    wsUrl: string;
    /** Network display name */
    networkName: string;
    /** Native token symbol */
    nativeTokenSymbol: string;
    /** Block explorer URL */
    explorerUrl: string;
    /** WalletConnect project ID */
    walletConnectProjectId: string;
    /** Feature flags */
    features: {
        faucetEnabled: boolean;
        debugMode: boolean;
    };
    /** viem Chain object */
    chain: Chain;
}

/**
 * Get the current network type from environment variables
 */
export function getCurrentNetwork(): NetworkType {
    // Always return mantle-sepolia
    return 'mantle-sepolia';
}

/**
 * Get the viem Chain object for a given network
 */
export function getChainForNetwork(network: NetworkType): Chain {
    return mantleSepolia;
}

/**
 * Get the complete network configuration from environment variables
 */
export function getNetworkConfig(): NetworkConfig {
    const network = getCurrentNetwork();
    const chain = getChainForNetwork(network);

    // Get configuration from environment variables with fallbacks
    const config: NetworkConfig = {
        network,
        chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || String(chain.id)),
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || chain.rpcUrls.default.http[0],
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
        wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
        networkName: process.env.NEXT_PUBLIC_NETWORK_NAME || chain.name,
        nativeTokenSymbol: process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || chain.nativeCurrency.symbol,
        explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || chain.blockExplorers?.default.url || '',
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '609f45d188c096567677077f5b0b4175',
        features: {
            faucetEnabled: process.env.NEXT_PUBLIC_ENABLE_FAUCET === 'true',
            debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
        },
        chain,
    };

    return config;
}

/**
 * Validate that all required environment variables are set
 * @throws Error if required variables are missing
 */
export function validateNetworkConfig(): void {
    const requiredVars = [
        'NEXT_PUBLIC_CONTRACT_ADDRESS',
        'NEXT_PUBLIC_API_URL',
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env.local file and ensure all required variables are set.'
        );
    }

    // Validate contract address format
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (contractAddress && !isValidAddress(contractAddress)) {
        throw new Error(
            `Invalid contract address: ${contractAddress}\n` +
            'Contract address must be a valid Ethereum address (0x followed by 40 hexadecimal characters).'
        );
    }
}

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get the block explorer URL for a transaction
 */
export function getTransactionUrl(txHash: string): string {
    const config = getNetworkConfig();
    return `${config.explorerUrl}/tx/${txHash}`;
}

/**
 * Get the block explorer URL for an address
 */
export function getAddressUrl(address: string): string {
    const config = getNetworkConfig();
    return `${config.explorerUrl}/address/${address}`;
}

/**
 * Get the block explorer URL for a block
 */
export function getBlockUrl(blockNumber: number | string): string {
    const config = getNetworkConfig();
    return `${config.explorerUrl}/block/${blockNumber}`;
}

/**
 * Format token amount for display
 * @param amount Amount in wei (as string or bigint)
 * @param decimals Number of decimal places to show (default: 4)
 */
export function formatTokenAmount(amount: string | bigint, decimals: number = 4): string {
    const config = getNetworkConfig();
    const amountInEther = Number(amount) / 1e18;
    return `${amountInEther.toFixed(decimals)} ${config.nativeTokenSymbol}`;
}

/**
 * Check if the current network is a testnet
 */
export function isTestnet(): boolean {
    return true; // Mantle Sepolia is a testnet
}

/**
 * Check if the current network is a mainnet
 */
export function isMainnet(): boolean {
    return !isTestnet();
}

/**
 * Get network-specific configuration for a given network type
 * Useful for displaying information about other networks
 */
export function getNetworkInfo(network: NetworkType): Partial<NetworkConfig> {
    const chain = getChainForNetwork(network);

    const networkInfo: Record<NetworkType, Partial<NetworkConfig>> = {
        'mantle-sepolia': {
            network: 'mantle-sepolia',
            chainId: 5003,
            networkName: 'Mantle Sepolia',
            nativeTokenSymbol: 'MNT',
            explorerUrl: 'https://explorer.sepolia.mantle.xyz',
            chain: mantleSepolia,
        },
    };

    return networkInfo[network];
}

/**
 * Log current network configuration (useful for debugging)
 */
export function logNetworkConfig(): void {
    if (typeof window === 'undefined') return; // Only log on client side

    const config = getNetworkConfig();

    if (config.features.debugMode) {
        console.group('🌐 Network Configuration');
        console.log('Network:', config.network);
        console.log('Chain ID:', config.chainId);
        console.log('RPC URL:', config.rpcUrl);
        console.log('Contract Address:', config.contractAddress);
        console.log('API URL:', config.apiUrl);
        console.log('WebSocket URL:', config.wsUrl);
        console.log('Network Name:', config.networkName);
        console.log('Token Symbol:', config.nativeTokenSymbol);
        console.log('Explorer URL:', config.explorerUrl);
        console.log('Features:', config.features);
        console.groupEnd();
    }
}

// Export a singleton instance of the current network config
export const networkConfig = getNetworkConfig();

// Log configuration on module load (only in debug mode)
if (typeof window !== 'undefined') {
    logNetworkConfig();
}

