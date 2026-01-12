# Celo Sepolia RPC Timeout Issues - Troubleshooting Guide

## 🔴 Current Problem

The official Celo Sepolia RPC endpoint (`https://forno.celo-sepolia.celo-testnet.org`) is experiencing timeout issues, preventing the backend from initializing.

**Error:**
```
❌ Failed to initialize EVM Client Manager: Error: request timeout (code=TIMEOUT, version=6.15.0)
```

---

## ✅ Solutions (Try in Order)

### **Solution 1: Use HTTPS for Frontend, HTTP for Backend**

**Status:** Currently applied

**Important:** HTTP redirects to HTTPS on Celo endpoints, causing CORS errors in browsers.

- **Frontend** (browser-based): Must use HTTPS to avoid CORS preflight issues
  ```
  NEXT_PUBLIC_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
  ```

- **Backend** (server-side): Can use HTTP (no CORS restrictions)
  ```
  RPC_URL=http://forno.celo-sepolia.celo-testnet.org
  ```

**Action:** Configuration already applied. Restart both services.

---

### **Solution 2: Use Infura (Recommended)**

**Free tier:** 100,000 requests/day

1. **Sign up for Infura:**
   - Go to https://www.infura.io/
   - Create free account
   - Create new API key for "Celo"

2. **Update backend `.env`:**
   ```bash
   RPC_URL=https://celo-sepolia.infura.io/v3/YOUR_INFURA_KEY
   ```

3. **Update frontend `.env.local`:**
   ```bash
   NEXT_PUBLIC_RPC_URL=https://celo-sepolia.infura.io/v3/YOUR_INFURA_KEY
   ```

---

### **Solution 3: Use Alchemy**

**Free tier:** 300M compute units/month

1. **Sign up for Alchemy:**
   - Go to https://www.alchemy.com/
   - Create free account
   - Create app for "Celo Sepolia"

2. **Update RPC URLs:**
   ```bash
   RPC_URL=https://celo-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   ```

---

### **Solution 4: Temporary Alfajores Deployment**

**⚠️ Only if Sepolia RPC cannot be fixed**

Alfajores sunsets **September 30, 2025**, so this is only a short-term solution.

1. **Redeploy contract to Alfajores:**
   ```bash
   cd contract
   cp .env.celo-alfajores .env
   # Edit .env with your private key
   npx hardhat run scripts/deploy.js --network celoAlfajores
   npx hardhat run scripts/initialize.js --network celoAlfajores
   ```

2. **Update backend `.env`:**
   ```bash
   NETWORK_NAME=celo-alfajores
   CHAIN_ID=44787
   RPC_URL=https://rpc.ankr.com/celo_alfajores
   CONTRACT_ADDRESS=<new_alfajores_contract_address>
   ```

3. **Update frontend `.env.local`:**
   ```bash
   NEXT_PUBLIC_NETWORK=celoAlfajores
   NEXT_PUBLIC_CHAIN_ID=44787
   NEXT_PUBLIC_RPC_URL=https://rpc.ankr.com/celo_alfajores
   NEXT_PUBLIC_CONTRACT_ADDRESS=<new_alfajores_contract_address>
   ```

---

## 🔍 Verify Current Contract Deployment

Check which network your contract `0x2C26867a80f682c8600f46f868b86545E5dA2E1C` is deployed on:

**Celo Sepolia:**
```
https://celo-sepolia.blockscout.com/address/0x2C26867a80f682c8600f46f868b86545E5dA2E1C
```

**Celo Alfajores:**
```
https://alfajores.celoscan.io/address/0x2C26867a80f682c8600f46f868b86545E5dA2E1C
```

**Celo Mainnet:**
```
https://celoscan.io/address/0x2C26867a80f682c8600f46f868b86545E5dA2E1C
```

---

## 🎯 Recommended Path Forward

1. **First:** Try HTTP endpoint (already applied) - restart backend and test
2. **If still failing:** Get free Infura API key (5 minutes)
3. **Update RPC URLs** in both `.env` files
4. **Restart servers**

---

## 🛠️ Applied Fixes

### **1. Extended Timeout (Already Done)**

File: `backend/services/evm/EVMClientManager.js`

```javascript
const fetchRequest = new ethers.FetchRequest(rpcUrl);
fetchRequest.timeout = 60000; // 60 seconds (was 12 seconds)
fetchRequest.retryCount = 3; // Retry up to 3 times
```

### **2. Network Configuration (Already Done)**

Both backend and frontend configured for **Celo Sepolia** (Chain ID: 11142220)

---

## 📊 RPC Endpoint Comparison

| Provider | URL | Reliability | Free Tier |
|----------|-----|-------------|-----------|
| **Forno (Official)** | `https://forno.celo-sepolia.celo-testnet.org` | ⚠️ Slow | Unlimited |
| **Forno HTTP** | `http://forno.celo-sepolia.celo-testnet.org` | 🟡 Testing | Unlimited |
| **Infura** | `https://celo-sepolia.infura.io/v3/KEY` | ✅ Fast | 100k req/day |
| **Alchemy** | `https://celo-sepolia.g.alchemy.com/v2/KEY` | ✅ Fast | 300M CU/month |
| **Ankr (Alfajores)** | `https://rpc.ankr.com/celo_alfajores` | ✅ Fast | Limited |

---

## 🚀 Quick Test

After making changes, test the backend connection:

```bash
cd backend
npm start
```

**Success indicators:**
```
✅ HTTP Provider connected: http://forno.celo-sepolia.celo-testnet.org (timeout: 60s, retries: 3)
🌐 Connected to Chain ID: 11142220
✅ EVM Client Manager initialized successfully
```

**Failure indicators:**
```
❌ Failed to initialize EVM Client Manager: Error: request timeout
```

---

## 📞 Additional Resources

- **Celo Sepolia Faucet:** https://faucet.celo.org/celo-sepolia
- **Google Cloud Faucet:** https://cloud.google.com/application/web3/faucet/celo/sepolia
- **Celo Discord:** https://chat.celo.org (#celo-L2-support)
- **Migration Guide:** See `CELO_TESTNET_MIGRATION.md`

---

**Last Updated:** Using HTTP endpoint for Celo Sepolia as temporary fix
**Recommended:** Get Infura/Alchemy API key for production-grade reliability
