# Pepasur Move Smart Contract

On-chain game logic for Pepasur, an Aptos blockchain-based Mafia game with server-signed settlements, staking mechanics, and secure withdrawal patterns.

## 🚀 Features

### Entry Functions (Transactions)
- **`initialize`**: One-time post-deployment setup to configure admin, server signer, and fee recipient
- **`create_game`**: Create new game lobby with customizable stake amount and minimum player requirements
- **`join_game`**: Join existing game with automatic stake deposit and game start when minimum players reached
- **`settle_game`**: Settle completed game with server-signed winner payouts and house fee distribution
- **`withdraw`**: Withdraw pending winnings to player account using two-step withdrawal pattern
- **`cancel_game`**: Cancel game in lobby or in-progress state with automatic refunds to all players
- **`update_server_signer`**: Admin function to update server's ED25519 public key
- **`update_fee_recipient`**: Admin function to change house fee recipient address
- **`update_house_cut`**: Admin function to adjust house cut percentage (max 20%)

### View Functions (Read-Only)
- **`get_game`**: Retrieve complete game information by ID (creator, stake, players, status, pool)
- **`get_pending_withdrawal`**: Check pending withdrawal balance for any player address
- **`get_config`**: Get contract configuration (admin, fee recipient, house cut, initialization status)
- **`get_next_game_id`**: Get next game ID to be created

## 🏗️ Module Structures

### Config Resource
Stores global contract configuration at module address:
- **`admin`**: Address with administrative privileges
- **`server_signer`**: ED25519 public key (32 bytes) for settlement signature verification
- **`fee_recipient`**: Address receiving house cut from game settlements
- **`house_cut_bps`**: House fee in basis points (100 = 1%, max 2000 = 20%)
- **`initialized`**: Flag indicating post-deployment initialization completion

### Game Resource
Stores individual game state within GameStore:
- **`id`**: Unique game identifier (sequential)
- **`creator`**: Game creator's address
- **`stake_amount`**: Required stake in Octas (1 APT = 100,000,000 Octas)
- **`min_players`**: Minimum players required to start game
- **`players`**: Vector of player addresses who joined
- **`deposits`**: Vector of stake amounts deposited by each player
- **`status`**: Game state (0=Lobby, 1=InProgress, 2=Settled, 3=Cancelled)
- **`total_pool`**: Total staked amount from all players
- **`created_at`**: Unix timestamp of game creation

### GameStore Resource
Central storage for all games and vault:
- **`games`**: Vector of all Game structs
- **`next_game_id`**: Counter for next game ID
- **`vault`**: Coin vault holding all staked and pending funds

### PendingWithdrawals Resource
Tracks queued withdrawals for players:
- **`balances`**: SimpleMap of player addresses to withdrawal amounts

## 🛠️ How to Build & Deploy

### Prerequisites
- Node.js v18+ installed
- Hardhat development environment
- EVM wallet with private key
- Native tokens (U2U or CELO) for deployment

### Install Dependencies
```bash
cd contract
npm install
```

### Configure Environment
```bash
copy .env.example .env
```

Edit `.env` with your configuration:
```env
NETWORK_NAME=u2u
CHAIN_ID=39
RPC_URL=https://rpc-mainnet.uniultra.xyz
DEPLOYER_PRIVATE_KEY=0x...
SERVER_SIGNER_ADDRESS=0x...
FEE_RECIPIENT_ADDRESS=0x...
```

### Compile Contracts
```bash
npx hardhat compile
```

This compiles the Solidity contracts and generates artifacts. Fix any compilation errors before proceeding.

### Run Tests
```bash
npx hardhat test
```

Executes all unit tests defined in the `test/` directory. Ensure all tests pass before deployment.

### Deploy to Network
```bash
npx hardhat run scripts/deploy.js --network u2u
```

**After successful deployment:**
1. Copy the deployed contract address from the output
2. Update `CONTRACT_ADDRESS` in `backend/.env`
3. Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `frontend/.env.local`

### Initialize Contract
```bash
npx hardhat run scripts/initialize.js --network u2u
```

