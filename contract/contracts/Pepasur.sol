// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Pepasur
 * @notice On-chain Mafia game with staking, server-signed settlements, and secure withdrawals
 * @dev Implements game creation, joining, settlement with ECDSA verification, and withdrawal patterns
 */
contract Pepasur is ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Enums ============

    enum GameStatus {
        Lobby,
        InProgress,
        Settled,
        Cancelled
    }

    // ============ Structs ============

    struct Game {
        uint64 id;
        address creator;
        uint256 stakeAmount;
        uint8 minPlayers;
        address[] players;
        uint256[] deposits;
        GameStatus status;
        uint256 totalPool;
        uint256 createdAt;
    }

    // ============ State Variables ============

    mapping(uint64 => Game) public games;
    uint64 public nextGameId;
    address public admin;
    address public serverSigner;
    address public feeRecipient;
    uint16 public houseCutBps; // basis points (200 = 2%)
    mapping(address => uint256) public pendingWithdrawals;

    // ============ Events ============

    event GameCreated(uint64 indexed gameId, address indexed creator, uint256 stake, uint8 minPlayers);
    event PlayerJoined(uint64 indexed gameId, address indexed player, uint256 deposit);
    event GameStarted(uint64 indexed gameId, uint256 playerCount);
    event GameSettled(uint64 indexed gameId, address[] winners, uint256[] payouts, uint256 houseFee);
    event Withdrawn(address indexed player, uint256 amount);
    event GameCancelled(uint64 indexed gameId, address[] refundedPlayers);
    event ServerSignerUpdated(address indexed oldSigner, address indexed newSigner);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);
    event HouseCutUpdated(uint16 oldCut, uint16 newCut);

    // ============ Errors ============

    error GameNotFound(uint64 gameId);
    error GameNotInLobby(uint64 gameId);
    error InvalidStakeAmount(uint256 provided, uint256 required);
    error GameAlreadySettled(uint64 gameId);
    error NotAuthorized(address caller);
    error InvalidSignature();
    error GameNotInProgress(uint64 gameId);
    error NoPendingWithdrawal(address player);
    error GameAlreadyStarted(uint64 gameId);
    error MinPlayersNotMet(uint8 current, uint8 required);
    error InsufficientPayment(uint256 provided, uint256 required);
    error AlreadyInitialized();
    error InvalidAddress();
    error InvalidHouseCut(uint16 provided);
    error InvalidMinPlayers(uint8 provided);
    error PayoutMismatch(uint256 totalPayouts, uint256 expectedAmount);
    error WinnerCountMismatch(uint256 winnersLength, uint256 payoutsLength);

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAuthorized(msg.sender);
        _;
    }

    modifier gameExists(uint64 gameId) {
        if (games[gameId].id == 0) revert GameNotFound(gameId);
        _;
    }

    // ============ Constructor ============

    constructor() {
        admin = msg.sender;
        nextGameId = 1;
        houseCutBps = 200; // Default 2%
    }

    // ============ Game Creation and Joining Functions ============

    /**
     * @notice Create a new game with specified stake amount and minimum players
     * @param stakeAmount The amount each player must stake to join (in wei)
     * @param minPlayers Minimum number of players required to start the game
     * @return gameId The ID of the newly created game
     */
    function createGame(uint256 stakeAmount, uint8 minPlayers) external returns (uint64 gameId) {
        if (minPlayers < 2) revert InvalidMinPlayers(minPlayers);
        if (stakeAmount == 0) revert InvalidStakeAmount(0, 1);

        gameId = nextGameId++;

        Game storage game = games[gameId];
        game.id = gameId;
        game.creator = msg.sender;
        game.stakeAmount = stakeAmount;
        game.minPlayers = minPlayers;
        game.status = GameStatus.Lobby;
        game.totalPool = 0;
        game.createdAt = block.timestamp;

        emit GameCreated(gameId, msg.sender, stakeAmount, minPlayers);
    }

    /**
     * @notice Join an existing game by staking the required amount
     * @param gameId The ID of the game to join
     */
    function joinGame(uint64 gameId) external payable gameExists(gameId) {
        Game storage game = games[gameId];

        if (game.status != GameStatus.Lobby) revert GameNotInLobby(gameId);
        if (msg.value != game.stakeAmount) revert InvalidStakeAmount(msg.value, game.stakeAmount);

        // Check if player already joined
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == msg.sender) revert NotAuthorized(msg.sender);
        }

        game.players.push(msg.sender);
        game.deposits.push(msg.value);
        game.totalPool += msg.value;

        emit PlayerJoined(gameId, msg.sender, msg.value);

        // Automatically start game when minimum players reached
        if (game.players.length >= game.minPlayers) {
            game.status = GameStatus.InProgress;
            emit GameStarted(gameId, game.players.length);
        }
    }

    // ============ Settlement and Withdrawal Functions ============

    /**
     * @notice Settle a game with server-signed winner payouts
     * @param gameId The ID of the game to settle
     * @param winners Array of winner addresses
     * @param payouts Array of payout amounts for each winner (in wei)
     * @param signature Server signature authorizing the settlement
     */
    function settleGame(
        uint64 gameId,
        address[] calldata winners,
        uint256[] calldata payouts,
        bytes calldata signature
    ) external gameExists(gameId) {
        Game storage game = games[gameId];

        if (game.status != GameStatus.InProgress) revert GameNotInProgress(gameId);
        if (winners.length != payouts.length) revert WinnerCountMismatch(winners.length, payouts.length);

        // Verify signature
        bytes32 messageHash = constructSettlementMessage(gameId, winners, payouts);
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedMessageHash.recover(signature);

        if (recoveredSigner != serverSigner) revert InvalidSignature();

        // Calculate total payouts and house fee
        uint256 totalPayouts = 0;
        for (uint256 i = 0; i < payouts.length; i++) {
            totalPayouts += payouts[i];
        }

        uint256 houseFee = (game.totalPool * houseCutBps) / 10000;
        uint256 expectedPayouts = game.totalPool - houseFee;

        if (totalPayouts != expectedPayouts) revert PayoutMismatch(totalPayouts, expectedPayouts);

        // Distribute payouts to pending withdrawals
        for (uint256 i = 0; i < winners.length; i++) {
            pendingWithdrawals[winners[i]] += payouts[i];
        }

        // Add house fee to fee recipient's pending withdrawals
        if (houseFee > 0 && feeRecipient != address(0)) {
            pendingWithdrawals[feeRecipient] += houseFee;
        }

        game.status = GameStatus.Settled;

        emit GameSettled(gameId, winners, payouts, houseFee);
    }

    /**
     * @notice Construct the settlement message for signature verification
     * @param gameId The ID of the game
     * @param winners Array of winner addresses
     * @param payouts Array of payout amounts
     * @return messageHash The keccak256 hash of the settlement message
     */
    function constructSettlementMessage(
        uint64 gameId,
        address[] calldata winners,
        uint256[] calldata payouts
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(gameId, winners, payouts));
    }

    /**
     * @notice Withdraw pending balance to caller's address
     * @dev Uses pull payment pattern with reentrancy protection
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert NoPendingWithdrawal(msg.sender);

        pendingWithdrawals[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // ============ Game Cancellation Functions ============

    /**
     * @notice Cancel a game in lobby state and refund all players
     * @param gameId The ID of the game to cancel
     * @dev Only the game creator can cancel the game
     */
    function cancelGame(uint64 gameId) external gameExists(gameId) {
        Game storage game = games[gameId];

        if (game.status != GameStatus.Lobby) revert GameNotInLobby(gameId);
        if (msg.sender != game.creator) revert NotAuthorized(msg.sender);

        // Refund all players who joined
        for (uint256 i = 0; i < game.players.length; i++) {
            pendingWithdrawals[game.players[i]] += game.deposits[i];
        }

        game.status = GameStatus.Cancelled;

        emit GameCancelled(gameId, game.players);
    }

    // ============ Admin Functions ============

    /**
     * @notice Initialize the contract with server signer and fee recipient
     * @param _serverSigner Address authorized to sign game settlements
     * @param _feeRecipient Address to receive house fees
     * @dev Can only be called once by admin
     */
    function initialize(address _serverSigner, address _feeRecipient) external onlyAdmin {
        if (serverSigner != address(0)) revert AlreadyInitialized();
        if (_serverSigner == address(0)) revert InvalidAddress();
        if (_feeRecipient == address(0)) revert InvalidAddress();

        serverSigner = _serverSigner;
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Update the server signer address
     * @param newSigner New address authorized to sign settlements
     */
    function updateServerSigner(address newSigner) external onlyAdmin {
        if (newSigner == address(0)) revert InvalidAddress();
        
        address oldSigner = serverSigner;
        serverSigner = newSigner;

        emit ServerSignerUpdated(oldSigner, newSigner);
    }

    /**
     * @notice Update the fee recipient address
     * @param newRecipient New address to receive house fees
     */
    function updateFeeRecipient(address newRecipient) external onlyAdmin {
        if (newRecipient == address(0)) revert InvalidAddress();
        
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;

        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @notice Update the house cut percentage
     * @param newHouseCutBps New house cut in basis points (e.g., 200 = 2%)
     * @dev Maximum allowed is 1000 (10%)
     */
    function updateHouseCut(uint16 newHouseCutBps) external onlyAdmin {
        if (newHouseCutBps > 1000) revert InvalidHouseCut(newHouseCutBps);
        
        uint16 oldCut = houseCutBps;
        houseCutBps = newHouseCutBps;

        emit HouseCutUpdated(oldCut, newHouseCutBps);
    }

    // ============ View Functions ============

    /**
     * @notice Get complete game information
     * @param gameId The ID of the game to query
     * @return game The Game struct containing all game data
     */
    function getGame(uint64 gameId) external view gameExists(gameId) returns (Game memory game) {
        return games[gameId];
    }

    /**
     * @notice Get pending withdrawal amount for an address
     * @param player The address to query
     * @return amount The pending withdrawal amount in wei
     */
    function getPendingWithdrawal(address player) external view returns (uint256 amount) {
        return pendingWithdrawals[player];
    }

    /**
     * @notice Get contract configuration information
     * @return _admin Admin address
     * @return _serverSigner Server signer address
     * @return _feeRecipient Fee recipient address
     * @return _houseCutBps House cut in basis points
     * @return _nextGameId Next game ID to be created
     */
    function getContractInfo() external view returns (
        address _admin,
        address _serverSigner,
        address _feeRecipient,
        uint16 _houseCutBps,
        uint64 _nextGameId
    ) {
        return (admin, serverSigner, feeRecipient, houseCutBps, nextGameId);
    }

    /**
     * @notice Get the number of players in a game
     * @param gameId The ID of the game
     * @return count The number of players who have joined
     */
    function getPlayerCount(uint64 gameId) external view gameExists(gameId) returns (uint256 count) {
        return games[gameId].players.length;
    }

    /**
     * @notice Check if an address is a player in a game
     * @param gameId The ID of the game
     * @param player The address to check
     * @return isPlayer True if the address is a player in the game
     */
    function isPlayerInGame(uint64 gameId, address player) external view gameExists(gameId) returns (bool isPlayer) {
        Game storage game = games[gameId];
        for (uint256 i = 0; i < game.players.length; i++) {
            if (game.players[i] == player) {
                return true;
            }
        }
        return false;
    }
}
