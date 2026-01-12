const StakingManager = require('../staking/StakingManager'); // Assuming StakingManager is needed for stakingService

class GameRewardService {
  constructor(gameManager) {
    this.gameManager = gameManager; // Reference to GameManager for accessing game state
    this.stakingManager = new StakingManager(gameManager); // Assuming StakingManager is needed
  }

  /**
   * Get the blockchain service from GameManager
   * Returns EVMService instance
   */
  getBlockchainService() {
    return this.gameManager.blockchainService;
  }

  /**
   * Check if using EVM service
   */
  isUsingEVM() {
    return this.gameManager.isEVMService === true;
  }

  async handleRewardDistribution(gameId, game) {
    try {
      console.log(`💰 Processing rewards for staked game ${gameId}`);

      // Determine winners and losers
      const winners = game.winners || [];
      const losers = game.players.filter(player => !winners.includes(player));

      console.log(`💰 Winners: ${winners.length}, Losers: ${losers.length}`);

      // Distribute rewards using contract gameId
      const contractGameId = game.onChainGameId;
      console.log(`💰 Game ${gameId} has onChainGameId: ${contractGameId}`);
      if (!contractGameId) {
        console.error('❌ No contract gameId available for reward distribution');
        return game;
      }

      // Check on-chain game status before attempting settlement
      const blockchainService = this.getBlockchainService();

      if (blockchainService && typeof blockchainService.getGameInfo === 'function') {
        try {
          const gameInfo = await blockchainService.getGameInfo(contractGameId);
          console.log(`📊 On-chain game status:`, gameInfo);

          // GameStatus enum: 0 = Lobby, 1 = InProgress, 2 = Settled, 3 = Cancelled
          const status = gameInfo.status;

          if (status === 0) {
            console.error(`❌ Cannot settle game ${contractGameId} - still in LOBBY status on-chain`);
            console.error(`   This means not all players have staked on-chain yet.`);
            console.error(`   Players in backend: ${game.players.length}`);
            console.error(`   Players on-chain: ${gameInfo.players?.length || gameInfo.playerCount || 'unknown'}`);
            return game;
          }

          if (status === 2) {
            console.log(`✅ Game ${contractGameId} already settled on-chain, skipping settlement`);
            return game;
          }

          if (status === 3) {
            console.log(`⚠️ Game ${contractGameId} was cancelled on-chain, skipping settlement`);
            return game;
          }
        } catch (statusError) {
          console.error(`❌ Error checking on-chain game status:`, statusError.message);
          console.error(`   Proceeding with settlement anyway`);
          // Don't return early - proceed with settlement
        }
      } else {
        console.log(`⚠️ Blockchain service not available or getGameInfo not implemented, skipping status check`);
      }

      console.log(`💰 Using contract gameId: ${contractGameId}`);
      console.log(`💰 Winners:`, winners);
      console.log(`💰 Losers:`, losers);
      console.log(`💰 Game roles:`, game.roles);
      console.log(`💰 Eliminated players:`, game.eliminated || []);

      // Check if game exists in staking service
      let stakingGame = this.stakingManager.stakingService.stakedGames.get(contractGameId);
      if (!stakingGame) {
        console.warn(`⚠️ Game ${contractGameId} not found in staking service - attempting recovery`);
        console.log(`💰 Available staked games:`, Array.from(this.stakingManager.stakingService.stakedGames.keys()));

        // RECOVERY: Try to reconstruct the staking game from the main game data
        if (game.stakingRequired && game.stakeAmount) {
          console.log(`🔧 Reconstructing staking data for game ${contractGameId}`);
          console.log(`🔧 game.stakeAmount type: ${typeof game.stakeAmount}, value: ${game.stakeAmount}`);

          // TYPE GUARD: Handle both old Number format and new String format
          let stakeAmountWei;
          if (typeof game.stakeAmount === 'string') {
            // New format: Already in Wei as string
            stakeAmountWei = BigInt(game.stakeAmount);
          } else if (typeof game.stakeAmount === 'number') {
            // Old format: Check if it's in Wei or token units
            if (game.stakeAmount > 1000000) {
              // Likely already in Wei (e.g., 1000000000000000)
              stakeAmountWei = BigInt(Math.floor(game.stakeAmount));
            } else {
              // Small number - might be token units (e.g., 0.001) - ERROR!
              console.error(`❌ stakeAmount is suspiciously small: ${game.stakeAmount}`);
              console.error(`   This might be token units instead of Wei - using as-is but results will be wrong!`);
              stakeAmountWei = BigInt(Math.floor(game.stakeAmount));
            }
          } else {
            stakeAmountWei = BigInt(game.stakeAmount);
          }

          // Calculate total staked based on player count and stake amount
          const totalStaked = BigInt(game.players.length) * stakeAmountWei;

          console.log(`💰 Reconstruction: ${game.players.length} players × ${stakeAmountWei.toString()} Wei = ${totalStaked.toString()} Wei`);

          // Register the game in staking service
          this.stakingManager.stakingService.stakedGames.set(contractGameId, {
            roomCode: game.roomCode,
            players: game.players,
            totalStaked: totalStaked,
            status: 'active',
            createdAt: game.createdAt || Date.now()
          });

          // Also reconstruct individual player stakes
          game.players.forEach(playerAddress => {
            const stakeKey = `${contractGameId}-${playerAddress}`;
            if (!this.stakingManager.stakingService.playerStakes.has(stakeKey)) {
              this.stakingManager.stakingService.playerStakes.set(stakeKey, {
                gameId: contractGameId,
                playerAddress: playerAddress,
                amount: stakeAmountWei,
                txHash: 'reconstructed',
                timestamp: Date.now(),
                status: 'staked'
              });
            }
          });

          stakingGame = this.stakingManager.stakingService.stakedGames.get(contractGameId);
          console.log(`✅ Successfully reconstructed staking data with ${game.players.length} player stakes`);
        } else {
          console.error(`❌ Cannot reconstruct - game not configured for staking`);
          console.error(`   Skipping reward calculation and distribution`);
          return game; // Skip rewards but don't crash
        }
      }

      // Calculate rewards using contract gameId
      const rewards = this.stakingManager.stakingService.calculateRewards(contractGameId, winners, losers, game.roles, game.eliminated || []);
      console.log(`💰 Rewards calculated:`, rewards);

      // Reuse blockchain service from earlier in the function
      const distributionResult = await this.stakingManager.stakingService.distributeRewards(
        contractGameId,
        rewards,
        blockchainService
      );

      console.log(`💰 Rewards distributed for game ${gameId}:`, distributionResult);

      // Store reward info in game
      game.rewards = distributionResult;
      console.log(`✅ Stored rewards on game object. game.rewards is now:`, game.rewards ? 'SET' : 'UNDEFINED');

    } catch (error) {
      console.error('❌ Error distributing rewards:', error);
      // Don't throw error - game should still end even if rewards fail
    }
  }
}

module.exports = GameRewardService;
