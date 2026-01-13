# PepasurMantle 🐸

**An on-chain Mafia game powered by EVM-compatible blockchains**

Pepasur is a multiplayer Mafia-style social deduction game built on EVM-compatible blockchains. Players stake native tokens and compete through strategic gameplay, with winners receiving rewards distributed automatically through smart contracts.

## 🚀 Quick Setup

### Prerequisites
- Node.js v18+
- EVM wallet (MetaMask, etc.)
- Native tokens (MNT)

### 3. Configuration

The project uses `.env` files for configuration.
Copy `.env.example` to `.env` in the `backend/` and `contract/` directories, and `.env.local.example` to `.env.local` in the `frontend/` directory.

**Key Configuration Variables:**
- `DEPLOYER_PRIVATE_KEY`: Your wallet private key for deploying contracts
- `SERVER_SIGNER_ADDRESS`: Address of the server wallet that signs settlements
- `SERVER_PRIVATE_KEY`: Private key of the server wallet
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Address of the deployed Pepasur contract

**Active Deployment (Mantle Sepolia):**
- **Contract Address:** `0x87Fc95Fc7B2350880d1e4Ca10B7c78BC56225a8b`
- **Chain ID:** `5003` (Mantle Sepolia Testnet)
- **Explorer:** [Mantle Sepolia Explorer](https://explorer.sepolia.mantle.xyz/address/0x87Fc95Fc7B2350880d1e4Ca10B7c78BC56225a8b)

### 4. Running Locally
```bash
# 1. Deploy contracts
cd contract && npm install && npm run deploy

# 2. Start backend
cd ../backend && npm install && npm run dev

# 3. Start frontend  
cd ../frontend && npm install && npm run dev
```

**👉 For detailed setup: [QUICK_DEPLOYMENT_GUIDE.md](./QUICK_DEPLOYMENT_GUIDE.md)**

## 📂 Repository Structure

```
pepasur/
├── frontend/          # Next.js frontend application
├── backend/           # Node.js backend server  
├── contract/          # Solidity smart contracts
└── docs/             # Documentation
```

## 🛠️ Tech Stack

- **Smart Contracts**: Solidity + Hardhat
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Next.js + React + TypeScript + wagmi
- **Database**: MongoDB

## 📚 Documentation

- **[Quick Deployment Guide](./QUICK_DEPLOYMENT_GUIDE.md)** - Start here!
- **[Backend Setup](./backend/README.md)** - Server configuration
- **[Frontend Setup](./frontend/README.md)** - UI configuration  
- **[Contract Deployment](./contract/README.md)** - Smart contract setup
- **[Troubleshooting](./docs/RPC_TIMEOUT_TROUBLESHOOTING.md)** - Common issues

## 🎮 How to Play

1. **Connect Wallet** - MetaMask or WalletConnect
2. **Create/Join Game** - Stake tokens to participate
3. **Play Roles** - ASUR (Mafia), DEV (Doctor), MANAV (Villager), RISHI (Detective)
4. **Win Rewards** - Automatic distribution via smart contracts

## 🔐 Security Features

- ECDSA signature verification
- Reentrancy protection
- Two-step withdrawals
- Role secrecy (off-chain)

## 📄 License

MIT
