/**
 * Network Configuration Utilities
 * 
 * This module provides utilities for managing network configurations
 * across different EVM-compatible chains (U2U, Celo, etc.)
 */

import { Chain } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';
import { u2uMainnet, u2uTestnet } from './wagmi';

/**
 * Supported network identifiers
 */
export type NetworkType = 'u2u' | 'u2u-testnet' | 'celo' | 'celo-alfajores';

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
    const network = process.env.NEXT_PUBLIC_NETWORK as NetworkType;

    // Validate network type
    const validNetworks: NetworkType[] = ['u2u', 'u2u-testnet', 'celo', 'celo-alfajores'];
    if (!network || !validNetworks.includes(network)) {
        console.warn(`Invalid network "${network}", defaulting to u2u-testnet`);
        return 'u2u-testnet';
    }

    return network;
}

/**
 * Get the viem Chain object for a given network
 */
export function getChainForNetwork(network: NetworkType): Chain {
    switch (network) {
        case 'u2u':
            return u2uMainnet;
        case 'u2u-testnet':
            return u2uTestnet;
        case 'celo':
            return celo;
        case 'celo-alfajores':
            return celoAlfajores;
        default:
            return u2uTestnet;
    }
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
        'NEXT_PUBLIC_NETWORK',
        'NEXT_PUBLIC_CHAIN_ID',
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

    // Validate chain ID matches network
    const config = getNetworkConfig();
    if (config.chainId !== config.chain.id) {
        console.warn(
            `Chain ID mismatch: NEXT_PUBLIC_CHAIN_ID (${config.chainId}) does not match ` +
            `expected chain ID for ${config.network} (${config.chain.id})`
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
    const network = getCurrentNetwork();
    return network === 'u2u-testnet' || network === 'celo-alfajores';
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
        'u2u': {
            network: 'u2u',
            chainId: 39,
            networkName: 'U2U Network',
            nativeTokenSymbol: 'U2U',
            explorerUrl: 'https://u2uscan.xyz',
            chain: u2uMainnet,
        },
        'u2u-testnet': {
            network: 'u2u-testnet',
            chainId: 2484,
            networkName: 'U2U Nebulas Testnet',
            nativeTokenSymbol: 'U2U',
            explorerUrl: 'https://testnet.u2uscan.xyz',
            chain: u2uTestnet,
        },
        'celo': {
            network: 'celo',
            chainId: 42220,
            networkName: 'Celo',
            nativeTokenSymbol: 'CELO',
            explorerUrl: 'https://explorer.celo.org',
            chain: celo,
        },
        'celo-alfajores': {
            network: 'celo-alfajores',
            chainId: 44787,
            networkName: 'Celo Alfajores Testnet',
            nativeTokenSymbol: 'CELO',
            explorerUrl: 'https://alfajores.celoscan.io',
            chain: celoAlfajores,
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

