# Pepasur Contract Deployment Guide

This guide provides step-by-step instructions for deploying the Pepasur smart contract to testnets and mainnets.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Network Information](#network-information)
3. [Pre-Deployment Setup](#pre-deployment-setup)
4. [Testnet Deployment](#testnet-deployment)
5. [Mainnet Deployment](#mainnet-deployment)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js v18 or higher
- npm or yarn package manager
- Git

### Required Accounts
- EVM wallet with private key (for deployment)
- Native tokens for gas fees (U2U or CELO)

### Installation

```bash
cd contract
npm install
```

---

## Network Information

### U2U Nebulas Testnet
- **Chain ID**: 2484
- **RPC URL**: https://rpc-nebulas-testnet.u2u.xyz
- **Block Explorer**: https://testnet.u2uscan.xyz
- **Native Token**: U2U
- **Faucet**: Contact U2U team or check their Discord

### U2U Mainnet
- **Chain ID**: 39
- **RPC URL**: https://rpc-mainnet.uniultra.xyz
- **Block Explorer**: https://u2uscan.xyz
- **Native Token**: U2U

### Celo Alfajores Testnet
- **Chain ID**: 44787
- **RPC URL**: https://alfajores-forno.celo-testnet.org
- **Block Explorer**: https://alfajores.celoscan.io
- **Native Token**: CELO (testnet)
- **Faucet**: https://faucet.celo.org/alfajores

### Celo Mainnet
- **Chain ID**: 42220
- **RPC URL**: https://forno.celo.org
- **Block Explorer**: https://explorer.celo.org
- **Native Token**: CELO

---

## Pre-Deployment Setup

### 1. Generate Wallet Keys

If you don't have a deployment wallet, generate one:

```bash
node -e "const wallet = require('ethers').Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

**⚠️ IMPORTANT**: Store your private key securely. Never commit it to version control.

### 2. Fund Your Wallet

#### For Testnets:
- **U2U Nebulas Testnet**: Contact U2U team or check their Discord for testnet tokens
- **Celo Alfajores**: Visit https://faucet.celo.org/alfajores

#### For Mainnets:
- Purchase U2U or CELO tokens from exchanges
- Transfer to your deployment wallet

### 3. Configure Environment Variables

Choose the appropriate environment template based on your target network:

#### For U2U Nebulas Testnet:
```bash
cp .env.u2u-testnet .env
```

#### For U2U Mainnet:
```bash
cp .env.u2u-mainnet .env
```

#### For Celo Alfajores Testnet:
```bash
cp .env.celo-testnet .env
```

#### For Celo Mainnet:
```bash
cp .env.celo-mainnet .env
```

### 4. Edit .env File

Open `.env` and fill in your values:

```env
# Your deployer wallet private key
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Server signer address (the address that will sign game settlements)
# This should be the backend server's wallet address
SERVER_SIGNER_ADDRESS=0xYOUR_SERVER_ADDRESS_HERE

# Fee recipient address (where house cut goes)
FEE_RECIPIENT_ADDRESS=0xYOUR_FEE_RECIPIENT_ADDRESS_HERE
```

**Key Addresses Explained:**
- **DEPLOYER_PRIVATE_KEY**: Your wallet's private key (used only for deployment)
- **SERVER_SIGNER_ADDRESS**: Backend server's wallet address (for signing settlements)
- **FEE_RECIPIENT_ADDRESS**: Address to receive house fees (can be same as deployer)

---

## Testnet Deployment

### Deploy to U2U Nebulas Testnet

1. **Compile Contracts**:
```bash
npx hardhat compile
```

2. **Run Tests** (optional but recommended):
```bash
npx hardhat test
```

3. **Deploy Contract**:
```bash
npx hardhat run scripts/deploy.js --network u2uTestnet
```

Expected output:
```
🚀 Deploying Pepasur contract to u2uTestnet...
📝 Deploying with account: 0x...
💰 Account balance: 10.5 U2U
📦 Deploying Pepasur contract...
✅ Pepasur deployed to: 0xYOUR_CONTRACT_ADDRESS
⏳ Waiting for block confirmations...
✅ Block confirmations received
```

4. **Save Contract Address**:

Copy the deployed contract address and update your `.env`:
```env
CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

5. **Initialize Contract**:
```bash
npx hardhat run scripts/initialize.js --network u2uTestnet
```

Expected output:
```
🔧 Initializing Pepasur contract on u2uTestnet...
📝 Contract address: 0x...
✅ Contract Initialized:
   Admin: 0x...
   Server Signer: 0x...
   Fee Recipient: 0x...
   House Cut: 200 bps (2%)
```

6. **Verify on Block Explorer**:
```bash
npx hardhat verify --network u2uTestnet 0xYOUR_CONTRACT_ADDRESS
```

### Deploy to Celo Alfajores Testnet

Follow the same steps as above, but use `celoAlfajores` as the network:

```bash
# 1. Configure environment
cp .env.celo-testnet .env
# Edit .env with your values

# 2. Compile
npx hardhat compile

# 3. Deploy
npx hardhat run scripts/deploy.js --network celoAlfajores

# 4. Update CONTRACT_ADDRESS in .env

# 5. Initialize
npx hardhat run scripts/initialize.js --network celoAlfajores

# 6. Verify
npx hardhat verify --network celoAlfajores 0xYOUR_CONTRACT_ADDRESS
```

---

## Mainnet Deployment

**⚠️ WARNING**: Mainnet deployment uses real funds. Double-check everything before proceeding.

### Pre-Mainnet Checklist

- [ ] Contract tested thoroughly on testnet
- [ ] All game flows verified (create, join, settle, withdraw, cancel)
- [ ] Security audit completed (recommended for production)
- [ ] Sufficient native tokens for deployment gas fees
- [ ] Backup of all private keys and addresses
- [ ] Server infrastructure ready for production

### Deploy to U2U Mainnet

1. **Configure Environment**:
```bash
cp .env.u2u-mainnet .env
# Edit .env with your mainnet values
```

2. **Verify Configuration**:
```bash
# Check your deployer balance
npx hardhat run scripts/check-balance.js --network u2u
```

3. **Deploy Contract**:
```bash
npx hardhat run scripts/deploy.js --network u2u
```

4. **Update .env with Contract Address**

5. **Initialize Contract**:
```bash
npx hardhat run scripts/initialize.js --network u2u
```

6. **Verify Contract**:
```bash
npx hardhat verify --network u2u 0xYOUR_CONTRACT_ADDRESS
```

### Deploy to Celo Mainnet

Follow the same steps as U2U mainnet, but use `celo` as the network:

```bash
# 1. Configure
cp .env.celo-mainnet .env

# 2. Deploy
npx hardhat run scripts/deploy.js --network celo

# 3. Initialize
npx hardhat run scripts/initialize.js --network celo

# 4. Verify
npx hardhat verify --network celo 0xYOUR_CONTRACT_ADDRESS
```

---

## Post-Deployment Configuration

### 1. Update Backend Configuration

Update `backend/.env` with the deployed contract address:

```env
# For U2U
NETWORK_NAME=u2u
CHAIN_ID=39
RPC_URL=https://rpc-mainnet.uniultra.xyz
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
SERVER_PRIVATE_KEY=0xYOUR_SERVER_PRIVATE_KEY
```

### 2. Update Frontend Configuration

Update `frontend/.env.local` with the deployed contract address:

```env
# For U2U
NEXT_PUBLIC_NETWORK=u2u
NEXT_PUBLIC_CHAIN_ID=39
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_NETWORK_NAME=U2U Network
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=U2U
NEXT_PUBLIC_EXPLORER_URL=https://u2uscan.xyz
```

### 3. Test Contract Functions

Use the interact script to test basic functions:

```bash
npx hardhat run scripts/interact.js --network u2uTestnet
```

This will:
- Display contract configuration
- Show next game ID
- Verify initialization status

---

## Verification

### Verify Deployment Success

1. **Check Block Explorer**:
   - U2U Testnet: https://testnet.u2uscan.xyz/address/YOUR_CONTRACT_ADDRESS
   - U2U Mainnet: https://u2uscan.xyz/address/YOUR_CONTRACT_ADDRESS
   - Celo Alfajores: https://alfajores.celoscan.io/address/YOUR_CONTRACT_ADDRESS
   - Celo Mainnet: https://explorer.celo.org/address/YOUR_CONTRACT_ADDRESS

2. **Verify Contract State**:
```bash
npx hardhat run scripts/interact.js --network <network>
```

Expected output:
```
📋 Contract Configuration:
   Admin: 0x...
   Server Signer: 0x...
   Fee Recipient: 0x...
   House Cut: 200 bps (2%)
   Next Game ID: 1
```

3. **Test Game Creation** (optional):

Create a test game to verify everything works:

```bash
# This requires a funded wallet
npx hardhat run scripts/test-game-creation.js --network u2uTestnet
```

---

## Troubleshooting

### Issue: "Insufficient funds for gas"

**Solution**: Ensure your deployer wallet has enough native tokens:
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network <network>
```

Get more tokens from faucet (testnet) or transfer from exchange (mainnet).

### Issue: "Contract already initialized"

**Solution**: The contract can only be initialized once. If you need to change parameters:
1. Use admin functions (`updateServerSigner`, `updateFeeRecipient`, `updateHouseCut`)
2. Or deploy a new contract

### Issue: "Nonce too high" or "Nonce too low"

**Solution**: Reset your account nonce:
```bash
# Clear Hardhat cache
rm -rf cache artifacts
npx hardhat clean
```

### Issue: "Network connection timeout"

**Solution**: 
1. Check RPC URL is correct
2. Try alternative RPC endpoints
3. Check network status on their status page

### Issue: "Verification failed"

**Solution**:
1. Wait a few minutes after deployment
2. Ensure contract is deployed and confirmed
3. Check if block explorer supports verification for your network
4. Try manual verification on block explorer website

### Issue: "Transaction underpriced"

**Solution**: Increase gas price in hardhat.config.js:
```javascript
gasPrice: 20000000000, // 20 gwei
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Contracts compiled successfully
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Deployer wallet funded
- [ ] Server signer address ready
- [ ] Fee recipient address ready

### Deployment
- [ ] Contract deployed successfully
- [ ] Contract address saved
- [ ] Contract initialized
- [ ] Initialization verified
- [ ] Contract verified on block explorer

### Post-Deployment
- [ ] Backend .env updated
- [ ] Frontend .env updated
- [ ] Contract functions tested
- [ ] Game creation tested
- [ ] Documentation updated with contract addresses

---

## Network-Specific Notes

### U2U Network
- Gas prices are generally low
- Block time: ~3 seconds
- Verification may require manual submission on block explorer

### Celo Network
- Supports stable tokens (cUSD, cEUR) but we use native CELO
- Gas prices paid in CELO
- Block time: ~5 seconds
- Good block explorer support for verification

---

## Security Best Practices

1. **Private Key Management**:
   - Never commit private keys to version control
   - Use environment variables
   - Consider hardware wallets for mainnet deployments
   - Use separate wallets for deployment and server operations

2. **Multi-Signature Wallets** (recommended for mainnet):
   - Use Gnosis Safe or similar for admin functions
   - Require multiple signatures for critical operations

3. **Access Control**:
   - Keep admin private key secure
   - Regularly rotate server signer if compromised
   - Monitor admin function calls

4. **Monitoring**:
   - Set up alerts for contract events
   - Monitor gas usage and costs
   - Track all admin function calls

---

## Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [U2U Network Documentation](https://docs.uniultra.xyz/)
- [Celo Documentation](https://docs.celo.org/)
- [ethers.js Documentation](https://docs.ethers.org/)

---

## Support

For deployment issues:
1. Check this guide's troubleshooting section
2. Review Hardhat error messages
3. Check block explorer for transaction details
4. Verify network status and RPC availability

---

**Happy Deploying! 🚀**
