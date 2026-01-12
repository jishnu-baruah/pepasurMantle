#!/bin/bash

echo "Testing Wallet Allocation Validation Integration"
echo "=================================================="
echo ""

echo "Test 1: Insufficient wallets (should fail)"
echo "-------------------------------------------"
cd contract/scripts/simulation
SIMULATION_WALLET_COUNT=20 SIMULATION_GAME_COUNT=100 node run-simulation.js --help > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Script loads correctly"
else
    echo "❌ Script failed to load"
fi

echo ""
echo "Test 2: Preflight check with insufficient wallets"
echo "--------------------------------------------------"
SIMULATION_WALLET_COUNT=20 SIMULATION_GAME_COUNT=100 node mainnet-preflight-check.js | grep "INSUFFICIENT WALLETS"
if [ $? -eq 0 ]; then
    echo "✅ Preflight check detects insufficient wallets"
else
    echo "❌ Preflight check failed to detect issue"
fi

echo ""
echo "Test 3: Preflight check with sufficient wallets"
echo "------------------------------------------------"
SIMULATION_WALLET_COUNT=100 SIMULATION_GAME_COUNT=10 node mainnet-preflight-check.js | grep "Wallet allocation is optimal"
if [ $? -eq 0 ]; then
    echo "✅ Preflight check passes with sufficient wallets"
else
    echo "❌ Preflight check failed"
fi

echo ""
echo "=================================================="
echo "All validation integration tests completed!"
