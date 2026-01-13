import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain, http } from 'viem';
// Define Mantle Sepolia Testnet chain
export const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
    public: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://explorer.sepolia.mantle.xyz',
    },
  },
  testnet: true,
});

/**
 * Get network configuration from environment
 * This function is used internally by wagmi configuration
 * For application-wide network config, use getNetworkConfig() from networkConfig.ts
 */
const getWagmiNetworkConfig = () => {
  // Default to Mantle Sepolia
  return {
    chain: mantleSepolia,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.mantle.xyz',
  };
};

const networkConfig = getWagmiNetworkConfig();

// Get project ID from environment or use fallback
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '609f45d188c096567677077f5b0b4175';

// Configure RainbowKit with proper network settings
export const config = getDefaultConfig({
  appName: 'Pepasur Game',
  projectId: projectId,
  chains: [networkConfig.chain],
  ssr: true, // Enable SSR support
  transports: {
    [networkConfig.chain.id]: http(networkConfig.rpcUrl),
  },
});

// Export the active chain for use in components
export const activeChain = networkConfig.chain;
