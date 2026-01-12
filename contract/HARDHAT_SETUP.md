# Pepasur Smart Contract - Hardhat Setup

This directory contains the Solidity smart contracts for the Pepasur game, configured for deployment to U2U Network and Celo.

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- A wallet with native tokens for deployment (U2U or CELO)

## Installation

```bash
npm install
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Fill in your environment variables in `.env`:
   - `DEPLOYER_PRIVATE_KEY`: Your deployer wallet private key (with 0x prefix)
   - `SERVER_SIGNER_ADDRESS`: Address that will sign game settlements
   - `FEE_RECIPIENT_ADDRESS`: Address that will receive house fees
   - Network RPC URLs (defaults are provided)

## Available Networks

### Mainnets
- **U2U Network**: Chain ID 39
- **Celo**: Chain ID 42220

### Testnets
- **U2U Testnet**: Chain ID 2484
- **Celo Alfajores**: Chain ID 44787
- **Celo Sepolia**: Chain ID 11142220

## Development Workflow

### 1. Compile Contracts

```bash
npm run compile
```

This compiles all Solidity contracts in the `contracts/` directory.

### 2. Run Tests

```bash
npm test
```

Runs all tests in the `test/` directory.

### 3. Deploy to Network

#### Deploy to U2U Testnet
```bash
npm run deploy:u2uTestnet
```

#### Deploy to Celo Sepolia Testnet
```bash
npm run deploy:celoSepolia
```

#### Deploy to U2U Mainnet
```bash
npm run deploy:u2u
```

#### Deploy to Celo Mainnet
```bash
npm run deploy:celo
```

### 4. Initialize Contract

After deployment, initialize the contract with server signer and fee recipient:

```bash
# Set CONTRACT_ADDRESS in .env first
npm run initialize -- --network u2uTestnet
```

### 5. Verify Contract

Verify the contract on the block explorer:

```bash
npm run verify -- --network u2uTestnet
```

### 6. Interact with Contract

Query contract information:

```bash
npm run interact -- --network u2uTestnet
```

## Project Structure

```
contract/
├── contracts/          # Solidity smart contracts
├── scripts/           # Deployment and interaction scripts
│   ├── deploy.js     # Main deployment script
│   ├── initialize.js # Contract initialization
│   ├── verify.js     # Contract verification
│   └── interact.js   # Contract interaction utilities
├── test/             # Contract tests
├── hardhat.config.js # Hardhat configuration
├── .env.example      # Example environment variables
└── package.json      # Dependencies and scripts
```

## Useful Commands

```bash
# Clean build artifacts
npm run clean

# Start local Hardhat node
npm run node

# Deploy to local node
npm run deploy:local

# Run tests with gas reporting
REPORT_GAS=true npm test

# Compile contracts
npm run compile
```

## Security Notes

⚠️ **IMPORTANT**: Never commit your `.env` file or expose your private keys!

- Keep your `DEPLOYER_PRIVATE_KEY` secure
- Use separate wallets for deployment and server operations
- Test thoroughly on testnets before mainnet deployment
- Consider using a hardware wallet or secure key management system for production

## Network-Specific Notes

### U2U Network
- Native token: U2U
- Block explorer: https://u2uscan.xyz
- Testnet faucet: Check U2U documentation

### Celo
- Native token: CELO
- Block explorer: https://explorer.celo.org
- Testnet faucet: https://faucet.celo.org

## Troubleshooting

### "Insufficient funds" error
Ensure your deployer wallet has enough native tokens for gas fees.

### "Nonce too high" error
Reset your account nonce:
```bash
npx hardhat clean
```

### Contract verification fails
- Ensure the contract is deployed and confirmed
- Check that the network configuration matches the deployment
- Verify the block explorer API key is correct

## Next Steps

After setting up the infrastructure:
1. Implement the Pepasur.sol contract (Task 2)
2. Write comprehensive tests (Task 2.6)
3. Deploy to testnets for testing
4. Deploy to mainnets after thorough testing

## Support

For issues or questions:
- Check the Hardhat documentation: https://hardhat.org/docs
- Review the OpenZeppelin contracts: https://docs.openzeppelin.com/contracts
- Consult network-specific documentation for U2U and Celo
