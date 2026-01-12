const { ethers } = require('ethers');

/**
 * EVMGameTransactions - Handles all game-related transactions
 * @param {Object} evmService - Reference to the EVMService instance
 */
module.exports = function (evmService) {
    return {
        /**
         * Create a new game on-chain
         * @param {string|number} stakeAmount - Stake amount in native token (e.g., "0.1" for 0.1 ETH)
         * @param {number} minPlayers - Minimum number of players required
         * @returns {Promise<number>} Game ID
         */
        async createGame(stakeAmount, minPlayers) {
            try {
                console.log(`🎮 Creating game with stake: ${stakeAmount}, minPlayers: ${minPlayers}`);

                const contract = evmService.getContract();

                // Convert stake amount to Wei
                const stakeAmountWei = ethers.parseEther(stakeAmount.toString());

                // Build and send transaction
                const tx = await contract.createGame(stakeAmountWei, minPlayers);
                console.log(`📤 Transaction sent: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

                // Extract game ID from receipt
                const gameId = evmService.extractGameIdFromReceipt(receipt);

                if (gameId === null) {
                    throw new Error('Failed to extract game ID from transaction receipt');
                }

                console.log(`🎲 Game created with ID: ${gameId}`);
                return gameId;
            } catch (error) {
                console.error('❌ Error creating game:', error);
                throw error;
            }
        },

        /**
         * Join a game (Note: This is typically called from frontend, but included for server operations)
         * @param {number} gameId - Game ID to join
         * @param {string} playerAddress - Player's wallet address
         * @returns {Promise<string>} Transaction hash
         */
        async joinGame(gameId, playerAddress) {
            try {
                console.log(`👤 Server joining game ${gameId} for player ${playerAddress}`);

                const contract = evmService.getContract();

                // Get game info to determine stake amount
                const gameInfo = await evmService.getGameInfo(gameId);
                const stakeAmount = gameInfo.stakeAmount;

                // Build and send transaction with value
                const tx = await contract.joinGame(gameId, { value: stakeAmount });
                console.log(`📤 Transaction sent: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

                return tx.hash;
            } catch (error) {
                console.error('❌ Error joining game:', error);
                throw error;
            }
        },

        /**
         * Settle a game with server-signed winner payouts
         * @param {number} gameId - Game ID to settle
         * @param {string[]} winners - Array of winner addresses
         * @param {BigInt[]} payoutAmounts - Array of payout amounts in Wei (already BigInt)
         * @returns {Promise<string>} Transaction hash
         */
        async settleGame(gameId, winners, payoutAmounts) {
            try {
                console.log(`🏆 Settling game ${gameId} with ${winners.length} winners`);

                const contract = evmService.getContract();

                // payoutAmounts are ALREADY in Wei (BigInt) - just ensure they're BigInt
                const payoutsWei = payoutAmounts.map(amount => BigInt(amount));

                console.log(`💰 Payout amounts (Wei):`, payoutsWei.map(p => p.toString()));

                // Generate signature
                const signature = await evmService.signSettlement(gameId, winners, payoutsWei);
                console.log(`🔏 Settlement signature generated`);

                // Build and send transaction
                const tx = await contract.settleGame(gameId, winners, payoutsWei, signature);
                console.log(`📤 Transaction sent: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`✅ Game settled in block ${receipt.blockNumber}`);

                return tx.hash;
            } catch (error) {
                console.error('❌ Error settling game:', error);
                throw error;
            }
        },

        /**
         * Withdraw pending balance (server operation)
         * @returns {Promise<string>} Transaction hash
         */
        async withdraw() {
            try {
                console.log('💰 Withdrawing pending balance...');

                const contract = evmService.getContract();
                const serverWallet = evmService.getServerWallet();

                // Check pending withdrawal first
                const pendingAmount = await evmService.getPendingWithdrawal(serverWallet.address);

                if (pendingAmount === '0' || pendingAmount === 0n) {
                    console.log('ℹ️ No pending withdrawal available');
                    return null;
                }

                console.log(`💵 Pending withdrawal: ${ethers.formatEther(pendingAmount)} tokens`);

                // Build and send transaction
                const tx = await contract.withdraw();
                console.log(`📤 Transaction sent: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`✅ Withdrawal confirmed in block ${receipt.blockNumber}`);

                return tx.hash;
            } catch (error) {
                console.error('❌ Error withdrawing funds:', error);
                throw error;
            }
        },

        /**
         * Cancel a game in lobby state
         * @param {number} gameId - Game ID to cancel
         * @returns {Promise<string>} Transaction hash
         */
        async cancelGame(gameId) {
            try {
                console.log(`🚫 Cancelling game ${gameId}...`);

                const contract = evmService.getContract();

                // Build and send transaction
                const tx = await contract.cancelGame(gameId);
                console.log(`📤 Transaction sent: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`✅ Game cancelled in block ${receipt.blockNumber}`);

                return tx.hash;
            } catch (error) {
                console.error('❌ Error cancelling game:', error);
                throw error;
            }
        },

        /**
         * Send native token from server account to recipient (faucet functionality)
         * @param {string} recipientAddress - Address to send tokens to
         * @param {string|number} amount - Amount in native token (e.g., "0.1" for 0.1 ETH)
         * @returns {Promise<string>} Transaction hash
         */
        async sendNativeToken(recipientAddress, amount) {
            try {
                console.log(`💸 Sending ${amount} tokens to ${recipientAddress}`);

                const serverWallet = evmService.getServerWallet();

                // Convert amount to Wei
                const amountWei = ethers.parseEther(amount.toString());

                // Build and send transaction
                const tx = await serverWallet.sendTransaction({
                    to: recipientAddress,
                    value: amountWei,
                });
                console.log(`📤 Transaction sent: ${tx.hash}`);

                // Wait for confirmation
                const receipt = await tx.wait();
                console.log(`✅ Transfer confirmed in block ${receipt.blockNumber}`);

                return tx.hash;
            } catch (error) {
                console.error('❌ Error sending native token:', error);
                throw error;
            }
        },
    };
};
