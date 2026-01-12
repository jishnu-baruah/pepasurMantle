const crypto = require('crypto');
const { ethers } = require('ethers');

class StakingService {
  constructor() {
    // Note: Stake amounts are now determined per-game, not hardcoded
    // These legacy values are kept for backward compatibility only
    this.minPlayers = 4;
    this.stakedGames = new Map(); // Track staked games - stores Wei as BigInt
    this.playerStakes = new Map(); // Track individual player stakes - stores Wei as BigInt
    console.log('💰 Staking service initialized successfully');
    console.log('💰 Stake amounts are configured per-game (stored in Wei as BigInt)');
  }

  async checkBalance(playerAddress) {
    // Balance checking is now handled by the wallet on the frontend
    // This method is kept for backward compatibility but returns mock data
    console.log('⚠️ Balance checking should be done on frontend with wallet integration');
    return {
      balance: "1000000000000000000", // 1 token (18 decimals)
      balanceInToken: "1.0",
      sufficient: true,
      mock: true
    };
  }

  async stakeForGame(gameId, playerAddress, roomCode) {
    // DEPRECATED: This method is no longer used in the EVM flow
    // Stakes are now recorded via StakingManager.recordPlayerStake() after on-chain verification
    console.warn('⚠️ stakeForGame() is deprecated - use StakingManager.recordPlayerStake() instead');
    throw new Error('stakeForGame() is deprecated - stakes must be recorded after on-chain verification');
  }

  getGameStakingInfo(gameId) {
    const game = this.stakedGames.get(gameId);
    if (!game) {
      return null;
    }

    // TYPE GUARD: Handle totalStaked as BigInt or Number
    let totalStakedStr, totalStakedInToken;
    if (typeof game.totalStaked === 'bigint') {
      totalStakedStr = game.totalStaked.toString();
      totalStakedInToken = ethers.formatEther(game.totalStaked);
    } else if (typeof game.totalStaked === 'number') {
      totalStakedStr = game.totalStaked.toString();
      totalStakedInToken = (game.totalStaked / 1e18).toString();
    } else {
      // String - try to convert
      totalStakedStr = game.totalStaked;
      try {
        totalStakedInToken = ethers.formatEther(game.totalStaked);
      } catch (e) {
        totalStakedInToken = '0';
      }
    }

    return {
      gameId: gameId,
      roomCode: game.roomCode,
      players: game.players,
      playersCount: game.players.length,
      minPlayers: this.minPlayers,
      totalStaked: totalStakedStr,
      totalStakedInToken: totalStakedInToken,
      status: game.status,
      createdAt: game.createdAt,
      isReady: game.players.length === this.minPlayers
    };
  }

  // Get player's stake info
  getPlayerStakeInfo(gameId, playerAddress) {
    const stakeKey = `${gameId}-${playerAddress}`;
    const stake = this.playerStakes.get(stakeKey);

    if (!stake) {
      return null;
    }

    return {
      gameId: stake.gameId,
      playerAddress: stake.playerAddress,
      amount: stake.amount.toString(),
      txHash: stake.txHash,
      timestamp: stake.timestamp,
      status: stake.status
    };
  }

