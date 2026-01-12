const { ethers } = require('ethers');

/**
 * EVMClientManager - Manages provider connections for EVM blockchain
 * Handles both HTTP and WebSocket connections with fallback support
 */
class EVMClientManager {
    constructor() {
        this.httpProvider = null;
        this.wsProvider = null;
        this.activeProvider = null;
        this.rpcUrl = null;
        this.wsUrl = null;
        this.initialized = false;
    }

    /**
     * Initialize provider connections
     * @param {string} rpcUrl - HTTP RPC endpoint URL
     * @param {string} wsUrl - WebSocket endpoint URL (optional)
     */
    async initialize(rpcUrl, wsUrl = null) {
        try {
            console.log('🔌 Initializing EVM Client Manager...');

            this.rpcUrl = rpcUrl;
            this.wsUrl = wsUrl;

            // Initialize HTTP provider (primary) with extended timeout
            // Create a custom FetchRequest with longer timeout for slow RPC endpoints
            const fetchRequest = new ethers.FetchRequest(rpcUrl);
            fetchRequest.timeout = 60000; // 60 seconds timeout (default is 12 seconds)
            fetchRequest.retryCount = 3; // Retry up to 3 times

            this.httpProvider = new ethers.JsonRpcProvider(fetchRequest);
            this.activeProvider = this.httpProvider;

            console.log(`✅ HTTP Provider connected: ${rpcUrl} (timeout: 60s, retries: 3)`);

            // Initialize WebSocket provider if URL provided (optional)
            if (wsUrl) {
                try {
                    this.wsProvider = new ethers.WebSocketProvider(wsUrl);
                    console.log(`✅ WebSocket Provider connected: ${wsUrl}`);

                    // Set up WebSocket error handling
                    this.wsProvider.websocket.on('error', (error) => {
                        console.warn('⚠️ WebSocket error, falling back to HTTP:', error.message);
                        this.activeProvider = this.httpProvider;
                    });

                    this.wsProvider.websocket.on('close', () => {
                        console.warn('⚠️ WebSocket closed, using HTTP provider');
                        this.activeProvider = this.httpProvider;
                    });
                } catch (wsError) {
                    console.warn('⚠️ WebSocket connection failed, using HTTP only:', wsError.message);
                }
            }

            // Test connection with timeout
            try {
                const networkPromise = this.activeProvider.getNetwork();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Network query timeout')), 10000)
                );

                const network = await Promise.race([networkPromise, timeoutPromise]);
                console.log(`🌐 Connected to Chain ID: ${network.chainId}`);
            } catch (networkError) {
                console.warn(`⚠️ Network verification failed (${networkError.message}), but provider is connected`);
                console.warn(`⚠️ Proceeding with initialization - RPC endpoint may be slow`);
            }

            this.initialized = true;
            console.log('✅ EVM Client Manager initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize EVM Client Manager:', error);
            throw error;
        }
    }

    /**
     * Get the active provider instance
     * @returns {ethers.Provider} Active provider (HTTP or WebSocket)
     */
    getProvider() {
        if (!this.initialized) {
            throw new Error('EVMClientManager not initialized. Call initialize() first.');
        }
        return this.activeProvider;
    }

    /**
     * Get the HTTP provider instance
     * @returns {ethers.JsonRpcProvider} HTTP provider
     */
    getHttpProvider() {
        return this.httpProvider;
    }

    /**
     * Get the WebSocket provider instance
     * @returns {ethers.WebSocketProvider|null} WebSocket provider or null if not available
     */
    getWsProvider() {
        return this.wsProvider;
    }

    /**
     * Check if WebSocket is available and connected
     * @returns {boolean} True if WebSocket is available
     */
    hasWebSocket() {
        return this.wsProvider !== null && this.wsProvider.websocket.readyState === 1;
    }

    /**
     * Switch to HTTP provider
     */
    useHttpProvider() {
        if (this.httpProvider) {
            this.activeProvider = this.httpProvider;
            console.log('🔄 Switched to HTTP provider');
        }
    }

    /**
     * Switch to WebSocket provider (if available)
     */
    useWsProvider() {
        if (this.wsProvider && this.hasWebSocket()) {
            this.activeProvider = this.wsProvider;
            console.log('🔄 Switched to WebSocket provider');
        } else {
            console.warn('⚠️ WebSocket not available, using HTTP provider');
        }
    }

    /**
     * Close all connections
     */
    async close() {
        console.log('🔌 Closing EVM Client Manager connections...');

        if (this.wsProvider) {
            try {
                await this.wsProvider.destroy();
                console.log('✅ WebSocket provider closed');
            } catch (error) {
                console.warn('⚠️ Error closing WebSocket provider:', error.message);
            }
        }

        if (this.httpProvider) {
            try {
                await this.httpProvider.destroy();
                console.log('✅ HTTP provider closed');
            } catch (error) {
                console.warn('⚠️ Error closing HTTP provider:', error.message);
            }
        }

        this.initialized = false;
    }

    /**
     * Get connection status
     * @returns {Object} Connection status information
     */
    getStatus() {
        return {
            initialized: this.initialized,
            httpConnected: this.httpProvider !== null,
            wsConnected: this.hasWebSocket(),
            activeProvider: this.activeProvider === this.httpProvider ? 'http' : 'websocket',
            rpcUrl: this.rpcUrl,
            wsUrl: this.wsUrl
        };
    }
}

// Export singleton instance
module.exports = new EVMClientManager();
