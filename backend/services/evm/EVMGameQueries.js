const { ethers } = require('ethers');

/**
 * EVMGameQueries - Handles all game-related queries
 * @param {Object} evmService - Reference to the EVMService instance
 */
module.exports = function (evmService) {
    return {
        /**
         * Get complete game information
         * @param {number} gameId - Game ID to query
         * @returns {Promise<Object>} Game information
         */
        async getGameInfo(gameId) {
            try {
                const contract = evmService.getContract();

                // Call getGame function
                const game = await contract.getGame(gameId);

                // Parse and format the game data
                const gameInfo = {
                    id: Number(game.id),
                    creator: game.creator,
                    stakeAmount: game.stakeAmount.toString(),
                    stakeAmountFormatted: ethers.formatEther(game.stakeAmount),
                    minPlayers: Number(game.minPlayers),
                    players: game.players,
                    deposits: game.deposits.map(d => d.toString()),
                    status: Number(game.status), // 0: Lobby, 1: InProgress, 2: Settled, 3: Cancelled
                    statusName: this.getStatusName(Number(game.status)),
                    totalPool: game.totalPool.toString(),
                    totalPoolFormatted: ethers.formatEther(game.totalPool),
                    createdAt: Number(game.createdAt),
                    playerCount: game.players.length,
                };

                return gameInfo;
            } catch (error) {
                console.error(`❌ Error getting game info for game ${gameId}:`, error);
                throw error;
            }
        },

        /**
         * Get pending withdrawal amount for an address
         * @param {string} address - Address to query
         * @returns {Promise<string>} Pending withdrawal amount in Wei
         */
        async getPendingWithdrawal(address) {
            try {
                const contract = evmService.getContract();

                // Call getPendingWithdrawal function
                const amount = await contract.getPendingWithdrawal(address);

                return amount.toString();
            } catch (error) {
                console.error(`❌ Error getting pending withdrawal for ${address}:`, error);
                throw error;
            }
        },

        /**
         * Get contract configuration information
         * @returns {Promise<Object>} Contract info
         */
        async getContractInfo() {
            try {
                const contract = evmService.getContract();

                // Call getContractInfo function
                const info = await contract.getContractInfo();

                const contractInfo = {
                    admin: info._admin,
                    serverSigner: info._serverSigner,
                    feeRecipient: info._feeRecipient,
                    houseCutBps: Number(info._houseCutBps),
                    houseCutPercentage: Number(info._houseCutBps) / 100, // Convert basis points to percentage
                    nextGameId: Number(info._nextGameId),
                };

                return contractInfo;
            } catch (error) {
                console.error('❌ Error getting contract info:', error);
                throw error;
            }
        },

        /**
         * Get player count for a game
         * @param {number} gameId - Game ID to query
         * @returns {Promise<number>} Number of players
         */
        async getPlayerCount(gameId) {
            try {
                const contract = evmService.getContract();

                // Call getPlayerCount function
                const count = await contract.getPlayerCount(gameId);

                return Number(count);
            } catch (error) {
                console.error(`❌ Error getting player count for game ${gameId}:`, error);
                throw error;
            }
        },

        /**
         * Check if an address is a player in a game
         * @param {number} gameId - Game ID to check
         * @param {string} playerAddress - Address to check
         * @returns {Promise<boolean>} True if player is in game
         */
        async isPlayerInGame(gameId, playerAddress) {
            try {
                const contract = evmService.getContract();

                // Call isPlayerInGame function
                const isPlayer = await contract.isPlayerInGame(gameId, playerAddress);

                return isPlayer;
            } catch (error) {
                console.error(`❌ Error checking if ${playerAddress} is in game ${gameId}:`, error);
                throw error;
            }
        },

        /**
         * Get the list of players in a game
         * @param {number} gameId - Game ID to query
         * @returns {Promise<string[]>} Array of player addresses
         */
        async getGamePlayers(gameId) {
            try {
                const gameInfo = await this.getGameInfo(gameId);
                return gameInfo.players;
            } catch (error) {
                console.error(`❌ Error getting players for game ${gameId}:`, error);
                throw error;
            }
        },

        /**
         * Get status name from status code
         * @param {number} status - Status code
         * @returns {string} Status name
         */
        getStatusName(status) {
            const statusNames = ['Lobby', 'InProgress', 'Settled', 'Cancelled'];
            return statusNames[status] || 'Unknown';
        },

        /**
         * Parse transaction receipt for events
         * @param {Object} receipt - Transaction receipt
         * @returns {Array} Parsed events
         */
        parseReceiptEvents(receipt) {
            try {
                const contract = evmService.getContract();
                const events = [];

                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contract.interface.parseLog({
                            topics: log.topics,
                            data: log.data,
                        });

                        if (parsedLog) {
                            events.push({
                                name: parsedLog.name,
                                args: parsedLog.args,
                                signature: parsedLog.signature,
                            });
                        }
                    } catch (e) {
                        // Skip logs that don't match our contract interface
                        continue;
                    }
                }

                return events;
            } catch (error) {
                console.error('❌ Error parsing receipt events:', error);
                return [];
            }
        },
    };
};
