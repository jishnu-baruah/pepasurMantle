# Pepasur Backend

Real-time Mafia gameplay backend with EVM blockchain integration for staking, role commit-reveal, and final settlements on U2U and Celo networks.

## ✨ Features

- **Real-time Gameplay**: Socket.IO for live game updates and player interactions
- **EVM Blockchain Integration**: On-chain staking, settlements, and payouts via ethers.js
- **Multi-Network Support**: Configurable for U2U Network and Celo via environment variables
- **Game State Management**: In-memory game state with optional MongoDB persistence
- **Commit-Reveal Mechanism**: Cryptographic security for action submission
- **ECDSA Signature Generation**: Server-signed settlements for secure reward distribution
- **Detective Role Features**: Role revelation and verification system
- **Game Phase Management**: Night, Task, Resolution, and Voting phases
- **Mini-game System**: Sequence rebuild, memory puzzles, hash reconstruction
- **Faucet Service**: Native token distribution for new players on testnet
- **RESTful API**: Comprehensive endpoints for game management

## 🛠️ Tech Stack

- **Runtime**: Node.js v18+
- **Framework**: Express 4.18.2
- **Real-time**: Socket.IO 4.7.4
- **Blockchain**: ethers.js 6.8.1 (EVM interaction library)
- **Database**: Mongoose 8.19.2 (MongoDB, optional)
- **Utilities**: dotenv, uuid, cors

## 🚀 Getting Started

### Prerequisites

- **Node.js v18 or higher**: JavaScript runtime
- **MongoDB** (optional): For persistent game state storage
- **EVM Wallet Private Key**: Server wallet for signing settlements and transactions
- **Native Tokens**: U2U or CELO tokens for gas fees and faucet distribution
- **Deployed Contract**: Pepasur.sol contract deployed on target network

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables

```bash
copy .env.example .env
```

Edit `.env` with your configuration:

```env
# Network Configuration
NETWORK_NAME=u2u                              # or 'celo'
CHAIN_ID=39                                   # 39 for U2U, 42220 for Celo
RPC_URL=https://rpc-mainnet.uniultra.xyz      # Network RPC endpoint
WS_URL=wss://ws-mainnet.uniultra.xyz          # WebSocket endpoint (optional)

# Server Configuration
PORT=3001
SERVER_PRIVATE_KEY=0x...                      # Server wallet private key (ECDSA)
ADMIN_PRIVATE_KEY=0x...                       # Admin wallet private key

# Contract Configuration
CONTRACT_ADDRESS=0x...                        # Deployed Pepasur.sol contract address
CONTRACT_ABI_PATH=./contracts/PepasurABI.json # Path to contract ABI

# CORS Configuration
ALLOWED_ORIGINS=https://u2u.pepasur.xyz,https://celo.pepasur.xyz

# Game Settings
DEFAULT_NIGHT_PHASE_DURATION=30
DEFAULT_RESOLUTION_PHASE_DURATION=10
DEFAULT_TASK_PHASE_DURATION=30
DEFAULT_VOTING_PHASE_DURATION=10
DEFAULT_MAX_TASK_COUNT=4
DEFAULT_STAKE_AMOUNT=100000000000000000       # In Wei (0.1 ETH/U2U/CELO)
DEFAULT_MIN_PLAYERS=4
DEFAULT_MAX_PLAYERS=10
GAME_TIMEOUT_SECONDS=300

# MongoDB Configuration (optional)
MONGODB_URI=mongodb://localhost:27017/pepasur
```

**Network-Specific Configuration:**

For **U2U Network**:
```env
NETWORK_NAME=u2u
CHAIN_ID=39
RPC_URL=https://rpc-mainnet.uniultra.xyz
WS_URL=wss://ws-mainnet.uniultra.xyz
```

For **Celo Network**:
```env
NETWORK_NAME=celo
CHAIN_ID=42220
RPC_URL=https://forno.celo.org
```

For **Celo Sepolia Testnet**:
```env
NETWORK_NAME=celo-sepolia
CHAIN_ID=44787
RPC_URL=https://alfajores-forno.celo-testnet.org
```

### Step 3: Start the Server

```bash
npm run dev  # Development with nodemon
# or
npm start    # Production
```

The server will run on http://localhost:3001

## 📂 Project Structure

