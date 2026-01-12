const { ethers } = require('ethers');
const evmClientManager = require('./EVMClientManager');
const evmGameTransactions = require('./EVMGameTransactions');
const evmGameQueries = require('./EVMGameQueries');
const evmSignatureUtils = require('./EVMSignatureUtils');

/**
 * EVMService - Main service class for EVM blockchain interactions
 * Handles game creation, settlement, withdrawals, and queries for Pepasur game
 */
class EVMService {
    constructor() {
        this.evmClientManager = evmClientManager;
        this.provider = null;
        this.serverWallet = null;
        this.contract = null;
        this.contractAddress = null;
        this.chainId = null;
        this.networkName = null;
        this.initialized = false;

        // Initialize sub-modules with reference to this service
        this.evmGameTransactions = evmGameTransactions(this);
        this.evmGameQueries = evmGameQueries(this);
        this.evmSignatureUtils = evmSignatureUtils(this);
    }

    /**
     * Initialize the EVM service with network configuration from environment
     * Sets up provider, wallet, and contract instance
     */
    async initialize() {
        try {
            console.log('🔧 Initializing EVMService...');

            // Load configuration from environment
            this.networkName = process.env.NETWORK_NAME || 'unknown';
            this.chainId = parseInt(process.env.CHAIN_ID);
            const rpcUrl = process.env.RPC_URL;
            const wsUrl = process.env.WS_URL;
            const privateKey = process.env.SERVER_PRIVATE_KEY;
            this.contractAddress = process.env.CONTRACT_ADDRESS;

            // Validate required configuration
            if (!rpcUrl) {
                throw new Error('RPC_URL not configured in environment');
            }
            if (!privateKey) {
                throw new Error('SERVER_PRIVATE_KEY not configured in environment');
            }
            if (!this.contractAddress) {
                throw new Error('CONTRACT_ADDRESS not configured in environment');
            }
            if (!this.chainId) {
                throw new Error('CHAIN_ID not configured in environment');
            }

            // Initialize provider through client manager
            await this.evmClientManager.initialize(rpcUrl, wsUrl);
            this.provider = this.evmClientManager.getProvider();

            // Initialize server wallet
            this.serverWallet = new ethers.Wallet(privateKey, this.provider);
            console.log(`🔑 Server wallet address: ${this.serverWallet.address}`);

            // Load contract ABI
            const contractArtifact = require('./PepasurABI.json');
            const contractABI = contractArtifact.abi || contractArtifact;

            // Initialize contract instance
            this.contract = new ethers.Contract(
                this.contractAddress,
                contractABI,
                this.serverWallet
            );

            // Verify connection with timeout
            try {
                const networkPromise = this.provider.getNetwork();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Network query timeout')), 10000)
                );

                const network = await Promise.race([networkPromise, timeoutPromise]);
                console.log(`🌐 Connected to network: ${this.networkName} (Chain ID: ${network.chainId})`);
            } catch (networkError) {
                console.warn(`⚠️ Network verification failed (${networkError.message}), but contract is initialized`);
                console.warn(`⚠️ Expected Chain ID: ${this.chainId}`);
            }

            console.log(`📜 Contract address: ${this.contractAddress}`);

            this.initialized = true;
            console.log('✅ EVMService initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize EVMService:', error);
            throw error;
        }
    }

    /**
     * Check if the service is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Get the provider instance
     */
    getProvider() {
        return this.provider;
    }

    /**
     * Get the server wallet instance
     */
    getServerWallet() {
        return this.serverWallet;
    }

    /**
     * Get the contract instance
     */
    getContract() {
        return this.contract;
    }

    /**
     * Get network configuration
     */
    getNetworkConfig() {
        return {
            networkName: this.networkName,
            chainId: this.chainId,
            contractAddress: this.contractAddress,
        };
    }

    // ============ Proxy methods for EVMGameTransactions ============

    /**
     * Create a new game on-chain
     * @param {string|number} stakeAmount - Stake amount in native token (will be converted to Wei)
     * @param {number} minPlayers - Minimum number of players required
     * @returns {Promise<number>} Game ID
     */
    async createGame(stakeAmount, minPlayers) {
        return this.evmGameTransactions.createGame(stakeAmount, minPlayers);
    }

    /**
     * Note: joinGame is typically called from frontend, but included for completeness
     * @param {number} gameId - Game ID to join
     * @param {string} playerAddress - Player's wallet address
     * @returns {Promise<string>} Transaction hash
     */
    async joinGame(gameId, playerAddress) {
        return this.evmGameTransactions.joinGame(gameId, playerAddress);
    }

    /**
     * Settle a game with server-signed winner payouts
     * @param {number} gameId - Game ID to settle
     * @param {string[]} winners - Array of winner addresses
     * @param {string[]|number[]} payoutAmounts - Array of payout amounts in native token
     * @returns {Promise<string>} Transaction hash
     */
    async settleGame(gameId, winners, payoutAmounts) {
        return this.evmGameTransactions.settleGame(gameId, winners, payoutAmounts);
    }

    /**
     * Withdraw pending balance (server operation)
     * @returns {Promise<string>} Transaction hash
     */
    async withdraw() {
        return this.evmGameTransactions.withdraw();
    }

    /**
     * Cancel a game in lobby state
     * @param {number} gameId - Game ID to cancel
     * @returns {Promise<string>} Transaction hash
     */
    async cancelGame(gameId) {
        return this.evmGameTransactions.cancelGame(gameId);
    }

    // ============ Proxy methods for EVMGameQueries ============

    /**
     * Get complete game information
     * @param {number} gameId - Game ID to query
     * @returns {Promise<Object>} Game information
     */
    async getGameInfo(gameId) {
        return this.evmGameQueries.getGameInfo(gameId);
    }

    /**
     * Get pending withdrawal amount for an address
     * @param {string} address - Address to query
     * @returns {Promise<string>} Pending withdrawal amount in Wei
     */
    async getPendingWithdrawal(address) {
        return this.evmGameQueries.getPendingWithdrawal(address);
    }

    /**
     * Get contract configuration information
     * @returns {Promise<Object>} Contract info
     */
    async getContractInfo() {
        return this.evmGameQueries.getContractInfo();
    }

    /**
     * Get player count for a game
     * @param {number} gameId - Game ID to query
     * @returns {Promise<number>} Number of players
     */
    async getPlayerCount(gameId) {
        return this.evmGameQueries.getPlayerCount(gameId);
    }

    /**
     * Check if an address is a player in a game
     * @param {number} gameId - Game ID to check
     * @param {string} playerAddress - Address to check
     * @returns {Promise<boolean>} True if player is in game
     */
    async isPlayerInGame(gameId, playerAddress) {
        return this.evmGameQueries.isPlayerInGame(gameId, playerAddress);
    }

    // ============ Proxy methods for EVMSignatureUtils ============

    /**
     * Construct settlement message for signature verification
     * @param {number} gameId - Game ID
     * @param {string[]} winners - Array of winner addresses
     * @param {string[]|number[]} payouts - Array of payout amounts
     * @returns {string} Message hash
     */
    constructSettlementMessage(gameId, winners, payouts) {
        return this.evmSignatureUtils.constructSettlementMessage(gameId, winners, payouts);
    }

    /**
     * Sign a settlement message with server wallet
     * @param {number} gameId - Game ID
     * @param {string[]} winners - Array of winner addresses
     * @param {string[]|number[]} payouts - Array of payout amounts
     * @returns {Promise<string>} Signature
     */
    async signSettlement(gameId, winners, payouts) {
        return this.evmSignatureUtils.signSettlement(gameId, winners, payouts);
    }

    /**
     * Extract game ID from transaction receipt
     * @param {Object} receipt - Transaction receipt
     * @returns {number|null} Game ID or null if not found
     */
    extractGameIdFromReceipt(receipt) {
        return this.evmSignatureUtils.extractGameIdFromReceipt(receipt);
    }

    /**
     * Send native token from server account to recipient (faucet functionality)
     * @param {string} recipientAddress - Address to send tokens to
     * @param {string|number} amount - Amount in native token (will be converted to Wei)
     * @returns {Promise<string>} Transaction hash
     */
    async sendNativeToken(recipientAddress, amount) {
        return this.evmGameTransactions.sendNativeToken(recipientAddress, amount);
    }
}

module.exports = EVMService;
