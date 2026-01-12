# Celo Sepolia Testnet Deployment Guide

## Overview

Celo Sepolia is the **new developer testnet** for Celo, replacing Alfajores (which sunsets September 30, 2025). This guide walks you through deploying Pepasur to Celo Sepolia.

### Key Information
- **Chain ID**: 11142220
- **RPC URL**: https://forno.celo-sepolia.celo-testnet.org
- **Block Explorer**: https://celo-sepolia.blockscout.com
- **Faucets**:
  - https://faucet.celo.org/celo-sepolia
  - https://cloud.google.com/application/web3/faucet/celo/sepolia
- **Bridge**: https://testnets.superbridge.app/?fromChainId=11155111&toChainId=11142220

---

## Prerequisites

### 1. Get Testnet CELO Tokens

You need testnet CELO for deployment (~1 CELO should be sufficient):

**Option 1: Celo Faucet**
```
Visit: https://faucet.celo.org/celo-sepolia
Enter your wallet address
Request tokens
```

**Option 2: Google Cloud Faucet**
```
Visit: https://cloud.google.com/application/web3/faucet/celo/sepolia
Connect wallet or enter address
Request tokens
```

### 2. Prepare Wallet Addresses

You'll need:
- **Deployer Wallet**: For deploying the smart contract
- **Server Wallet**: For backend operations (can be same as deployer)
- **Fee Recipient**: Where platform fees go (can be same as deployer)

### 3. Get WalletConnect Project ID

1. Visit https://cloud.walletconnect.com/
2. Create a new project
3. Copy the Project ID

---

## Step 1: Deploy Smart Contract

```bash
# Navigate to contract directory
cd contract

# Copy Celo Sepolia configuration
cp .env.celo-sepolia .env

# Edit .env with your values
# Required fields:
# - DEPLOYER_PRIVATE_KEY=0x...
# - SERVER_SIGNER_ADDRESS=0x...
# - FEE_RECIPIENT_ADDRESS=0x...
```

**Edit the `.env` file** with your actual values:
```bash
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
SERVER_SIGNER_ADDRESS=0xYOUR_SERVER_ADDRESS_HERE
FEE_RECIPIENT_ADDRESS=0xYOUR_FEE_RECIPIENT_HERE
```

**Deploy the contract:**
```bash
# Check your balance first
npx hardhat run scripts/check-balance.js --network celoSepolia

# Compile contracts
npx hardhat compile

# Deploy to Celo Sepolia
npx hardhat run scripts/deploy.js --network celoSepolia
```

**Save the contract address!** You'll see output like:
```
✅ Pepasur deployed to: 0x1234567890abcdef...
```

**Update .env with contract address:**
```bash
# Add this line to your .env file
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

**Initialize the contract:**
```bash
npx hardhat run scripts/initialize.js --network celoSepolia
```

**Test game creation:**
```bash
npx hardhat run scripts/test-game-creation.js --network celoSepolia
```

**Expected Output:**
```
✅ Contract Initialized
✅ Game creation test successful!
```

**Verify on Block Explorer:**
Visit: https://celo-sepolia.blockscout.com/address/YOUR_CONTRACT_ADDRESS

---

## Step 2: Deploy Backend

```bash
# Navigate to backend directory
cd ../backend

# Copy Celo Sepolia configuration
cp .env.celo-sepolia .env

# Edit .env with your values
# Required fields:
# - SERVER_PRIVATE_KEY=0x...
# - CONTRACT_ADDRESS=0x... (from Step 1)
```

**Edit the `.env` file:**
```bash
SERVER_PRIVATE_KEY=0xYOUR_SERVER_PRIVATE_KEY
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
```

**Copy contract ABI:**
```bash
# Copy the ABI from contract artifacts
cp ../contract/artifacts/contracts/Pepasur.sol/Pepasur.json ./contracts/PepasurABI.json
```

**Install dependencies and start:**
```bash
# Install dependencies
npm install

# Start backend in development mode
npm run dev
```

**Test the backend** (in another terminal):
```bash
# Health check
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","network":"celo-sepolia","chainId":11142220}
```

---

## Step 3: Deploy Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Copy Celo Sepolia configuration
cp .env.celo-sepolia .env.local

# Edit .env.local with your values
# Required fields:
# - NEXT_PUBLIC_CONTRACT_ADDRESS=0x... (from Step 1)
# - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

**Edit the `.env.local` file:**
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Install dependencies and start:**
```bash
# Install dependencies
npm install

# Build production bundle
npm run build

