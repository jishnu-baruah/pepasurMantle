const EVMService = require('../evm/EVMService');
const FaucetRequest = require('../../models/FaucetRequest');
const { formatTimeRemaining } = require('../../utils/timeFormatter');
const { ethers } = require('ethers');

class FaucetService {
  constructor() {
    this.evmService = new EVMService();
    this.FAUCET_AMOUNT_TOKEN = 0.01; // 0.01 native token per request (ETH/CELO/U2U)
    this.COOLDOWN_HOURS = 24;
  }

  /**
   * Initialize the faucet service
   */
  async initialize() {
    await this.evmService.initialize();
  }

  /**
   * Validate EVM address format
   * @param {string} address
   * @returns {boolean}
   */
  isValidAddress(address) {
    if (!address) return false;
    return ethers.isAddress(address);
  }

  /**
   * Claim faucet tokens for user (server signs transaction)
   * @param {string} userAddress - User's EVM address
   * @returns {Promise<object>} Transaction details
   */
  async claimTokensForUser(userAddress) {
    try {
      console.log(`💰 Processing faucet claim for ${userAddress}`);

      // Validate address
      if (!this.isValidAddress(userAddress)) {
        throw new Error('Invalid EVM address format');
      }

      // Check rate limit
      const eligibility = await FaucetRequest.canRequest(userAddress);

      if (!eligibility.canRequest) {
        const error = new Error('Rate limit exceeded. You can only claim once every 24 hours.');
        error.nextRequestTime = eligibility.nextRequestTime;
        error.timeRemaining = formatTimeRemaining(eligibility.timeRemaining);
        error.statusCode = 429;
        throw error;
      }

      // Send native token using EVMService (server signs)
      const transactionHash = await this.evmService.sendNativeToken(
        userAddress,
        this.FAUCET_AMOUNT_TOKEN
      );

      // Record the request
      const faucetRequest = new FaucetRequest({
        address: userAddress,
        amount: this.FAUCET_AMOUNT_TOKEN,
        transactionHash
      });

      await faucetRequest.save();

      const nextClaimTime = new Date(Date.now() + this.COOLDOWN_HOURS * 60 * 60 * 1000);

      const networkConfig = this.evmService.getNetworkConfig();
      const tokenSymbol = this._getTokenSymbol(networkConfig.networkName);

      console.log(`✅ Faucet claim successful for ${userAddress}`);

      return {
        transactionHash,
        amount: this.FAUCET_AMOUNT_TOKEN,
        amountWei: ethers.parseEther(this.FAUCET_AMOUNT_TOKEN.toString()).toString(),
        recipient: userAddress,
        nextClaimTime,
        message: `Successfully sent ${this.FAUCET_AMOUNT_TOKEN} ${tokenSymbol}`,
        tokenSymbol
      };
    } catch (error) {
      console.error('❌ Error claiming faucet tokens:', error);
      throw error;
    }
  }

  /**
   * Get token symbol based on network name
   * @param {string} networkName
   * @returns {string}
   */
  _getTokenSymbol(networkName) {
    const symbols = {
      'u2u': 'U2U',
      'celo': 'CELO',
      'celo-sepolia': 'CELO'
    };
    return symbols[networkName?.toLowerCase()] || 'ETH';
  }

  /**
   * Get faucet info for a user
   * @param {string} userAddress
   * @returns {Promise<object>}
   */
  async getFaucetInfo(userAddress) {
    try {
      const eligibility = await FaucetRequest.canRequest(userAddress);
      const networkConfig = this.evmService.getNetworkConfig();
      const tokenSymbol = this._getTokenSymbol(networkConfig.networkName);

      return {
        faucetAmount: this.FAUCET_AMOUNT_TOKEN,
        tokenSymbol,
        cooldownHours: this.COOLDOWN_HOURS,
        canClaim: eligibility.canRequest,
        lastClaimTime: eligibility.lastRequestTime,
        nextClaimTime: eligibility.nextRequestTime,
        timeRemaining: formatTimeRemaining(eligibility.timeRemaining)
      };
    } catch (error) {
      console.error('❌ Error getting faucet info:', error);
      throw error;
    }
  }

  /**
   * Get claim countdown for a user
   * @param {string} userAddress
   * @returns {Promise<object>}
   */
  async getClaimCountdown(userAddress) {
    try {
      const eligibility = await FaucetRequest.canRequest(userAddress);

      return {
        canClaim: eligibility.canRequest,
        timeUntilNextClaim: eligibility.timeRemaining || 0
      };
    } catch (error) {
      console.error('❌ Error getting claim countdown:', error);
      throw error;
    }
  }



  /**
   * Get faucet statistics
   * @returns {Promise<object>}
   */
  async getFaucetStats() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [totalRequests, last24Hours, last7Days, totalDistributed] = await Promise.all([
        FaucetRequest.countDocuments(),
        FaucetRequest.countDocuments({ requestedAt: { $gte: oneDayAgo } }),
        FaucetRequest.countDocuments({ requestedAt: { $gte: oneWeekAgo } }),
        FaucetRequest.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ])
      ]);

      const networkConfig = this.evmService.getNetworkConfig();
      const tokenSymbol = this._getTokenSymbol(networkConfig.networkName);

      return {
        totalRequests,
        last24Hours,
        last7Days,
        totalDistributed: totalDistributed[0]?.total || 0,
        faucetAmount: this.FAUCET_AMOUNT_TOKEN,
        tokenSymbol,
        cooldownHours: this.COOLDOWN_HOURS
      };
    } catch (error) {
      console.error('❌ Error getting faucet stats:', error);
      throw error;
    }
  }

  /**
   * Get server wallet info
   * @returns {Promise<object>}
   */
  async getServerWalletInfo() {
    try {
      const serverWallet = this.evmService.getServerWallet();

      if (!serverWallet) {
        return {
          address: null,
          balance: null,
          status: 'Not initialized'
        };
      }

      const address = serverWallet.address;
      const networkConfig = this.evmService.getNetworkConfig();
      const tokenSymbol = this._getTokenSymbol(networkConfig.networkName);

      // Get account balance
      let balance = null;
      let balanceFormatted = null;
      try {
        const provider = this.evmService.getProvider();
        const balanceWei = await provider.getBalance(address);
        balanceFormatted = ethers.formatEther(balanceWei);
        balance = parseFloat(balanceFormatted);
      } catch (balanceError) {
        console.warn('Could not fetch server balance:', balanceError.message);
      }

      return {
        address,
        balance,
        balanceFormatted,
        tokenSymbol,
        network: networkConfig.networkName,
        chainId: networkConfig.chainId,
        status: 'Active'
      };
    } catch (error) {
      console.error('❌ Error getting server wallet info:', error);
      return {
        address: null,
        balance: null,
        status: 'Error: ' + error.message
      };
    }
  }

  /**
   * Get service status
   * @returns {object}
   */
  getServiceStatus() {
    const networkConfig = this.evmService.getNetworkConfig();
    const tokenSymbol = this._getTokenSymbol(networkConfig.networkName);

    return {
      initialized: this.evmService.isInitialized(),
      faucetAmount: this.FAUCET_AMOUNT_TOKEN,
      tokenSymbol,
      cooldownHours: this.COOLDOWN_HOURS,
      network: networkConfig.networkName,
      chainId: networkConfig.chainId
    };
  }
}

module.exports = FaucetService;
