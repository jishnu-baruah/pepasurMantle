import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain, http } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';

// Define Celo Sepolia Testnet chain
export const celoSepolia = defineChain({
  id: 11142220,
  name: 'Celo Sepolia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CELO',
    symbol: 'CELO',
  },
  rpcUrls: {
    default: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
    public: {
      http: ['https://forno.celo-sepolia.celo-testnet.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Celo Sepolia Explorer',
      url: 'https://celo-sepolia.blockscout.com',
    },
  },
  testnet: true,
});

// Define U2U Mainnet chain
export const u2uMainnet = defineChain({
  id: 39,
  name: 'U2U Network',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-mainnet.uniultra.xyz'],
      webSocket: ['wss://ws-mainnet.uniultra.xyz'],
    },
    public: {
      http: ['https://rpc-mainnet.uniultra.xyz'],
      webSocket: ['wss://ws-mainnet.uniultra.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2UScan',
      url: 'https://u2uscan.xyz',
    },
  },
  testnet: false,
});

// Define U2U Nebulas Testnet chain
export const u2uTestnet = defineChain({
  id: 2484,
  name: 'U2U Nebulas Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'U2U',
    symbol: 'U2U',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
    },
    public: {
      http: ['https://rpc-nebulas-testnet.u2u.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'U2U Testnet Explorer',
      url: 'https://testnet.u2uscan.xyz',
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
  const network = process.env.NEXT_PUBLIC_NETWORK || 'celoSepolia';

  switch (network) {
    case 'u2u':
      return {
        chain: u2uMainnet,
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-mainnet.uniultra.xyz',
      };
    case 'u2u-testnet':
      return {
        chain: u2uTestnet,
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc-nebulas-testnet.u2u.xyz',
      };
    case 'celo':
      return {
        chain: celo,
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://forno.celo.org',
      };
    case 'celo-alfajores':
    case 'celoAlfajores':
      return {
        chain: celoAlfajores,
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.ankr.com/celo_alfajores',
      };
    case 'celoSepolia':
    case 'celo-sepolia':
      return {
        chain: celoSepolia,
        rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org',
      };
    default:
      return {
        chain: celoSepolia,
        rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
      };
  }
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
