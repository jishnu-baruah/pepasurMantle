# Quick Deployment Guide

## 🎯 Current Status

**Mantle Sepolia Testnet**: ✅ Ready to deploy
**Contract**: `0x87Fc95Fc7B2350880d1e4Ca10B7c78BC56225a8b`

## 🚀 Quick Setup

### 1. Environment Setup

**Backend** (`backend/.env`):
```env
NETWORK_NAME=mantle-sepolia
CHAIN_ID=5003
CONTRACT_ADDRESS=0x87Fc95Fc7B2350880d1e4Ca10B7c78BC56225a8b
RPC_URL=https://rpc.sepolia.mantle.xyz
SERVER_PRIVATE_KEY=your_server_private_key
ADMIN_PRIVATE_KEY=your_admin_private_key
MONGODB_URI=your_mongodb_uri
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_NETWORK=mantle-sepolia
NEXT_PUBLIC_CHAIN_ID=5003
NEXT_PUBLIC_CONTRACT_ADDRESS=0x87Fc95Fc7B2350880d1e4Ca10B7c78BC56225a8b
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.mantle.xyz
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_DEV_MODE=true
NEXT_PUBLIC_FAUCET_ENABLED=true
```

### 2. Start Services

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run build
npm run dev
```

### 3. Test Locally

- Open http://localhost:3000
- Connect wallet to Mantle Sepolia (Chain ID: 5003)
- Create test game with small stake (0.01 MNT)

## 🔑 Important Info

**Contract Address**: `0x87Fc95Fc7B2350880d1e4Ca10B7c78BC56225a8b`
**Network**: Mantle Sepolia Testnet (Chain ID: 5003)
**Explorer**: https://explorer.sepolia.mantle.xyz/address/0x87Fc95Fc7B2350880d1e4Ca10B7c78BC56225a8b

## ⚠️ Before Production

- Update `SERVER_PRIVATE_KEY` and `ADMIN_PRIVATE_KEY`
- Update `MONGODB_URI` for production database
- Update `ALLOWED_ORIGINS` and API URLs for production domains
- Ensure server wallet has at least 0.5 CELO for gas

## 🚨 Common Issues

- **"Contract not found"**: Check contract address and network
- **"Insufficient funds"**: Server wallet needs CELO for gas
- **"Signature verification failed"**: Server wallet must match contract's serverSigner
- **"CORS error"**: Update `ALLOWED_ORIGINS` in backend

## 📞 Need Help?

Check component READMEs:
- [Backend Setup](./backend/README.md)
- [Frontend Setup](./frontend/README.md)
- [Contract Info](./contract/README.md)