  calculateRewards(gameId, winners, losers, gameRoles, eliminatedPlayers) {
    try {
      const game = this.stakedGames.get(gameId);
      if (!game) {
        console.error(`❌ Game ${gameId} not found in stakedGames`);
        console.error(`   Available games:`, Array.from(this.stakedGames.keys()));
        throw new Error(`Game not found in staking service (gameId: ${gameId})`);
      }

      // Debug logging
      console.log(`💰 calculateRewards - gameId: ${gameId}`);
      console.log(`💰 game.totalStaked type: ${typeof game.totalStaked}, value: ${game.totalStaked}`);
      console.log(`💰 game.players.length: ${game.players.length}`);
      console.log(`💰 game.players:`, game.players);

      // Use BigInt for all calculations to handle Wei amounts
      const totalPool = BigInt(game.totalStaked);
      console.log(`💰 totalPool (as BigInt): ${totalPool.toString()}`);

      const houseCutBps = 200n; // 2%
      const houseCut = (totalPool * houseCutBps) / 10000n;
      const rewardPool = totalPool - houseCut;
      console.log(`💰 rewardPool (after 2% cut): ${rewardPool.toString()}`);

      // Calculate actual stake per player from the total pool
      const playerCount = BigInt(game.players.length);
      const stakePerPlayer = playerCount > 0n ? totalPool / playerCount : 0n;

      const rewards = [];
      const mafiaWon = winners.some((player) => gameRoles[player] === 'Mafia');

      if (mafiaWon) {
        const mafiaPlayers = winners.filter((player) => gameRoles[player] === 'Mafia');
        const mafiaCount = BigInt(mafiaPlayers.length);
        const mafiaRewardPerPlayer = mafiaCount > 0n ? rewardPool / mafiaCount : 0n;

        // Calculate remainder from integer division to avoid PayoutMismatch
        const remainder = mafiaCount > 0n ? rewardPool % mafiaCount : 0n;

        mafiaPlayers.forEach((playerAddress, index) => {
          // Give remainder to the last winner to ensure exact total
          const isLastWinner = index === mafiaPlayers.length - 1;
          const reward = isLastWinner ? mafiaRewardPerPlayer + remainder : mafiaRewardPerPlayer;

          rewards.push({
            playerAddress: playerAddress,
            role: 'ASUR',
            stakeAmount: stakePerPlayer.toString(),
            rewardAmount: reward.toString(),
            totalReceived: reward.toString(), // Winner only gets reward, not stake back
          });
        });

        losers.forEach((playerAddress) => {
          rewards.push({
            playerAddress: playerAddress,
            role: gameRoles[playerAddress] === 'Doctor' ? 'DEVA' : gameRoles[playerAddress] === 'Detective' ? 'RISHI' : 'MANAV',
            stakeAmount: stakePerPlayer.toString(),
            rewardAmount: '0',
            totalReceived: '0',
          });
        });
      } else {
        const allPlayers = Object.keys(gameRoles);
        const nonMafiaPlayers = allPlayers.filter((player) => gameRoles[player] !== 'Mafia');
        const nonMafiaCount = BigInt(nonMafiaPlayers.length);
        const nonMafiaRewardPerPlayer = nonMafiaCount > 0n ? rewardPool / nonMafiaCount : 0n;

        // Calculate remainder from integer division to avoid PayoutMismatch
        const remainder = nonMafiaCount > 0n ? rewardPool % nonMafiaCount : 0n;

        nonMafiaPlayers.forEach((playerAddress, index) => {
          // Give remainder to the last winner to ensure exact total
          const isLastWinner = index === nonMafiaPlayers.length - 1;
          const reward = isLastWinner ? nonMafiaRewardPerPlayer + remainder : nonMafiaRewardPerPlayer;

          rewards.push({
            playerAddress: playerAddress,
            role: gameRoles[playerAddress] === 'Doctor' ? 'DEVA' : gameRoles[playerAddress] === 'Detective' ? 'RISHI' : 'MANAV',
            stakeAmount: stakePerPlayer.toString(),
            rewardAmount: reward.toString(),
            totalReceived: reward.toString(), // Winner only gets reward, not stake back
          });
        });

        losers.forEach((playerAddress) => {
          if (gameRoles[playerAddress] === 'Mafia') {
            rewards.push({
              playerAddress: playerAddress,
              role: 'ASUR',
              stakeAmount: stakePerPlayer.toString(),
              rewardAmount: '0',
              totalReceived: '0',
            });
          }
        });
      }

      return {
        gameId: gameId,
        totalPool: totalPool.toString(),
        houseCut: houseCut.toString(),
        rewardPool: rewardPool.toString(),
        rewards: rewards,
      };
    } catch (error) {
      console.error('❌ Error calculating rewards:', error);
      throw error;
    }
  }

