# Server Signer Management Guide

## 🔑 What is the Server Signer?

The **server signer** is the wallet address authorized to sign game settlements. When a game ends, the backend signs a message with the winners and payouts, and the contract verifies this signature before distributing funds.

**Critical**: The backend's `SERVER_PRIVATE_KEY` must match the contract's `serverSigner` address, or settlements will fail!

---

## ✅ Your Contract HAS the Update Function!

Your `Pepasur.sol` contract includes:

```solidity
function updateServerSigner(address newSigner) external onlyAdmin {
    if (newSigner == address(0)) revert InvalidAddress();
    
    address oldSigner = serverSigner;
    serverSigner = newSigner;

    emit ServerSignerUpdated(oldSigner, newSigner);
}
```

This means you can change the server signer anytime! 🎉

---

## 📋 Quick Commands

### Check Current Server Signer

```bash
# Celo Mainnet
cd contract
npx hardhat run scripts/check-server-signer.js --network celo

# U2U Mainnet
npx hardhat run scripts/check-server-signer.js --network u2u
```

**What it checks**:
- ✅ Current serverSigner address in contract
- ✅ Whether your `SERVER_PRIVATE_KEY` matches
- ✅ Contract admin, fee recipient, house cut
- ✅ Provides fix instructions if mismatch

### Update Server Signer

```bash
# 1. Set the new signer address in .env
echo "SERVER_SIGNER_ADDRESS=0xYourNewSignerAddress" >> .env

# 2. Run update script
npx hardhat run scripts/update-server-signer.js --network celo
```

---

## 🎯 Common Scenarios

### Scenario 1: Using Same Wallet for Both Networks

**Setup**:
```
Wallet: 0xb70104c616eb573219d614ad8f2eb5df2080fa78
Private Key: 0x2d0b3c7d8cf92649839f607e42d3bc23fd28d7cb0739fa4cba74b3b4d2c50550
```

**Celo Contract**:
```bash
cd contract
cp .env.celo-mainnet .env
# Verify serverSigner matches
npx hardhat run scripts/check-server-signer.js --network celo
```

**U2U Contract** (when deployed):
```bash
# During initialization, set same signer
SERVER_SIGNER_ADDRESS=0xb70104c616eb573219d614ad8f2eb5df2080fa78
npx hardhat run scripts/initialize.js --network u2u
```

**Backend** (both networks):
```env
# Same key for both
SERVER_PRIVATE_KEY=0x2d0b3c7d8cf92649839f607e42d3bc23fd28d7cb0739fa4cba74b3b4d2c50550
```

**Pros**: ✅ Simple management
**Cons**: ⚠️ Single point of failure

---

### Scenario 2: Different Wallets per Network (Recommended)

**Setup**:
```
Celo Wallet: 0xAAAA...
Celo Key: 0xaaaa...

U2U Wallet: 0xBBBB...
U2U Key: 0xbbbb...
```

**Celo Contract**:
```bash
# Already set to 0xb70104c616eb573219d614ad8f2eb5df2080fa78
# To change:
cd contract
cp .env.celo-mainnet .env
echo "SERVER_SIGNER_ADDRESS=0xAAAA..." >> .env
npx hardhat run scripts/update-server-signer.js --network celo
```

**U2U Contract**:
```bash
# During initialization
SERVER_SIGNER_ADDRESS=0xBBBB...
npx hardhat run scripts/initialize.js --network u2u
```

**Backend Celo**:
```env
SERVER_PRIVATE_KEY=0xaaaa...
```

**Backend U2U**:
```env
SERVER_PRIVATE_KEY=0xbbbb...
```

**Pros**: ✅ Better security isolation
**Cons**: ⚠️ More complex management

---

## 🔍 Verification Steps

### Step 1: Check Contract's Server Signer

**Using Script**:
```bash
npx hardhat run scripts/check-server-signer.js --network celo
```

**Using Cast** (if you have Foundry):
```bash
cast call 0x9CA9147887D22D41FaA98B50533F79b7502572D7 \
  "serverSigner()" \
  --rpc-url https://forno.celo.org
```

**Expected Output**: `0xb70104c616eb573219d614ad8f2eb5df2080fa78`

### Step 2: Derive Address from Private Key

**Using Script**:
```bash
npx hardhat run scripts/check-server-signer.js --network celo
# It will automatically check if SERVER_PRIVATE_KEY matches
```

**Using Cast**:
```bash
cast wallet address --private-key 0x2d0b3c7d8cf92649839f607e42d3bc23fd28d7cb0739fa4cba74b3b4d2c50550
```

**Expected Output**: `0xb70104c616eb573219d614ad8f2eb5df2080fa78`

