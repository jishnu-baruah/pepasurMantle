# Frontend Library Utilities

This directory contains core utilities and configurations for the Pepasur frontend application.

## Network Configuration

### Files

- **`networkConfig.ts`** - Core network configuration utilities
- **`validateEnv.ts`** - Environment variable validation
- **`wagmi.ts`** - Wagmi and RainbowKit configuration
- **`hooks/useNetworkConfig.ts`** - React hooks for network configuration

### Usage Examples

#### Getting Network Configuration

```typescript
import { getNetworkConfig, networkConfig } from '@/lib/networkConfig';

// Get current network config
const config = getNetworkConfig();
console.log(config.networkName); // "U2U Network"
console.log(config.nativeTokenSymbol); // "U2U"
console.log(config.contractAddress); // "0x..."

// Or use the singleton instance
console.log(networkConfig.chainId); // 39
```

#### Using Network Config in React Components

```typescript
import { useNetworkConfig } from '@/hooks/useNetworkConfig';

function MyComponent() {
  const { 
    networkName, 
    nativeTokenSymbol, 
    isCorrectNetwork,
    connectedChainId 
  } = useNetworkConfig();
  
  if (!isCorrectNetwork) {
    return <div>Please switch to {networkName}</div>;
  }
  
  return <div>Connected to {networkName}</div>;
}
```

#### Building Explorer URLs

```typescript
import { useNetworkUrls } from '@/hooks/useNetworkConfig';

function TransactionLink({ txHash }: { txHash: string }) {
  const { getTxUrl } = useNetworkUrls();
  
  return (
    <a href={getTxUrl(txHash)} target="_blank" rel="noopener noreferrer">
      View on Explorer
    </a>
  );
}
```

#### Formatting Token Amounts

```typescript
import { useTokenFormat } from '@/hooks/useNetworkConfig';

function Balance({ amount }: { amount: bigint }) {
  const { formatAmount, tokenSymbol } = useTokenFormat();
  
  return (
    <div>
      Balance: {formatAmount(amount.toString())} {tokenSymbol}
    </div>
  );
}
```

#### Feature Flags

```typescript
import { useFeatureFlags } from '@/hooks/useNetworkConfig';

function FaucetButton() {
  const { faucetEnabled } = useFeatureFlags();
  
  if (!faucetEnabled) return null;
  
  return <button>Request Testnet Tokens</button>;
}
```

#### Network Type Checking

```typescript
import { useNetworkType } from '@/hooks/useNetworkConfig';

function NetworkBadge() {
  const { isTestnet, isMainnet } = useNetworkType();
  
  return (
    <span className={isTestnet ? 'badge-warning' : 'badge-success'}>
      {isTestnet ? 'Testnet' : 'Mainnet'}
    </span>
  );
}
```

#### Validating Environment

```typescript
import { validateEnvironment } from '@/lib/validateEnv';

// In your app initialization (e.g., _app.tsx)
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  // Handle error appropriately
}
```

## Available Network Configurations

### U2U Mainnet
- Chain ID: 39
- Network: `u2u`
- Token: U2U
- Explorer: https://u2uscan.xyz

### U2U Nebulas Testnet
- Chain ID: 2484
- Network: `u2u-testnet`
- Token: U2U
- Explorer: https://testnet.u2uscan.xyz

### Celo Mainnet
- Chain ID: 42220
- Network: `celo`
- Token: CELO
- Explorer: https://explorer.celo.org

### Celo Alfajores Testnet
- Chain ID: 44787
- Network: `celo-alfajores`
- Token: CELO
- Explorer: https://alfajores.celoscan.io

## Environment Variables

See `ENV_SETUP.md` in the frontend root for complete documentation on environment variables and configuration.

## Best Practices

1. **Always use the configuration utilities** instead of hardcoding network values
2. **Check network compatibility** before performing transactions
3. **Use the provided hooks** in React components for reactive updates
4. **Validate environment** during app initialization
5. **Use feature flags** to conditionally enable/disable features based on network

