const { ethers } = require('ethers');

/**
 * EVMSignatureUtils - Handles signature generation and utility functions
 * @param {Object} evmService - Reference to the EVMService instance
 */
module.exports = function (evmService) {
  return {
    /**
     * Construct settlement message for signature verification
     * This must match the contract's constructSettlementMessage function exactly
     * @param {number} gameId - Game ID
     * @param {string[]} winners - Array of winner addresses
     * @param {string[]|BigInt[]} payouts - Array of payout amounts in Wei
     * @returns {string} Message hash (bytes32)
     */
    constructSettlementMessage(gameId, winners, payouts) {
      try {
        // Convert payouts to BigInt if they're strings
        const payoutsBigInt = payouts.map(p =>
          typeof p === 'string' ? BigInt(p) : p
        );

        // Encode the same way as the contract: keccak256(abi.encodePacked(gameId, winners, payouts))
        // Note: abi.encodePacked is equivalent to solidityPacked in ethers v6
        const messageHash = ethers.solidityPackedKeccak256(
          ['uint64', 'address[]', 'uint256[]'],
          [gameId, winners, payoutsBigInt]
        );

        return messageHash;
      } catch (error) {
        console.error('❌ Error constructing settlement message:', error);
        throw error;
      }
    },

    /**
     * Sign a settlement message with server wallet
     * @param {number} gameId - Game ID
     * @param {string[]} winners - Array of winner addresses
     * @param {string[]|BigInt[]} payouts - Array of payout amounts in Wei
     * @returns {Promise<string>} Signature (hex string)
     */
    async signSettlement(gameId, winners, payouts) {
      try {
        const serverWallet = evmService.getServerWallet();

        // Construct the message hash
        const messageHash = this.constructSettlementMessage(gameId, winners, payouts);

        // Sign the message hash
        // The contract uses toEthSignedMessageHash which adds the Ethereum prefix
        // ethers.signMessage automatically adds this prefix, so we need to sign the raw hash
        const messageHashBytes = ethers.getBytes(messageHash);
        const signature = await serverWallet.signMessage(messageHashBytes);

        console.log(`🔏 Signed settlement for game ${gameId}`);
        console.log(`   Message hash: ${messageHash}`);
        console.log(`   Signature: ${signature}`);

        return signature;
      } catch (error) {
        console.error('❌ Error signing settlement:', error);
        throw error;
      }
    },

    /**
     * Verify a settlement signature (for testing/debugging)
     * @param {number} gameId - Game ID
     * @param {string[]} winners - Array of winner addresses
     * @param {string[]|BigInt[]} payouts - Array of payout amounts in Wei
     * @param {string} signature - Signature to verify
     * @returns {string} Recovered signer address
     */
    verifySettlementSignature(gameId, winners, payouts, signature) {
      try {
        // Construct the message hash
        const messageHash = this.constructSettlementMessage(gameId, winners, payouts);
        const messageHashBytes = ethers.getBytes(messageHash);

        // Recover the signer address
        const recoveredAddress = ethers.verifyMessage(messageHashBytes, signature);

        console.log(`🔍 Signature verification:`);
        console.log(`   Message hash: ${messageHash}`);
        console.log(`   Recovered address: ${recoveredAddress}`);

        return recoveredAddress;
      } catch (error) {
        console.error('❌ Error verifying signature:', error);
        throw error;
      }
    },

    /**
     * Extract game ID from transaction receipt
     * Looks for GameCreated event in the receipt logs
     * @param {Object} receipt - Transaction receipt from ethers.js
     * @returns {number|null} Game ID or null if not found
     */
    extractGameIdFromReceipt(receipt) {
      try {
        if (!receipt || !receipt.logs) {
          console.warn('⚠️ Invalid receipt or no logs found');
          return null;
        }

        const contract = evmService.getContract();

        // Parse logs to find GameCreated event
        for (const log of receipt.logs) {
          try {
            const parsedLog = contract.interface.parseLog({
              topics: log.topics,
              data: log.data,
            });

            // Check if this is a GameCreated event
            if (parsedLog && parsedLog.name === 'GameCreated') {
              const gameId = Number(parsedLog.args.gameId);
              console.log(`🎲 Extracted game ID from receipt: ${gameId}`);
              return gameId;
            }
          } catch (parseError) {
            // Log might not be from our contract, skip it
            continue;
          }
        }

        console.warn('⚠️ GameCreated event not found in receipt');
        return null;
      } catch (error) {
        console.error('❌ Error extracting game ID from receipt:', error);
        return null;
      }
    },
  };
};
