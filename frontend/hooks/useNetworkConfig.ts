/**
 * React hook for accessing network configuration
 */

import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import {
    getNetworkConfig,
    getTransactionUrl,
    getAddressUrl,
    getBlockUrl,
    formatTokenAmount,
    isTestnet,
    isMainnet,
    type NetworkConfig,
} from '@/lib/networkConfig';

/**
 * Hook to access the current network configuration
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { networkName, nativeTokenSymbol, explorerUrl } = useNetworkConfig();
 *   
 *   return (
 *     <div>
 *       <p>Network: {networkName}</p>
 *       <p>Token: {nativeTokenSymbol}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useNetworkConfig() {
    const chainId = useChainId();

    const config = useMemo(() => getNetworkConfig(), []);

    // Check if the connected wallet is on the correct network
    const isCorrectNetwork = useMemo(() => {
        return chainId === config.chainId;
    }, [chainId, config.chainId]);

    return {
        ...config,
        isCorrectNetwork,
        connectedChainId: chainId,
    };
}

/**
 * Hook to get network-specific URL builders
 * 
 * @example
 * ```tsx
 * function TransactionLink({ txHash }: { txHash: string }) {
 *   const { getTxUrl } = useNetworkUrls();
 *   
 *   return (
 *     <a href={getTxUrl(txHash)} target="_blank" rel="noopener noreferrer">
 *       View Transaction
 *     </a>
 *   );
 * }
 * ```
 */
export function useNetworkUrls() {
    return useMemo(() => ({
        getTxUrl: getTransactionUrl,
        getAddressUrl: getAddressUrl,
        getBlockUrl: getBlockUrl,
    }), []);
}

/**
 * Hook to get token formatting utilities
 * 
 * @example
 * ```tsx
 * function Balance({ amount }: { amount: bigint }) {
 *   const { formatAmount, tokenSymbol } = useTokenFormat();
 *   
 *   return <div>{formatAmount(amount)} {tokenSymbol}</div>;
 * }
 * ```
 */
export function useTokenFormat() {
    const { nativeTokenSymbol } = useNetworkConfig();

    return useMemo(() => ({
        formatAmount: formatTokenAmount,
        tokenSymbol: nativeTokenSymbol,
    }), [nativeTokenSymbol]);
}

/**
 * Hook to check network type
 * 
 * @example
 * ```tsx
 * function FaucetButton() {
 *   const { isTestnet, isMainnet } = useNetworkType();
 *   
 *   if (!isTestnet) {
 *     return null; // Don't show faucet on mainnet
 *   }
 *   
 *   return <button>Request Testnet Tokens</button>;
 * }
 * ```
 */
export function useNetworkType() {
    return useMemo(() => ({
        isTestnet: isTestnet(),
        isMainnet: isMainnet(),
    }), []);
}

/**
 * Hook to check if a feature is enabled
 * 
 * @example
 * ```tsx
 * function FaucetSection() {
 *   const { faucetEnabled } = useFeatureFlags();
 *   
 *   if (!faucetEnabled) return null;
 *   
 *   return <FaucetComponent />;
 * }
 * ```
 */
export function useFeatureFlags() {
    const { features } = useNetworkConfig();

    return useMemo(() => ({
        faucetEnabled: features.faucetEnabled,
        debugMode: features.debugMode,
    }), [features]);
}

