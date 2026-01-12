# Quick Deployment Guide

## 🎯 Current Status

**Celo Mainnet**: ✅ Ready to deploy
**Contract**: `0x9CA9147887D22D41FaA98B50533F79b7502572D7`

## 🚀 Quick Setup

### 1. Environment Setup

**Backend** (`backend/.env`):
```env
NETWORK_NAME=celo
CHAIN_ID=42220
CONTRACT_ADDRESS=0x9CA9147887D22D41FaA98B50533F79b7502572D7
RPC_URL=https://forno.celo.org
SERVER_PRIVATE_KEY=your_server_private_key
ADMIN_PRIVATE_KEY=your_admin_private_key
MONGODB_URI=your_mongodb_uri
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_NETWORK=celo
NEXT_PUBLIC_CHAIN_ID=42220
NEXT_PUBLIC_CONTRACT_ADDRESS=0x9CA9147887D22D41FaA98B50533F79b7502572D7
NEXT_PUBLIC_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_DEV_MODE=false
NEXT_PUBLIC_FAUCET_ENABLED=false
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
- Connect wallet to Celo Mainnet (Chain ID: 42220)
- Create test game with small stake (0.01 CELO)

## 🔑 Important Info

**Contract Address**: `0x9CA9147887D22D41FaA98B50533F79b7502572D7`
**Network**: Celo Mainnet (Chain ID: 42220)
**Explorer**: https://explorer.celo.org/address/0x9CA9147887D22D41FaA98B50533F79b7502572D7

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
