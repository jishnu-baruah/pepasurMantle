# Pepasur Contract Scripts

## Game Testing & Simulation

### Main Script (Recommended)
- **`run-continuous-complete-games-optimized.js`** - Optimized continuous game runner
  - Auto-refunding player wallets
  - Detailed contract transaction metrics
  - Gas usage breakdown by transaction type
  - Usage: `npm run game:continuous:optimized`
  - Args: `--cycles N --delay MS --players N`

## Utility Scripts

### Monitoring
- **`check-nonce.js`** - Check wallet nonce and pending transactions
- **`check-balance.js`** - Check wallet balances
- **`check-stuck-games.js`** - Find games stuck in various states

### Game Management
- **`settle-inprogress-games.js`** - Settle games that are in progress

### Contract Management
- **`deploy.js`** - Deploy the Pepasur contract
- **`initialize.js`** - Initialize contract with server signer and fee recipient
- **`update-config.js`** - Update contract configuration
- **`verify.js`** - Verify contract on block explorer
- **`interact.js`** - Interactive contract testing

## Archive

Old simulation scripts and results have been moved to `../archive/simulation-backup/` for reference.

## Quick Start

Run continuous games with optimized settings:
```bash
npm run game:continuous:optimized
```

Or with custom parameters:
```bash
node scripts/run-continuous-complete-games-optimized.js --cycles 100 --delay 1000 --players 3
```
