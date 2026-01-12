# Pepasur - Quick Start Guide

Get Pepasur running quickly on EVM-compatible networks.

## 📋 Prerequisites

- **Node.js v18+**
- **EVM Wallet** (MetaMask, etc.)
- **Native Tokens** (U2U or CELO for staking)

## 🚀 Quick Setup

### 1. Deploy Smart Contracts

```bash
cd contract
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network <network>
npx hardhat run scripts/initialize.js --network <network>
```

### 2. Start Backend

```bash
cd ../backend
npm install
# Configure .env with contract address
npm run dev
```

### 3. Start Frontend

```bash
cd ../frontend
npm install
# Configure .env.local with contract address
npm run dev
```

## 🌐 Networks

### U2U Network
- **Chain ID**: 39
- **RPC**: `https://rpc-mainnet.uniultra.xyz`
- **Explorer**: `https://u2uscan.xyz`

### Celo Network
- **Chain ID**: 42220 (Mainnet) / 11142220 (Sepolia Testnet)
- **RPC**: `https://forno.celo.org`
- **Explorer**: `https://explorer.celo.org`

## 🎮 How to Play

1. **Connect Wallet** - MetaMask or WalletConnect
2. **Create/Join Game** - Stake tokens to participate
3. **Play Roles**:
   - **ASUR (Mafia)**: Eliminate players at night
   - **DEV (Doctor)**: Protect players from elimination
   - **MANAV (Villager)**: Vote to eliminate suspected Mafia
   - **RISHI (Detective)**: Investigate player roles
4. **Win Rewards** - Automatic distribution via smart contracts

## 📚 Detailed Setup

For comprehensive instructions:
- **[Backend Setup](../backend/README.md)**
- **[Frontend Setup](../frontend/README.md)**
- **[Contract Deployment](../contract/README.md)**
- **[Celo Deployment](./CELO_SEPOLIA_DEPLOYMENT.md)**

## 🆘 Troubleshooting

- [RPC Issues](./RPC_TIMEOUT_TROUBLESHOOTING.md)
- [Migration Guide](./MIGRATION_GUIDE.md)