```
backend/
├── config/              # Configuration files
│   └── database.js     # MongoDB connection setup
├── models/              # Data models (Mongoose schemas)
│   ├── Game.js         # Game state model
│   └── FaucetRequest.js # Faucet request tracking
├── routes/              # API route handlers
│   ├── game.js         # Game management endpoints
│   └── faucet.js       # Faucet endpoints
├── services/            # Business logic layer
│   ├── evm/            # EVM blockchain services
│   │   ├── EVMService.js             # Main EVM service
│   │   ├── EVMClientManager.js       # Client connection management
│   │   ├── EVMGameQueries.js         # On-chain data queries
│   │   ├── EVMGameTransactions.js    # Transaction builders
│   │   └── EVMSignatureUtils.js      # ECDSA signature utilities
│   ├── core/           # Core services
│   │   ├── FaucetService.js   # Faucet token distribution
│   │   ├── SocketManager.js   # Socket.IO event handling
│   │   └── TaskManager.js     # Mini-game task management
│   ├── game/           # Game logic services
│   │   ├── GameManager.js         # Game state management
│   │   ├── GameRepository.js      # Game data access
│   │   ├── GameRewardService.js   # Reward calculation
│   │   ├── GameStateFormatter.js  # State formatting
│   │   └── PhaseManager.js        # Game phase transitions
│   └── staking/        # Staking services
│       ├── StakingManager.js  # Staking coordination
│       └── StakingService.js  # Staking operations
├── utils/               # Utility functions
│   ├── commitReveal.js           # Commit-reveal cryptography
│   ├── evmTransactionUtils.js    # EVM transaction helpers
│   ├── dbUtils.js                # Database utilities
│   └── timeFormatter.js          # Time formatting
├── scripts/             # Utility scripts
│   ├── initialize-contract.js    # Contract initialization
│   ├── update-server-signer.js   # Update server signer
│   └── check-faucet-setup.js     # Faucet setup verification
├── .env                 # Environment variables
├── package.json         # Dependencies
└── server.js            # Application entry point
```

## 🔌 API Endpoints

### Game Management

- `POST /api/game/create` - Create a new game lobby
- `GET /api/game/:gameId` - Get game state
- `PATCH /api/game/:gameId` - Update game state (admin)
- `POST /api/game/:gameId/player/join` - Join game
- `POST /api/game/:gameId/player/eliminate` - Eliminate player
- `GET /api/game` - Get list of active games
- `GET /api/game/:gameId/history` - Get game history

### Game Actions

- `POST /api/game/:gameId/action/night` - Submit night phase action
- `POST /api/game/:gameId/task/submit` - Submit task answer
- `POST /api/game/:gameId/vote/submit` - Submit elimination vote

### Detective Features

- `POST /api/detective/reveal` - Store detective role reveal
- `GET /api/detective/reveals/:gameId` - Get detective reveals for game
- `POST /api/detective/verify` - Verify detective reveal signature
- `GET /api/detective/info/:gameId` - Get detective information

### Faucet

- `POST /api/faucet/claim` - Claim testnet tokens (once per 24 hours)
- `GET /api/faucet/status/:address` - Check faucet eligibility

### Health Check

- `GET /api/health` - Backend health status

## 🔄 Socket.IO Events

### Client → Server

- `join_game` - Join game channel
  - Payload: `{ gameId, playerId }`
- `submit_action` - Submit game action (night phase)
  - Payload: `{ gameId, playerId, action, target }`
- `submit_task` - Submit task answer
  - Payload: `{ gameId, playerId, taskId, answer }`
- `submit_vote` - Submit elimination vote
  - Payload: `{ gameId, playerId, targetId }`
- `chat_message` - Send chat message
  - Payload: `{ gameId, playerId, message }`

### Server → Client

- `game_state` - Full game state update
  - Payload: Complete game state object
- `game_update` - Incremental game state changes
  - Payload: `{ type, data }`
- `task_update` - Task submission updates
  - Payload: `{ taskId, playerId, status }`
- `task_result` - Task completion results
  - Payload: `{ taskId, success, rewards }`
- `detective_reveal` - Detective action notifications
  - Payload: `{ playerId, revealedRole }`
- `chat_message` - Chat messages
  - Payload: `{ playerId, message, timestamp }`
- `error` - Error notifications
  - Payload: `{ message, code }`

## 🎮 Game Flow

1. **Lobby Phase**: Players join and wait for minimum player count
2. **Night Phase**: Mafia eliminates, Doctor protects, Detective investigates
3. **Resolution Phase**: Night actions are resolved and results announced
4. **Task Phase**: Players complete mini-games for rewards
5. **Voting Phase**: Players vote to eliminate suspected Mafia
6. **Repeat**: Cycle continues until win condition is met

## 🎭 Game Roles