# Start frontend
npm start
```

**Access the frontend:**
Open http://localhost:3000 in your browser

---

## Step 4: Test the Deployment

### 4.1 Add Celo Sepolia to MetaMask

**Manual Configuration:**
- Network Name: Celo Sepolia Testnet
- RPC URL: https://forno.celo-sepolia.celo-testnet.org
- Chain ID: 11142220
- Currency Symbol: CELO
- Block Explorer: https://celo-sepolia.blockscout.com

### 4.2 Connect Wallet

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. Select MetaMask
4. Approve the connection
5. Verify you're on Celo Sepolia (Chain ID: 11142220)

### 4.3 Create a Test Game

1. Click "Create Lobby"
2. Set game parameters:
   - Stake amount (e.g., 0.01 CELO)
   - Min/Max players
   - Phase durations
3. Click "Create Game"
4. Approve the transaction in MetaMask
5. Wait for confirmation
6. Note the room code

### 4.4 Join the Game

1. Use a second wallet (or ask a friend)
2. Click "Join Game"
3. Enter the room code
4. Approve the stake transaction
5. Verify both players appear in the lobby

### 4.5 Verify on Block Explorer

Visit: https://celo-sepolia.blockscout.com/address/YOUR_CONTRACT_ADDRESS

You should see:
- Contract deployment transaction
- Game creation transaction
- Player join transaction

---

## Troubleshooting

### Contract Deployment Fails

**Issue**: "Insufficient funds"
- **Solution**: Get more testnet CELO from the faucets

**Issue**: "Nonce too high"
- **Solution**: Reset your MetaMask account (Settings → Advanced → Reset Account)

### Backend Won't Start

**Issue**: "Cannot find module './contracts/PepasurABI.json'"
- **Solution**: Copy the ABI file:
  ```bash
  cp ../contract/artifacts/contracts/Pepasur.sol/Pepasur.json ./contracts/PepasurABI.json
  ```

**Issue**: "Invalid contract address"
- **Solution**: Verify CONTRACT_ADDRESS in `.env` matches deployed contract

### Frontend Connection Issues

**Issue**: "Wrong network"
- **Solution**: Switch MetaMask to Celo Sepolia (Chain ID: 11142220)

**Issue**: "Contract not found"
- **Solution**: Verify NEXT_PUBLIC_CONTRACT_ADDRESS in `.env.local`

### Transaction Fails

**Issue**: "Execution reverted"
- **Solution**: Check contract is initialized:
  ```bash
  cd contract
  npx hardhat run scripts/initialize.js --network celoSepolia
  ```

---

## Deployment Checklist

### Contract Deployment
- [ ] Testnet CELO tokens acquired
- [ ] `.env` configured with private keys
- [ ] Contract compiled successfully
- [ ] Contract deployed to Celo Sepolia
- [ ] Contract address saved
- [ ] Contract initialized
- [ ] Test game creation successful
- [ ] Contract verified on Blockscout

### Backend Deployment
- [ ] `.env` configured with server key
- [ ] Contract address updated
- [ ] Contract ABI copied
- [ ] Dependencies installed
- [ ] Backend started successfully
- [ ] Health check returns correct chain ID (11142220)

### Frontend Deployment
- [ ] `.env.local` configured
- [ ] Contract address updated
- [ ] WalletConnect Project ID added
- [ ] Dependencies installed
- [ ] Build successful
- [ ] Frontend accessible at localhost:3000

### Integration Testing
- [ ] Celo Sepolia added to MetaMask
- [ ] Wallet connects successfully
- [ ] Game creation works
- [ ] Player can join game
- [ ] Transactions visible on Blockscout

---

## Production Deployment

For production deployment to a server:

### Backend (using PM2)
```bash
# On your server
cd /var/www/pepasur-backend
git pull
npm install
cp .env.celo-sepolia .env
# Edit .env with production values
pm2 start server.js --name pepasur-celo-sepolia
pm2 save
```

### Frontend (using Vercel)
```bash
# Set environment variables in Vercel dashboard
# Then deploy:
vercel --prod
```

Or for custom server:
```bash
# Build locally
npm run build

# Copy to server
scp -r .next package.json user@your-server:/var/www/pepasur-frontend/

# On server
cd /var/www/pepasur-frontend
npm install --production
pm2 start npm --name pepasur-frontend -- start
```

---

## Important Resources

- **Celo Sepolia Docs**: https://docs.celo.org/
- **Block Explorer**: https://celo-sepolia.blockscout.com
- **Faucet**: https://faucet.celo.org/celo-sepolia
- **Google Cloud Faucet**: https://cloud.google.com/application/web3/faucet/celo/sepolia
- **Bridge**: https://testnets.superbridge.app/
- **Discord Support**: https://chat.celo.org (#celo-L2-support)

---

## Next Steps

After successful Celo Sepolia deployment:

1. **Test thoroughly**: Run through complete game flows
2. **Monitor**: Watch contract events and backend logs
3. **Optimize**: Adjust gas settings if needed
4. **Document**: Note any issues or improvements
5. **Prepare for mainnet**: Once tested, deploy to Celo mainnet

---

**Happy Deploying! 🚀**
