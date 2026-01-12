# Frontend Environment Configuration Guide

This guide explains how to configure the Pepasur frontend for different blockchain networks.

## Overview

The frontend supports multiple EVM-compatible networks:
- **U2U Mainnet** - Production deployment
- **U2U Nebulas Testnet** - Development and testing
- **Celo Mainnet** - Production deployment
- **Celo Alfajores Testnet** - Development and testing

## Quick Start

### 1. Choose Your Network

Copy the appropriate environment file for your target network:

```bash
# For U2U Mainnet
cp .env.u2u .env.local

# For U2U Testnet (default for development)
cp .env.u2u-testnet .env.local

# For Celo Mainnet
cp .env.celo .env.local

# For Celo Alfajores Testnet
cp .env.celo-alfajores .env.local
```

### 2. Update Contract Address

After deploying the Pepasur smart contract, update the contract address in your `.env.local` file:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
```

### 3. Configure API Endpoints

Update the backend API URLs to match your deployment:

```bash
# For local development
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# For production
NEXT_PUBLIC_API_URL=https://api.u2u.pepasur.xyz
NEXT_PUBLIC_WS_URL=wss://api.u2u.pepasur.xyz
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Environment Variables Reference

### Network Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_NETWORK` | Network identifier | `u2u`, `u2u-testnet`, `celo`, `celo-alfajores` |
| `NEXT_PUBLIC_CHAIN_ID` | Blockchain chain ID | `39` (U2U), `42220` (Celo) |
| `NEXT_PUBLIC_RPC_URL` | RPC endpoint URL | `https://rpc-mainnet.uniultra.xyz` |

### Smart Contract Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Deployed contract address | `0x1234...5678` |

### API Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `https://api.u2u.pepasur.xyz` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for real-time updates | `wss://api.u2u.pepasur.xyz` |

### Wallet Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Get from [WalletConnect Cloud](https://cloud.walletconnect.com/) |

### Display Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_NETWORK_NAME` | Network name shown in UI | `U2U Network` |
| `NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL` | Token symbol shown in UI | `U2U`, `CELO` |
| `NEXT_PUBLIC_EXPLORER_URL` | Block explorer base URL | `https://u2uscan.xyz` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENABLE_FAUCET` | Enable faucet feature | `true` (testnet), `false` (mainnet) |
| `NEXT_PUBLIC_DEBUG_MODE` | Enable debug logging | `false` |

## Network-Specific Configurations

### U2U Mainnet

```bash
NEXT_PUBLIC_NETWORK=u2u
NEXT_PUBLIC_CHAIN_ID=39
NEXT_PUBLIC_RPC_URL=https://rpc-mainnet.uniultra.xyz
NEXT_PUBLIC_NETWORK_NAME=U2U Network
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=U2U
NEXT_PUBLIC_EXPLORER_URL=https://u2uscan.xyz
```

**Deployment URL**: `https://u2u.pepasur.xyz`

### U2U Nebulas Testnet

```bash
NEXT_PUBLIC_NETWORK=u2u-testnet
NEXT_PUBLIC_CHAIN_ID=2484
NEXT_PUBLIC_RPC_URL=https://rpc-nebulas-testnet.u2u.xyz
NEXT_PUBLIC_NETWORK_NAME=U2U Nebulas Testnet
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=U2U
NEXT_PUBLIC_EXPLORER_URL=https://testnet.u2uscan.xyz
```

**Use for**: Local development and testing

### Celo Mainnet

```bash
NEXT_PUBLIC_NETWORK=celo
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_NETWORK_NAME=Celo
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=CELO
NEXT_PUBLIC_EXPLORER_URL=https://explorer.celo.org
```

**Deployment URL**: `https://celo.pepasur.xyz`

### Celo Alfajores Testnet

```bash
NEXT_PUBLIC_NETWORK=celo-alfajores
NEXT_PUBLIC_CHAIN_ID=44787
NEXT_PUBLIC_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_NETWORK_NAME=Celo Alfajores Testnet
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=CELO
NEXT_PUBLIC_EXPLORER_URL=https://alfajores.celoscan.io
```

**Use for**: Celo development and testing

## Switching Networks

### During Development

1. Stop your development server (Ctrl+C)
2. Copy the desired network configuration:
   ```bash
   cp .env.u2u-testnet .env.local
   ```
3. Update the contract address if needed
4. Restart the development server:
   ```bash
   npm run dev
   ```

### For Production Deployment

Each network should have its own deployment:

1. **U2U Production**:
   - Use `.env.u2u` configuration
   - Deploy to `u2u.pepasur.xyz`
   - Ensure backend is configured for U2U mainnet

2. **Celo Production**:
   - Use `.env.celo` configuration
   - Deploy to `celo.pepasur.xyz`
   - Ensure backend is configured for Celo mainnet

## Build Commands

### Development Build

```bash
npm run dev
```

### Production Build

```bash
# Build with current .env.local configuration
npm run build

# Start production server
npm start
```

### Network-Specific Production Builds

```bash
# Build for U2U Mainnet
cp .env.u2u .env.local && npm run build

# Build for Celo Mainnet
cp .env.celo .env.local && npm run build
```

## Troubleshooting

### Wrong Network Detected

If users see a "wrong network" message:
1. Verify `NEXT_PUBLIC_CHAIN_ID` matches the deployed contract's network
2. Check that `NEXT_PUBLIC_NETWORK` is set correctly
3. Ensure the RPC URL is accessible

### Contract Not Found

If contract interactions fail:
1. Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is correct
2. Ensure the contract is deployed on the configured network
3. Check that the contract ABI in `lib/PepasurABI.json` matches the deployed contract

### Wallet Connection Issues

If wallet connection fails:
1. Verify `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is valid
2. Check that the network is added to the user's wallet
3. Ensure RPC URL is accessible from the user's location

### API Connection Issues

If backend communication fails:
1. Verify `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` are correct
2. Check that the backend is running and accessible
3. Ensure CORS is configured correctly on the backend

## Security Notes

- Never commit `.env.local` to version control (it's in `.gitignore`)
- Keep `.env.*.example` files updated with the latest variables
- Use different WalletConnect project IDs for production and development
- Regularly rotate API keys and sensitive credentials

## Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [U2U Network Documentation](https://docs.uniultra.xyz/)
- [Celo Documentation](https://docs.celo.org/)