### Step 3: Verify They Match

If they match: ✅ You're good to go!

If they don't match: ⚠️ You need to either:
1. Update `SERVER_PRIVATE_KEY` in backend `.env`
2. OR update contract's `serverSigner`

---

## 🚨 What Happens if They Don't Match?

**Symptom**: Game settlements fail with "Invalid signature" error

**Why**: 
1. Backend signs settlement with `SERVER_PRIVATE_KEY`
2. Contract verifies signature against `serverSigner`
3. If addresses don't match, verification fails
4. Settlement transaction reverts

**Impact**:
- ❌ Games can't be settled
- ❌ Winners can't get payouts
- ❌ Players' funds stuck in contract
- ❌ Complete game failure

**Fix**:
```bash
# Option 1: Update contract (if you're admin)
npx hardhat run scripts/update-server-signer.js --network celo

# Option 2: Update backend .env
# Change SERVER_PRIVATE_KEY to match contract's serverSigner
```

---

## 📝 Step-by-Step Update Process

### Updating Celo Contract's Server Signer

```bash
# 1. Navigate to contract directory
cd contract

# 2. Copy Celo config
cp .env.celo-mainnet .env

# 3. Set new signer address
# Edit .env and add:
SERVER_SIGNER_ADDRESS=0xYourNewSignerAddress

# 4. Check current signer
npx hardhat run scripts/check-server-signer.js --network celo

# 5. Update signer (requires admin key)
npx hardhat run scripts/update-server-signer.js --network celo

# 6. Verify update
npx hardhat run scripts/check-server-signer.js --network celo
```

### Updating Backend to Match

```bash
# 1. Navigate to backend
cd backend

# 2. Update .env
# Change SERVER_PRIVATE_KEY to the private key for the new signer

# 3. Restart backend
npm restart

# 4. Test settlement
# Create a test game and verify settlement works
```

---

## 🔐 Security Best Practices

### DO ✅
- Store private keys in secure key management system
- Use different wallets for different networks (isolation)
- Keep server wallet funded but not over-funded
- Regularly verify signer matches
- Monitor settlement success rate
- Have backup admin key stored securely

### DON'T ❌
- Commit private keys to git
- Share private keys
- Use same key for admin and server signer
- Store keys in plain text
- Use production keys in development
- Forget to update backend after changing contract

---

## 🧪 Testing After Update

### Test Settlement Flow

```bash
# 1. Create a test game
curl -X POST http://localhost:3001/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"creatorAddress":"0x...","stakeAmount":"10000000000000000","minPlayers":2}'

# 2. Join game (from frontend or contract)

# 3. Settle game (backend should sign and submit)

# 4. Check if settlement succeeded
# - Check transaction on block explorer
# - Verify winners have pending withdrawals
# - Test withdrawal
```

---

## 📊 Current Status

### Celo Mainnet
- **Contract**: `0x9CA9147887D22D41FaA98B50533F79b7502572D7`
- **Current Server Signer**: `0xb70104c616eb573219d614ad8f2eb5df2080fa78`
- **Admin**: (check with script)
- **Status**: ✅ Deployed and initialized

### U2U Mainnet
- **Contract**: Not deployed yet
- **Server Signer**: Will be set during initialization
- **Admin**: Will be deployer address
- **Status**: ⏳ Pending deployment

---

## 🆘 Troubleshooting

### "NotAuthorized" Error
**Problem**: You're not the admin
**Solution**: Use the admin wallet that deployed the contract

### "InvalidAddress" Error
**Problem**: New signer address is 0x0 or invalid
**Solution**: Verify the address format (0x + 40 hex chars)

### "AlreadyInitialized" Error
**Problem**: Trying to initialize twice
**Solution**: Use `updateServerSigner` instead of `initialize`

### Transaction Fails with No Error
**Problem**: Insufficient gas or network issue
**Solution**: Check wallet balance and network connection

---

## 📞 Quick Reference

**Check Signer**:
```bash
npx hardhat run scripts/check-server-signer.js --network celo
```

**Update Signer**:
```bash
# Set SERVER_SIGNER_ADDRESS in .env first
npx hardhat run scripts/update-server-signer.js --network celo
```

**Derive Address from Key**:
```bash
cast wallet address --private-key <YOUR_KEY>
```

**View Contract on Explorer**:
- Celo: https://explorer.celo.org/address/0x9CA9147887D22D41FaA98B50533F79b7502572D7
- U2U: https://u2uscan.xyz/address/<CONTRACT_ADDRESS>

---

**Bottom Line**: You can change the server signer anytime using the `updateServerSigner` function. Just make sure to update your backend's `SERVER_PRIVATE_KEY` to match! 🔑