### Verify Deployment
Visit the block explorer to verify your deployment:
- **U2U**: `https://u2uscan.xyz/address/[CONTRACT_ADDRESS]`
- **Celo**: `https://explorer.celo.org/address/[CONTRACT_ADDRESS]`

Replace `[CONTRACT_ADDRESS]` with your deployed contract address.

## 🔧 Post-Deployment Configuration

After deploying the contract, you **must** initialize it with configuration. This can only be done once.

### Step 1: Generate Server Signing Key
```bash
# Generate ECDSA key pair for server (or use existing EVM wallet)
# The server wallet address will be used for signature verification
```

Store the server wallet private key securely in backend `.env` as `SERVER_PRIVATE_KEY`.

### Step 2: Initialize Contract
```bash
npx hardhat run scripts/initialize.js --network u2u
```

The initialization script will:
- Set the server signer address (for signature verification)
- Set the fee recipient address (to receive house cut)
- Set the admin address (deployer by default)

**Environment Variables Required:**
- `CONTRACT_ADDRESS`: Your deployed contract address
- `SERVER_SIGNER_ADDRESS`: Address of the server wallet (for ECDSA signature verification)
- `FEE_RECIPIENT_ADDRESS`: Address to receive house cut

### Step 3: Verify Configuration
```bash
npx hardhat run scripts/interact.js --network u2u
```

This will display the contract configuration including admin, server signer, fee recipient, and house cut (200 bps = 2%).

## 📍 Contract Address

**U2U Mainnet**: `[To be deployed]`

**Celo Mainnet**: `[To be deployed]`

**Celo Sepolia Testnet**: `[To be deployed]`

View on Explorer:
- U2U: `https://u2uscan.xyz/address/[ADDRESS]`
- Celo: `https://explorer.celo.org/address/[ADDRESS]`
- Celo Sepolia: `https://celo-sepolia.blockscout.com/address/[ADDRESS]`

## 🔐 Security Considerations

### Server Key Management
The server's private key must be kept secure. A compromised key would allow submission of fraudulent game results with valid signatures. Store the key in a secure environment variable and never commit it to version control. Consider using hardware security modules (HSM) or key management services for production deployments.

### Signature Verification
All game settlements require ECDSA signature verification. The contract constructs a message from `game_id || winners || payouts` and verifies it against the configured server signer address using `ecrecover`. Only the authorized server (configured during initialization) can submit valid settlement transactions.

### Withdrawal Pattern
The contract uses a two-step withdrawal pattern:
1. **Settlement Phase**: Winnings are queued to player's pending balance in PendingWithdrawals
2. **Withdrawal Phase**: Player explicitly calls `withdraw()` to transfer funds to their account

This pattern prevents reentrancy attacks and provides a clear audit trail. Players can accumulate winnings from multiple games before withdrawing.

### Role Secrecy
Player roles are never stored on-chain, preserving game secrecy. Only commitment hashes are stored on-chain (if needed), which are revealed off-chain during gameplay. The blockchain only handles financial transactions and game lifecycle, not game logic.

### Emergency Controls
The contract includes admin functions for emergency situations:
- **`update_server_signer`**: Rotate compromised server keys
- **`update_fee_recipient`**: Change fee destination if needed
- **`cancel_game`**: Creators can cancel games with automatic refunds

### House Cut Limits
The house cut is capped at 2000 basis points (20%) to prevent excessive fees. The `update_house_cut` function enforces this limit.

## 🧪 Testing

The contract includes comprehensive unit tests covering:
- Game creation with various stake amounts and player limits
- Player joining and automatic game start
- Settlement with multiple winner configurations
- Withdrawal mechanism and balance tracking
- Signature verification (valid and invalid signatures)
- Access control and admin permissions
- Game cancellation and refund logic
- Edge cases (invalid game IDs, wrong status, insufficient funds)

### Run Tests
```bash
npx hardhat test
```

### Run Tests with Coverage
```bash
npx hardhat coverage
```

Coverage reports show which code paths are tested. Aim for >90% coverage on critical functions.

### Run Specific Test
```bash
npx hardhat test --grep "create game"
```

## 📚 Additional Resources
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [U2U Network Documentation](https://docs.uniultra.xyz/)
- [Celo Documentation](https://docs.celo.org/)
- [ECDSA Signatures](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm)