- **Mafia**: Eliminate villagers at night
- **Doctor**: Save players from mafia attacks
- **Detective**: Investigate and reveal player roles
- **Villagers**: Complete tasks and vote to eliminate mafia

## 🔐 Commit-Reveal Mechanism

The backend implements a cryptographic commit-reveal system for secure action submission:

1. **Commit Phase**: Players submit hashed actions with nonce
   ```javascript
   commit = hash(action + nonce + playerId)
   ```

2. **Reveal Phase**: Players reveal action + nonce for verification
   ```javascript
   revealedAction = { action, nonce, playerId }
   ```

3. **Validation**: Server verifies commit hash matches reveal
   ```javascript
   isValid = (commit === hash(action + nonce + playerId))
   ```

4. **Execution**: Actions are processed after all reveals validated

This ensures players cannot change actions after seeing others' moves, maintaining game integrity.

## ⛓️ EVM Blockchain Integration

The backend uses **EVMService** to interact with EVM-compatible blockchains (U2U and Celo) via ethers.js.

### EVMService Class

Located at `services/evm/EVMService.js`, this service handles all blockchain interactions:

**Initialization:**
```javascript
const evmService = new EVMService();
await evmService.initialize();
```

**Key Methods:**

- **`createGame(stakeAmount, minPlayers)`**: Create game on-chain
  - Submits transaction to contract's `createGame` function
  - Returns game ID from transaction receipt
  
- **`getGameInfo(gameId)`**: Query game state from contract
  - Fetches game details including players, status, and pool
  
- **`settleGame(gameId, winners, payouts)`**: Settle game with server signature
  - Constructs settlement message
  - Signs with server's ECDSA private key
  - Submits settlement transaction with signature
  
- **`sendNativeToken(recipientAddress, amount)`**: Send tokens (faucet)
  - Transfers native tokens (U2U/CELO) to recipient
  - Used for testnet faucet functionality

**Architecture:**

```
EVMService (Main service)
├── EVMClientManager (Connection management)
├── EVMGameTransactions (Transaction builders)
├── EVMGameQueries (State queries)
└── EVMSignatureUtils (ECDSA signing)
```

### Signature Verification

All game settlements require ECDSA signatures:

1. **Message Construction**: `keccak256(gameId || winners || payouts)`
2. **Signing**: Server signs message with private key
3. **Verification**: Contract verifies signature using `ecrecover`
4. **Execution**: Settlement proceeds if signature is valid

This ensures only the authorized server can settle games and distribute rewards.

### Transaction Flow

**Game Creation:**
```
Backend → EVMService.createGame() → Contract.createGame()
→ Transaction Receipt → Extract Game ID → Return to Client
```

**Player Joining:**
```
Frontend → Contract.joinGame() (payable) → Stake Deposited
→ Event Emitted → Backend Receives Update via WebSocket
```

**Settlement:**
```
Backend → Construct Message → Sign with Server Key
→ EVMService.settleGame() → Contract.settleGame(signature)
→ Verify Signature → Distribute Rewards → Queue Withdrawals
```

**Withdrawal:**
```
Frontend → Contract.withdraw() → Transfer Pending Balance
→ Update State → Emit Withdrawal Event
```

## 🔒 Security Considerations

- **Commit-Reveal**: All game actions use commit-reveal mechanism to prevent cheating
- **Role Encryption**: Role information encrypted and stored off-chain
- **Signature Verification**: Detective reveals require signature verification
- **Input Validation**: All API endpoints validate input parameters
- **Private Key Security**: Server private key must be kept secure and never committed to version control
- **Rate Limiting**: Faucet includes rate limiting (once per 24 hours per address)

## 🧪 Development

### Running Tests