  async distributeRewards(gameId, rewards, blockchainService = null) {
    try {
      // IMPORTANT: Filter out players with 0 payouts - only actual winners go to settlement
      const actualWinners = rewards.rewards.filter((r) => BigInt(r.totalReceived) > 0n);

      // Use provided blockchain service (EVMService)
      let txHash;
      const winners = actualWinners.map((r) => r.playerAddress);
      const payoutAmounts = actualWinners.map((r) => BigInt(r.totalReceived));

      // Debug logging
      console.log(`💰 distributeRewards - Summary:`);
      console.log(`   Game ID: ${gameId}`);
      console.log(`   Total Pool: ${rewards.totalPool}`);
      console.log(`   Reward Pool: ${rewards.rewardPool}`);
      console.log(`   Total players: ${rewards.rewards.length} (filtered to ${winners.length} actual winners)`);
      console.log(`   Winners count: ${winners.length}`);
      console.log(`   Payout amounts:`, payoutAmounts.map(p => p.toString()));
      actualWinners.forEach((r, i) => {
        console.log(`   Winner ${i+1}: ${r.playerAddress} gets ${r.totalReceived} Wei (${r.role})`);
      });

      if (blockchainService) {
        // Use the provided blockchain service (EVMService)
        console.log(`💰 Using provided blockchain service for settlement`);

        // Check if it's EVMService (has settleGame)
        if (typeof blockchainService.settleGame === 'function') {
          // EVMService - uses ECDSA signatures
          console.log(`💰 Settling game ${gameId} with EVMService using ECDSA signatures`);
          txHash = await blockchainService.settleGame(gameId, winners, payoutAmounts);
        } else {
          throw new Error('Blockchain service does not support settlement operations');
        }
      } else {
        throw new Error('No blockchain service provided for settlement');
      }

      const game = this.stakedGames.get(gameId);
      if (game) {
        game.status = 'completed';
        game.completedAt = Date.now();
      }

      // Use EVM token decimals (18)
      const decimals = 1e18;
      const tokenSymbol = process.env.NATIVE_TOKEN_SYMBOL || 'ETH';

      // Format distributions for frontend with proper decimal conversion
      const distributions = rewards.rewards.map((r) => ({
        playerAddress: r.playerAddress,
        role: r.role,
        stakeAmount: r.stakeAmount,
        rewardAmount: r.rewardAmount,
        totalReceived: r.totalReceived,
        // Add token-formatted values for display
        stakeAmountInToken: (parseInt(r.stakeAmount) / decimals).toFixed(4),
        rewardInToken: (parseInt(r.rewardAmount) / decimals).toFixed(4),
        totalReceivedInToken: (parseInt(r.totalReceived) / decimals).toFixed(4),
        tokenSymbol: tokenSymbol,
      }));

      return {
        success: true,
        gameId: gameId,
        settlementTxHash: txHash,
        distributions: distributions, // Include detailed breakdown for frontend
        totalPool: rewards.totalPool,
        houseCut: rewards.houseCut,
        rewardPool: rewards.rewardPool,
      };
    } catch (error) {
      console.error('❌ Error distributing rewards:', error);
      throw error;
    }
  }

  // Validate room code format
  validateRoomCode(roomCode) {
    // Room code should be 6 characters, alphanumeric
    return /^[A-Z0-9]{6}$/.test(roomCode);
  }

  // Get all staked games
  getAllStakedGames() {
    const games = [];
    for (const [gameId, game] of this.stakedGames) {
      games.push({
        gameId: gameId,
        roomCode: game.roomCode,
        players: game.players,
        playersCount: game.players.length,
        minPlayers: this.minPlayers,
        totalStaked: game.totalStaked.toString(),
        status: game.status,
        createdAt: game.createdAt,
        isReady: game.players.length === this.minPlayers
      });
    }
    return games;
  }

  // Clean up completed games (optional)
  cleanupCompletedGames() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours

    for (const [gameId, game] of this.stakedGames) {
      if (game.status === 'completed' && (now - game.completedAt) > oneDayMs) {
        this.stakedGames.delete(gameId);
        console.log(`🧹 Cleaned up completed game ${gameId}`);
      }
    }
  }
}

module.exports = StakingService;
