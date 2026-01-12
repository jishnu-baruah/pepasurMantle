# Pepasur Migration Guide: Aptos to EVM

This document provides a comprehensive guide for the migration of Pepasur from Aptos blockchain to EVM-compatible chains (U2U Network and Celo). It includes function mappings, token conversions, deployment instructions, and troubleshooting guidance.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Smart Contract Migration](#smart-contract-migration)
4. [Backend Service Migration](#backend-service-migration)
5. [Frontend Wallet Integration](#frontend-wallet-integration)
6. [Token Amount Conversion](#token-amount-conversion)
7. [Environment Configuration](#environment-configuration)
8. [Deployment Checklist](#deployment-checklist)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Migration Summary

**From**: Aptos blockchain with Move smart contracts  
**To**: EVM-compatible blockchains (U2U Network and Celo) with Solidity smart contracts

### Key Changes

- **Smart Contracts**: Move → Solidity
- **Backend SDK**: @aptos-labs/ts-sdk → ethers.js
- **Frontend Wallet**: Aptos Wallet Adapter → wagmi + viem
- **Signature Algorithm**: ED25519 → ECDSA
- **Token Decimals**: 8 decimals (Octas) → 18 decimals (Wei)
- **Network Configuration**: Single network → Multi-network support via environment variables

### Target Networks

| Network | Chain ID | Native Token | RPC URL |
|---------|----------|--------------|---------|
| U2U Mainnet | 39 | U2U | https://rpc-mainnet.uniultra.xyz |
| Celo Mainnet | 42220 | CELO | https://forno.celo.org |
| Celo Sepolia (Testnet) | 44787 | CELO | https://alfajores-forno.celo-testnet.org |

---

## Architecture Changes

### Before (Aptos)

```
Frontend (Next.js + Aptos Wallet Adapter)
    ↓
Backend (Node.js + @aptos-labs/ts-sdk)
    ↓
Aptos Blockchain (Move Smart Contracts)
```

### After (EVM)

```
Frontend (Next.js + wagmi + viem)
    ↓
Backend (Node.js + ethers.js)
    ↓
EVM Blockchain (Solidity Smart Contracts)
    ├── U2U Network
    └── Celo Network
```

---

## Smart Contract Migration

### Function Mapping: Move → Solidity

| Move Function | Solidity Function | Changes |
|---------------|-------------------|---------|
| `initialize()` | `initialize()` | ED25519 public key → ECDSA address |
| `create_game()` | `createGame()` | Returns game ID via event |
| `join_game()` | `joinGame()` | Payable function, uses `msg.value` |
| `settle_game()` | `settleGame()` | ED25519 signature → ECDSA signature |
| `withdraw()` | `withdraw()` | Similar logic, uses `transfer()` |
| `cancel_game()` | `cancelGame()` | Similar logic |
| `get_game()` | `games()` | Public mapping, direct access |
| `get_pending_withdrawal()` | `pendingWithdrawals()` | Public mapping |
| `update_server_signer()` | `updateServerSigner()` | Public key → address |
| `update_fee_recipient()` | `updateFeeRecipient()` | Same |
| `update_house_cut()` | `updateHouseCut()` | Same |

### Data Structure Changes

#### Game Struct

**Move (Before)**:
```move
struct Game has store {
    id: u64,
    creator: address,
    stake_amount: u64,
    min_players: u8,
    players: vector<address>,
    deposits: vector<u64>,
    status: u8,
    total_pool: u64,
    created_at: u64,
}
```

**Solidity (After)**:
```solidity
struct Game {
    uint64 id;
    address creator;
    uint256 stakeAmount;
    uint8 minPlayers;
    address[] players;
    uint256[] deposits;
    GameStatus status;
    uint256 totalPool;
    uint256 createdAt;
}

enum GameStatus {
    Lobby,
    InProgress,
    Settled,
    Cancelled
}
```

### Signature Verification Changes

**Move (ED25519)**:
```move
let message = construct_settlement_message(game_id, winners, payouts);
assert!(
    ed25519::signature_verify_strict(&signature, &server_signer, message),
    E_INVALID_SIGNATURE
);
```

**Solidity (ECDSA)**:
```solidity
bytes32 messageHash = constructSettlementMessage(gameId, winners, payouts);
bytes32 ethSignedMessageHash = keccak256(
    abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
);
address signer = ecrecover(ethSignedMessageHash, v, r, s);
require(signer == serverSigner, "Invalid signature");
```

### Payment Handling Changes

**Move (Coin Module)**:
```move
// Deposit
let stake_coin = coin::withdraw<AptosCoin>(player, stake_amount);
coin::merge(&mut game_store.vault, stake_coin);

// Withdrawal
let withdrawal_coin = coin::extract(&mut game_store.vault, amount);
coin::deposit(player, withdrawal_coin);
```

**Solidity (Native ETH/Token)**:
```solidity
// Deposit (payable function)
function joinGame(uint64 gameId) external payable {
    require(msg.value == game.stakeAmount, "Incorrect stake amount");
    // Funds automatically added to contract balance
}

// Withdrawal
function withdraw() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}
```

---

## Backend Service Migration

### Service Class Replacement

| Aptos Service | EVM Service | Purpose |
|---------------|-------------|---------|
| `AptosService.js` | `EVMService.js` | Main blockchain service |
| `AptosClientManager.js` | `EVMClientManager.js` | Connection management |
| `AptosGameTransactions.js` | `EVMGameTransactions.js` | Transaction builders |
| `AptosGameQueries.js` | `EVMGameQueries.js` | State queries |
| `aptosTransactionUtils.js` | `evmTransactionUtils.js` | Transaction utilities |

### SDK Changes

**Aptos SDK (Before)**:
```javascript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);

// Create game
const transaction = await aptos.transaction.build.simple({
  sender: account.accountAddress,
  data: {
    function: `${moduleAddress}::pepasur::create_game`,
    functionArguments: [stakeAmount, minPlayers],
  },
});
```

**ethers.js (After)**:
```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, provider);
const contract = new ethers.Contract(contractAddress, abi, wallet);

// Create game
const tx = await contract.createGame(
  ethers.parseEther(stakeAmount.toString()),
  minPlayers
);
const receipt = await tx.wait();
```

### Signature Generation Changes

**Aptos (ED25519)**:
```javascript
import { Ed25519PrivateKey } from '@aptos-labs/ts-sdk';

const privateKey = new Ed25519PrivateKey(process.env.SERVER_PRIVATE_KEY);
const message = constructSettlementMessage(gameId, winners, payouts);
const signature = privateKey.sign(message);
```

**EVM (ECDSA)**:
```javascript
import { ethers } from 'ethers';

const wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY);
const messageHash = constructSettlementMessage(gameId, winners, payouts);
const signature = await wallet.signMessage(ethers.getBytes(messageHash));
```

---

## Frontend Wallet Integration

### Wallet Adapter Replacement

**Aptos Wallet Adapter (Before)**:
```typescript
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';

<AptosWalletAdapterProvider
  plugins={[new PetraWallet(), new MartianWallet()]}
  autoConnect={true}
>
  {children}
</AptosWalletAdapterProvider>
```

**wagmi + viem (After)**:
```typescript
import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
  [u2uMainnet, celoMainnet],
  [publicProvider()]
);

const config = createConfig({
  autoConnect: true,
  connectors: [
    new MetaMaskConnector({ chains }),
    new WalletConnectConnector({ chains, options: { projectId } }),
  ],
  publicClient,
});

<WagmiConfig config={config}>
  {children}
</WagmiConfig>
```

### Contract Interaction Changes

**Aptos (Before)**:
```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

const { signAndSubmitTransaction } = useWallet();

const joinGame = async (gameId: number, stakeAmount: number) => {
  const response = await signAndSubmitTransaction({
    data: {
      function: `${moduleAddress}::pepasur::join_game`,
      functionArguments: [gameId],
      typeArguments: [],
    },
  });
  return response.hash;
};
```

**wagmi (After)**:
```typescript
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'viem';

const { config } = usePrepareContractWrite({
  address: contractAddress,
  abi: PepasurABI,
  functionName: 'joinGame',
  args: [gameId],
  value: parseEther(stakeAmount.toString()),
});

const { write: joinGame } = useContractWrite(config);
```

---

## Token Amount Conversion

### Decimal Differences

| Blockchain | Unit Name | Decimals | Conversion |
|------------|-----------|----------|------------|
| Aptos | Octas | 8 | 1 APT = 10^8 Octas |
| EVM (U2U/Celo) | Wei | 18 | 1 ETH/U2U/CELO = 10^18 Wei |

### Conversion Formulas

**Octas to Wei** (for migrating existing stake amounts):
```javascript
// If you have a stake amount in Octas
const octasAmount = 100000000; // 1 APT
const weiAmount = BigInt(octasAmount) * 10_000_000_000n; // Multiply by 10^10
// Result: 100000000000000000 Wei (0.1 ETH equivalent)
```

**Display Amount to Wei**:
```javascript
import { parseEther } from 'ethers';

const displayAmount = 0.1; // User enters 0.1 U2U/CELO
const weiAmount = parseEther(displayAmount.toString());
// Result: 100000000000000000n Wei
```

**Wei to Display Amount**:
```javascript
import { formatEther } from 'ethers';

const weiAmount = 100000000000000000n;
const displayAmount = formatEther(weiAmount);
// Result: "0.1"
```

### Minimum Stake Adjustments

**Before (Aptos)**:
```javascript
const MIN_STAKE_OCTAS = 10000000; // 0.1 APT
```

**After (EVM)**:
```javascript
const MIN_STAKE_WEI = parseEther("0.1"); // 0.1 U2U/CELO
// Result: 100000000000000000n Wei
```

---

## Environment Configuration

### Backend Environment Variables

**Before (Aptos)**:
```env
NETWORK=devnet
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
MODULE_ADDRESS=0x...
SERVER_PRIVATE_KEY=0x...
```

**After (EVM)**:
```env
NETWORK_NAME=u2u
CHAIN_ID=39
RPC_URL=https://rpc-mainnet.uniultra.xyz
WS_URL=wss://ws-mainnet.uniultra.xyz
CONTRACT_ADDRESS=0x...
SERVER_PRIVATE_KEY=0x...
ADMIN_PRIVATE_KEY=0x...
ALLOWED_ORIGINS=https://u2u.pepasur.xyz,https://celo.pepasur.xyz
```

### Frontend Environment Variables

**Before (Aptos)**:
```env
NEXT_PUBLIC_APTOS_NETWORK=devnet
NEXT_PUBLIC_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
NEXT_PUBLIC_MODULE_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_STAKE_AMOUNT=100000000
```

**After (EVM)**:
```env
NEXT_PUBLIC_NETWORK=u2u
NEXT_PUBLIC_CHAIN_ID=39
NEXT_PUBLIC_RPC_URL=https://rpc-mainnet.uniultra.xyz
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NETWORK_NAME=U2U Network
NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL=U2U
NEXT_PUBLIC_EXPLORER_URL=https://u2uscan.xyz
NEXT_PUBLIC_DEFAULT_STAKE_AMOUNT=100000000000000000
```

### Network-Specific Configuration Files

Create separate environment files for each network:

**`.env.u2u`**:
```env
NETWORK_NAME=u2u
CHAIN_ID=39
RPC_URL=https://rpc-mainnet.uniultra.xyz
CONTRACT_ADDRESS=<u2u_contract_address>
```

**`.env.celo`**:
```env
NETWORK_NAME=celo
CHAIN_ID=42220
RPC_URL=https://forno.celo.org
CONTRACT_ADDRESS=<celo_contract_address>
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Remove all Aptos dependencies from `package.json` files
- [ ] Install EVM dependencies (ethers.js, wagmi, viem)
- [ ] Update all import statements
- [ ] Remove Move contract files
- [ ] Create Solidity contracts
- [ ] Write comprehensive contract tests
- [ ] Update environment variable files
- [ ] Generate server wallet (ECDSA key pair)
- [ ] Acquire native tokens for deployment (U2U/CELO)

### Smart Contract Deployment

#### U2U Network

1. **Configure Hardhat**:
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    u2u: {
      url: "https://rpc-mainnet.uniultra.xyz",
      chainId: 39,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
  },
};
```

2. **Deploy Contract**:
```bash
cd contract
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network u2u
```

3. **Initialize Contract**:
```bash
npx hardhat run scripts/initialize.js --network u2u
```

4. **Verify on Explorer**:
```bash
npx hardhat verify --network u2u <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

#### Celo Network

1. **Configure Hardhat**:
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    celo: {
      url: "https://forno.celo.org",
      chainId: 42220,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
    },
  },
};
```

2. **Deploy Contract**:
```bash
npx hardhat run scripts/deploy.js --network celo
```

3. **Initialize Contract**:
```bash
npx hardhat run scripts/initialize.js --network celo
```

### Backend Deployment

1. **Update Environment**:
```bash
# For U2U
cp .env.u2u .env

# For Celo
cp .env.celo .env
```

2. **Update Contract Address**:
```env
CONTRACT_ADDRESS=<deployed_contract_address>
```

3. **Start Backend**:
```bash
cd backend
npm install
npm start
```

4. **Verify Backend**:
```bash
curl http://localhost:3001/api/health
```

### Frontend Deployment

1. **Update Environment**:
```bash
# For U2U
cp .env.u2u .env.local

# For Celo
cp .env.celo .env.local
```

2. **Build Frontend**:
```bash
cd frontend
npm install
npm run build
```

3. **Deploy to Hosting**:
```bash
# Deploy to u2u.pepasur.xyz
npm start

# Or deploy to Vercel/Netlify with environment variables
```

### Post-Deployment Verification

- [ ] Verify contract on block explorer
- [ ] Test wallet connection (MetaMask)
- [ ] Test game creation
- [ ] Test player joining
- [ ] Test game settlement
- [ ] Test withdrawal
- [ ] Test game cancellation
- [ ] Verify transaction links work
- [ ] Check CORS configuration
- [ ] Monitor error logs

---

## Testing Guide

### Local Testing

1. **Start Local Hardhat Node**:
```bash
cd contract
npx hardhat node
```

2. **Deploy to Local Network**:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. **Configure Backend for Local**:
```env
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=<local_contract_address>
```

4. **Configure Frontend for Local**:
```env
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_CONTRACT_ADDRESS=<local_contract_address>
```

### Testnet Testing

1. **Get Testnet Tokens**:
   - Celo Sepolia: https://faucet.celo.org/
   - U2U Testnet: Contact U2U team

2. **Deploy to Testnet**:
```bash
npx hardhat run scripts/deploy.js --network celo-sepolia
```

3. **Test Complete Flow**:
   - Connect wallet
   - Create game
   - Join game (multiple players)
   - Complete game
   - Settle game
   - Withdraw winnings

### Integration Testing

Test the complete flow from frontend to blockchain:

1. **Game Creation Flow**:
   - Frontend: Click "Create Game"
   - Backend: Receives request, calls `EVMService.createGame()`
   - Contract: Emits `GameCreated` event
   - Backend: Extracts game ID from receipt
   - Frontend: Displays room code

2. **Player Joining Flow**:
   - Frontend: User clicks "Join Game"
   - Frontend: Calls `contract.joinGame()` with stake
   - Contract: Validates stake, adds player
   - Contract: Emits `PlayerJoined` event
   - Backend: Receives event via WebSocket
   - Frontend: Updates player list

3. **Settlement Flow**:
   - Backend: Game ends, calculates winners
   - Backend: Constructs settlement message
   - Backend: Signs message with server wallet
   - Backend: Calls `contract.settleGame()` with signature
   - Contract: Verifies signature, distributes rewards
   - Contract: Emits `GameSettled` event
   - Frontend: Displays results

---

## Troubleshooting

### Common Issues

#### 1. Signature Verification Fails

**Problem**: Contract rejects settlement with "Invalid signature"

**Solutions**:
- Verify `SERVER_PRIVATE_KEY` in backend matches `serverSigner` address in contract
- Check message construction matches contract's `constructSettlementMessage`
- Ensure signature format is correct (v, r, s components)
- Verify you're using `signMessage` not `signTransaction`

**Debug**:
```javascript
// Backend
const wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY);
console.log("Server wallet address:", wallet.address);

// Contract
const serverSigner = await contract.serverSigner();
console.log("Contract server signer:", serverSigner);

// They must match!
```

#### 2. Transaction Fails with "Insufficient Funds"

**Problem**: Transactions fail due to insufficient balance

**Solutions**:
- Ensure server wallet has enough native tokens for gas
- Check player has enough tokens for stake + gas
- Verify stake amount is correct (in Wei, not Ether)

**Debug**:
```javascript
const balance = await provider.getBalance(wallet.address);
console.log("Balance:", ethers.formatEther(balance), "ETH");
```

#### 3. Wrong Network

**Problem**: Wallet connected to wrong network

**Solutions**:
- Prompt user to switch networks
- Use wagmi's `switchNetwork` function
- Add network to wallet if not present

**Code**:
```typescript
import { useSwitchNetwork, useNetwork } from 'wagmi';

const { chain } = useNetwork();
const { switchNetwork } = useSwitchNetwork();

if (chain?.id !== targetChainId) {
  switchNetwork?.(targetChainId);
}
```

#### 4. Contract Not Initialized

**Problem**: Contract calls fail with "Not initialized"

**Solution**:
```bash
npx hardhat run scripts/initialize.js --network <network>
```

Verify initialization:
```javascript
const config = await contract.getConfig();
console.log("Initialized:", config.initialized);
```

#### 5. Token Amount Display Issues

**Problem**: Amounts show incorrect decimals

**Solution**: Always use `formatEther` and `parseEther`:
```javascript
// Display
const displayAmount = formatEther(weiAmount);

// Input
const weiAmount = parseEther(userInput);
```

#### 6. CORS Errors

**Problem**: Frontend can't connect to backend

**Solution**: Update backend CORS configuration:
```javascript
// backend/server.js
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
```

#### 7. RPC Connection Issues

**Problem**: Cannot connect to RPC endpoint

**Solutions**:
- Verify RPC URL is correct and accessible
- Try alternative RPC endpoints
- Check if network is experiencing downtime
- Implement fallback RPC providers

**Code**:
```javascript
const providers = [
  new ethers.JsonRpcProvider(process.env.RPC_URL),
  new ethers.JsonRpcProvider(process.env.FALLBACK_RPC_URL),
];

// Use FallbackProvider
const provider = new ethers.FallbackProvider(providers);
```

### Debugging Tools

1. **Block Explorers**:
   - U2U: https://u2uscan.xyz
   - Celo: https://explorer.celo.org
   - Celo Sepolia: https://celo-sepolia.blockscout.com

2. **Hardhat Console**:
```bash
npx hardhat console --network <network>
```

3. **Contract Events**:
```javascript
// Listen to all events
contract.on("*", (event) => {
  console.log("Event:", event);
});

// Listen to specific event
contract.on("GameCreated", (gameId, creator, stake, minPlayers) => {
  console.log("Game created:", gameId);
});
```

4. **Transaction Traces**:
```javascript
const tx = await contract.createGame(stake, minPlayers);
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());
console.log("Events:", receipt.events);
```

---

## Migration Completion Checklist

### Code Changes
- [ ] All Aptos dependencies removed from package.json
- [ ] All EVM dependencies installed
- [ ] Move contracts deleted
- [ ] Solidity contracts created and tested
- [ ] Backend services migrated to ethers.js
- [ ] Frontend migrated to wagmi + viem
- [ ] All import statements updated
- [ ] Token amounts converted to Wei
- [ ] Signature verification updated to ECDSA

### Configuration
- [ ] Environment variables updated
- [ ] Network-specific config files created
- [ ] CORS configured for both subdomains
- [ ] Server wallet generated and secured
- [ ] Contract addresses documented

### Deployment
- [ ] Contracts deployed to U2U
- [ ] Contracts deployed to Celo
- [ ] Contracts initialized
- [ ] Contracts verified on explorers
- [ ] Backend deployed for U2U
- [ ] Backend deployed for Celo
- [ ] Frontend deployed to u2u.pepasur.xyz
- [ ] Frontend deployed to celo.pepasur.xyz

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] End-to-end tests pass
- [ ] Game creation works
- [ ] Player joining works
- [ ] Settlement works
- [ ] Withdrawal works
- [ ] Cancellation works

### Documentation
- [ ] README files updated
- [ ] Migration guide created
- [ ] Deployment instructions documented
- [ ] Troubleshooting guide created
- [ ] API documentation updated

---

## Additional Resources

- [ethers.js Documentation](https://docs.ethers.org/)
- [wagmi Documentation](https://wagmi.sh/)
- [viem Documentation](https://viem.sh/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [U2U Network Documentation](https://docs.uniultra.xyz/)
- [Celo Documentation](https://docs.celo.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

---

## Support

For issues or questions during migration:
1. Check this migration guide
2. Review the troubleshooting section
3. Check block explorer for transaction details
4. Review contract events and logs
5. Test on testnet before mainnet deployment

---

**Migration completed successfully!** 🎉

The Pepasur game is now running on EVM-compatible blockchains with full functionality preserved.