```bash
npm test
```

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NETWORK_NAME` | Network identifier (u2u/celo) | u2u |
| `CHAIN_ID` | EVM chain ID | 39 (U2U), 42220 (Celo) |
| `RPC_URL` | Network RPC endpoint | https://rpc-mainnet.uniultra.xyz |
| `WS_URL` | WebSocket endpoint (optional) | wss://ws-mainnet.uniultra.xyz |
| `PORT` | Server port | 3001 |
| `SERVER_PRIVATE_KEY` | Server wallet private key (ECDSA) | 0x... |
| `ADMIN_PRIVATE_KEY` | Admin wallet private key | 0x... |
| `CONTRACT_ADDRESS` | Deployed Pepasur.sol contract address | 0x... |
| `CONTRACT_ABI_PATH` | Path to contract ABI file | ./contracts/PepasurABI.json |
| `ALLOWED_ORIGINS` | CORS allowed origins | https://u2u.pepasur.xyz |
| `DEFAULT_NIGHT_PHASE_DURATION` | Night phase duration (seconds) | 30 |
| `DEFAULT_RESOLUTION_PHASE_DURATION` | Resolution phase duration (seconds) | 10 |
| `DEFAULT_TASK_PHASE_DURATION` | Task phase duration (seconds) | 30 |
| `DEFAULT_VOTING_PHASE_DURATION` | Voting phase duration (seconds) | 10 |
| `DEFAULT_MAX_TASK_COUNT` | Maximum tasks per game | 4 |
| `DEFAULT_STAKE_AMOUNT` | Default stake in Wei | 100000000000000000 (0.1 ETH) |
| `DEFAULT_MIN_PLAYERS` | Minimum players to start | 4 |
| `DEFAULT_MAX_PLAYERS` | Maximum players per game | 10 |
| `GAME_TIMEOUT_SECONDS` | Game timeout duration | 300 |
| `MONGODB_URI` | MongoDB connection string (optional) | mongodb://localhost:27017/pepasur |

### Utility Scripts

Initialize the deployed contract:
```bash
node scripts/initialize-contract.js
```

Update server signer address:
```bash
node scripts/update-server-signer.js
```

Check faucet setup:
```bash
node scripts/check-faucet-setup.js
```

## 🌐 Network-Specific Setup Guides

### U2U Network Setup

1. **Get U2U Tokens**: Acquire U2U tokens for gas fees
2. **Configure Environment**:
   ```env
   NETWORK_NAME=u2u
   CHAIN_ID=39
   RPC_URL=https://rpc-mainnet.uniultra.xyz
   WS_URL=wss://ws-mainnet.uniultra.xyz
   CONTRACT_ADDRESS=<your_deployed_contract>
   ```
3. **Deploy Contract**: Use Hardhat to deploy Pepasur.sol to U2U
4. **Initialize Contract**: Run `node scripts/initialize-contract.js`
5. **Start Backend**: `npm start`

### Celo Network Setup

1. **Get CELO Tokens**: Acquire CELO tokens for gas fees
2. **Configure Environment**:
   ```env
   NETWORK_NAME=celo
   CHAIN_ID=42220
   RPC_URL=https://forno.celo.org
   CONTRACT_ADDRESS=<your_deployed_contract>
   ```
3. **Deploy Contract**: Use Hardhat to deploy Pepasur.sol to Celo
4. **Initialize Contract**: Run `node scripts/initialize-contract.js`
5. **Start Backend**: `npm start`

### Testnet Setup (Celo Sepolia)

For development and testing:

```env
NETWORK_NAME=celo-sepolia
CHAIN_ID=44787
RPC_URL=https://alfajores-forno.celo-testnet.org
CONTRACT_ADDRESS=<your_testnet_contract>
```

Get testnet tokens from [Celo Faucet](https://faucet.celo.org/)

## 🔧 Troubleshooting

### Connection Issues

**Problem**: Cannot connect to RPC endpoint
- **Solution**: Verify RPC_URL is correct and accessible
- **Solution**: Check if network is experiencing downtime
- **Solution**: Try alternative RPC endpoints if available

**Problem**: WebSocket connection fails
- **Solution**: WS_URL is optional; backend will work without it
- **Solution**: Verify WebSocket endpoint supports your network

### Transaction Failures

**Problem**: Transactions fail with "insufficient funds"
- **Solution**: Ensure server wallet has enough native tokens for gas
- **Solution**: Check gas price settings in EVMService

**Problem**: Settlement signature verification fails
- **Solution**: Verify SERVER_PRIVATE_KEY matches the serverSigner address in contract
- **Solution**: Check signature construction in EVMSignatureUtils.js

### Contract Interaction Issues

**Problem**: Contract calls return errors
- **Solution**: Verify CONTRACT_ADDRESS is correct
- **Solution**: Ensure contract ABI matches deployed contract
- **Solution**: Check if contract is initialized with correct parameters

### Environment Configuration

**Problem**: Backend fails to start
- **Solution**: Verify all required environment variables are set
- **Solution**: Check .env file syntax (no spaces around =)
- **Solution**: Ensure private keys are in correct format (0x prefix)

## 📚 Additional Resources

- [ethers.js Documentation](https://docs.ethers.org/)
- [U2U Network Documentation](https://docs.uniultra.xyz/)
- [Celo Documentation](https://docs.celo.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Solidity Documentation](https://docs.soliditylang.org/)

## 📜 License

MIT
