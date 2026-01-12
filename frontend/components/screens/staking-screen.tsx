"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import GifLoader from "@/components/common/gif-loader"
import RetroAnimation from "@/components/common/retro-animation"
import { useWalletContext } from "@/contexts/WalletContext"
import { useJoinGame } from "@/hooks/useGameContract"
import { formatEther, parseEther } from "viem"
import LobbySettingsDialog, { FullGameSettings, FALLBACK_GAME_SETTINGS } from "@/components/game/lobby-settings-dialog"
import { useGameDefaults } from "@/hooks/useGameDefaults"
import FaucetButton from "@/components/wallet/faucet-button"
import { activeChain } from "@/lib/wagmi"

interface StakingScreenProps {
  gameId?: string // Optional for room creation
  playerAddress: string
  onStakeSuccess: (gameId?: string, roomCode?: string) => void
  onCancel: () => void
  mode: 'create' | 'join' // New prop to distinguish between creating and joining
  onBrowsePublicLobbies?: () => void // Optional handler to browse public lobbies
  initialRoomCode?: string // Pre-fill room code (e.g., from public lobbies)
}

interface StakingInfo {
  gameId: string
  roomCode: string
  players: string[]
  playersCount: number
  minPlayers: number
  totalStaked: string
  totalStakedInAPT: string
  status: string
  isReady: boolean
}

interface BalanceInfo {
  balance: string
  balanceInAPT: string
  sufficient: boolean
}

export default function StakingScreen({ gameId, playerAddress, onStakeSuccess, onCancel, mode, onBrowsePublicLobbies, initialRoomCode }: StakingScreenProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode || '')
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null)
  const [createdGameId, setCreatedGameId] = useState<string | null>(null)
  const [joinGameId, setJoinGameId] = useState<string | null>(null)
  const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false)
  const [balanceInfo, setBalanceInfo] = useState<BalanceInfo | null>(null)
  const [balanceLoading, setBalanceLoading] = useState(true)

  const [stakeAmountInput, setStakeAmountInput] = useState('0.001'); // Will be updated from backend
  const [isPublic, setIsPublic] = useState(false);
  const { defaults: backendDefaults, isLoading: defaultsLoading, stakeAmountDefault } = useGameDefaults()
  const [gameSettings, setGameSettings] = useState<FullGameSettings>(FALLBACK_GAME_SETTINGS);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  // Update game settings when backend defaults are loaded
  useEffect(() => {
    if (backendDefaults && !defaultsLoading) {
      console.log('🔧 Updating gameSettings with backend defaults:', backendDefaults)
      setGameSettings(backendDefaults)
    }
  }, [backendDefaults, defaultsLoading])

  // Update stake amount input when backend defaults are loaded
  useEffect(() => {
    if (stakeAmountDefault && !defaultsLoading) {
      // Convert Wei to token units for display (1 token = 10^18 Wei)
      const stakeInTokens = parseFloat(formatEther(stakeAmountDefault))
      console.log('🔧 Backend stakeAmountDefault (Wei):', stakeAmountDefault)
      console.log('🔧 Converted to tokens:', stakeInTokens)
      console.log('🔧 Setting stakeAmountInput to:', stakeInTokens.toString())
      setStakeAmountInput(stakeInTokens.toString())
    }
  }, [stakeAmountDefault, defaultsLoading])

  // Update room code when initialRoomCode changes (e.g., from public lobbies)
  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode)
    }
  }, [initialRoomCode])

  // Validate and convert stake amount to Wei (1 token = 10^18 Wei)
  const getValidatedStakeAmount = () => {
    const parsed = parseFloat(stakeAmountInput);
    if (isNaN(parsed) || parsed < 0.001) {
      return '0.001'; // Minimum 0.001 tokens
    }
    return parsed.toString();
  };

  const stakeAmount = getValidatedStakeAmount();
  const stakeAmountFormatted = parseFloat(stakeAmount).toFixed(4);

  // EVM wallet hooks
  const { address, isConnected, balance, balanceFormatted, isCorrectNetwork } = useWalletContext();
  const { joinGame, hash, isPending, isConfirming, isSuccess, error: joinError } = useJoinGame();

  // Update balance info when wallet balance changes
  useEffect(() => {
    if (balanceFormatted) {
      const balanceNum = parseFloat(balanceFormatted);
      const stakeNum = parseFloat(stakeAmount);

      setBalanceInfo({
        balance: balance || '0',
        balanceInAPT: parseFloat(balanceFormatted).toFixed(4),
        sufficient: balanceNum >= stakeNum
      });
      setBalanceLoading(false);
    } else if (address) {
      setBalanceInfo({
        balance: '0',
        balanceInAPT: '0.0000',
        sufficient: false
      });
      setBalanceLoading(false);
    }
  }, [balanceFormatted, balance, address, stakeAmount]);

  // Helper function to convert gameId to bigint for contract calls
  const convertGameIdToBigInt = (gameId: string | number): bigint => {
    if (typeof gameId === 'number') {
      return BigInt(gameId);
    }
    if (typeof gameId === 'string') {
      // If it's a string number, convert to bigint
      if (/^\d+$/.test(gameId)) {
        return BigInt(gameId);
      }
      // If it's a hex string, convert to bigint
      else if (gameId.startsWith('0x')) {
        return BigInt(gameId);
      }
    }
    throw new Error(`Invalid gameId format: ${gameId}`);
  };

  const handleStakeSuccess = async (transactionHash: string, gameId?: string, roomCodeParam?: string) => {
    try {
      console.log('🎯 handleStakeSuccess called:', { transactionHash, mode, gameId, roomCodeParam })
      console.log('✅ Contract staking successful!')
      console.log('Transaction hash:', transactionHash)

      // Record the stake in the backend
      const gameIdToRecord = gameId || (mode === 'create' ? createdGameId : joinGameId)
      if (gameIdToRecord) {
        try {
          const requestBody = {
            gameId: gameIdToRecord,
            playerAddress: playerAddress,
            transactionHash: transactionHash
          };
          console.log('📤 Sending record-stake request:', {
            ...requestBody,
            playerAddressType: typeof playerAddress,
            playerAddressValue: playerAddress
          });

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/record-stake`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          })

          console.log('📥 Record-stake response status:', response.status);
          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`Backend error: ${errorBody.error || errorBody.message || 'Failed to record stake'}`);
          }
          const result = await response.json()
          console.log('📥 Record-stake response body:', result);

          if (result.success) {
            console.log('✅ Stake recorded in backend:', result)

            // Navigate ONLY after successful recording to ensure player is added to game
            if (mode === 'create') {
              const finalGameId = gameId || createdGameId
              const finalRoomCode = roomCodeParam || createdRoomCode
              console.log('🎯 Create mode - calling onStakeSuccess with:', { finalGameId, finalRoomCode })
              onStakeSuccess(finalGameId || undefined, finalRoomCode || undefined)
            } else {
              // Use parameter values first, fall back to state if not provided
              const finalGameId = gameId || joinGameId
              const finalRoomCode = roomCodeParam || roomCode
              console.log('🎯 Join mode - calling onStakeSuccess with:', { finalGameId, finalRoomCode })
              onStakeSuccess(finalGameId || undefined, finalRoomCode)
            }
          } else {
            console.error('❌ Failed to record stake:', result)
            setError('Stake successful but failed to join game. Please contact support.')
            setIsStaking(false)
          }
        } catch (error) {
          console.error('❌ Error recording stake:', error)
          setError('Stake successful but failed to join game. Please contact support.')
          setIsStaking(false)
        }
      } else {
        // No gameId to record - this shouldn't happen but handle gracefully
        console.error('❌ No gameId available to record stake')
        setError('Failed to join game. Please try again.')
        setIsStaking(false)
      }
    } catch (error) {
      console.error('❌ Error handling stake success:', error)
      setError('Staking successful but failed to proceed. Please try again.')
      setIsStaking(false)
    }
  }

  // Watch for transaction success
  useEffect(() => {
    if (isSuccess && hash && !hasProcessedSuccess) {
      console.log('✅ Transaction confirmed:', hash);
      setHasProcessedSuccess(true);

      // Determine which gameId and roomCode to use
      const gameIdToUse = mode === 'create' ? createdGameId : joinGameId;
      const roomCodeToUse = mode === 'create' ? createdRoomCode : roomCode;

      handleStakeSuccess(hash, gameIdToUse || undefined, roomCodeToUse || undefined);
    }
  }, [isSuccess, hash, hasProcessedSuccess, mode, createdGameId, joinGameId, createdRoomCode, roomCode]);

  // Watch for transaction errors
  useEffect(() => {
    if (joinError) {
      console.error('❌ Transaction error:', joinError);
      setError(`Transaction failed: ${joinError.message || 'Unknown error'}`);
      setIsStaking(false);
    }
  }, [joinError]);

  const handleStake = async () => {
    if (mode === 'create' && parseFloat(stakeAmountInput) < 0.001) {
      setError(`Stake amount must be at least 0.001 ${activeChain.nativeCurrency.symbol}`);
      return;
    }

    // For joining mode, require room code
    if (mode === 'join' && !roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    if (!balanceInfo?.sufficient) {
      setError(`Insufficient balance. You need at least 0.001 ${activeChain.nativeCurrency.symbol} to stake.`)
      return
    }

    if (!address) {
      setError('Wallet not connected')
      return
    }

    if (!isCorrectNetwork) {
      setError(`Please switch to ${activeChain.name}`)
      return
    }

    try {
      setIsStaking(true)
      setError('')
      setHasProcessedSuccess(false)

      if (mode === 'create') {
        // For room creation: use backend to create game, then join via contract
        console.log('🎮 Creating room with staking...')
        console.log('Contract:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
        console.log('Stake Amount:', stakeAmount)

        // Call backend to create game
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/create-and-join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creatorAddress: playerAddress,
              stakeAmount: parseFloat(stakeAmount), // Send as number in token units (e.g., 0.001)
              minPlayers: 4, // Use default minPlayers (not customizable)
              isPublic: isPublic,
              settings: gameSettings // Pass custom game settings (phase durations only)
            }),
          })

          const result = await response.json()
          if (result.success) {
            console.log('✅ Backend created room:', result)
            // Store the room code and gameId for later use
            setCreatedRoomCode(result.roomCode)
            setCreatedGameId(result.gameId)

            // Now stake from user's wallet to join the game via EVM contract
            console.log('💰 User staking to join created game:', result.contractGameId)

            const gameIdBigInt = convertGameIdToBigInt(result.contractGameId)
            console.log('🔧 Converted gameId to BigInt:', gameIdBigInt)

            // Call joinGame from wagmi hook
            joinGame(gameIdBigInt, stakeAmount)
          } else {
            console.error('❌ Backend create failed:', result.error)
            setError(`Failed to create room: ${result.error}`)
            setIsStaking(false)
          }
        } catch (error) {
          console.error('❌ Error calling backend:', error)
          setError(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setIsStaking(false)
        }
      } else {
        // For joining: first get gameId from room code, then stake
        console.log('🎮 Joining room with staking...')
        console.log('Contract:', process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
        console.log('Room Code:', roomCode)
        console.log('Stake Amount:', stakeAmount)

        if (!gameId) {
          // First, get the gameId from the room code via backend
          console.log('🔍 Getting gameId from room code...')
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/room/${roomCode}`)
          const result = await response.json()

          if (!result.success) {
            throw new Error('Room code not found')
          }

          const gameData = result.game
          console.log('✅ Found game:', gameData)

          // Store the game manager's gameId for later use
          setJoinGameId(gameData.gameId)

          // Now stake to join the game via EVM contract
          console.log('💰 Staking to join game:', gameData.contractGameId)

          const gameIdBigInt = convertGameIdToBigInt(gameData.contractGameId)
          console.log('🔧 Converted gameId to BigInt:', gameIdBigInt)

          // Get stake amount from game data
          const gameStakeAmount = formatEther(BigInt(gameData.stakeAmount))
          console.log('💰 Game stake amount:', gameStakeAmount)

          // Call joinGame from wagmi hook
          joinGame(gameIdBigInt, gameStakeAmount)
        } else {
          // We already have gameId, just stake
          console.log('💰 Staking to join game:', gameId)

          const gameIdBigInt = convertGameIdToBigInt(gameId)
          console.log('🔧 Converted gameId to BigInt:', gameIdBigInt)

          // Call joinGame from wagmi hook
          joinGame(gameIdBigInt, stakeAmount)
        }
      }

    } catch (error) {
      console.error('Error staking:', error)
      setError(`Failed to stake: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setIsStaking(false)
    }
  }

  const getStakingStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400'
      case 'full': return 'text-green-400'
      case 'started': return 'text-blue-400'
      case 'completed': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getStakingStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'WAITING FOR PLAYERS'
      case 'full': return 'READY TO START'
      case 'started': return 'GAME STARTED'
      case 'completed': return 'GAME COMPLETED'
      default: return 'UNKNOWN'
    }
  }

  if (balanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
        <Card className="w-full max-w-md p-8 bg-[#111111]/80 border border-[#2a2a2a] text-center">
          <div className="space-y-4">
            <div className="text-lg font-press-start pixel-text-3d-white">CHECKING BALANCE...</div>
            <div className="flex justify-center">
              <GifLoader size="lg" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 gaming-bg scanlines">
      <Card className="w-[90vw] max-w-[480px] p-3 sm:p-4 lg:p-6 bg-[#111111]/90 backdrop-blur-sm border-2 border-[#2a2a2a]">
        <div className="space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="text-center space-y-1 sm:space-y-2">
            <RetroAnimation type="bounce">
              <div className="text-2xl sm:text-3xl lg:text-4xl">💰</div>
            </RetroAnimation>
            <div className="text-lg sm:text-xl font-bold font-press-start pixel-text-3d-white">
              STAKE TO PLAY
            </div>
          </div>

          {/* Balance and Network Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
            {/* Balance Info */}
            {balanceInfo && (
              <div className="p-2 sm:p-3 lg:p-4 bg-[#1a1a1a]/50 border-2 border-[#2a2a2a] rounded-lg">
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-xs sm:text-sm font-press-start text-gray-300">YOUR BALANCE</div>
                  <div className="text-base sm:text-lg font-bold text-white break-all">
                    {balanceInfo.balanceInAPT} {activeChain.nativeCurrency.symbol}
                  </div>
                  <div className={`text-xs sm:text-sm font-press-start ${balanceInfo.sufficient ? 'text-green-400' : 'text-red-400'}`}>
                    {balanceInfo.sufficient ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}
                  </div>
                </div>
              </div>
            )}

            {/* Network Info */}
            <div className="p-2 sm:p-3 lg:p-4 bg-[#1a1a1a]/50 border-2 border-[#2a2a2a] rounded-lg">
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm font-press-start text-gray-300">NETWORK</div>
                <div className="text-base sm:text-lg font-bold text-white break-words">
                  {isConnected ? `✅ ${activeChain.name}` : '❌ Not Connected'}
                </div>
                {!isConnected && (
                  <div className="text-xs sm:text-sm text-yellow-400 break-words">
                    Please connect your wallet
                  </div>
                )}
                {isConnected && !isCorrectNetwork && (
                  <div className="text-xs sm:text-sm text-red-400 break-words">
                    Wrong network! Switch to {activeChain.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Faucet Button */}
          <div className="flex justify-center">
            <FaucetButton
              walletAddress={playerAddress || null}
              onSuccess={async () => {
                console.log('✅ Faucet claim successful! Balance will refresh automatically')
              }}
            />
          </div>

          <div className="border-t border-border my-4"></div>

          {/* Public/Private Toggle and Settings - Only show for create mode */}
          {mode === 'create' && (
            <>
              <Card className="p-2 sm:p-3 bg-[#1a1a1a]/50 border-2 border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-press-start text-gray-300">ROOM VISIBILITY</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {isPublic ? 'Anyone can see and join' : 'Only with room code'}
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsPublic(!isPublic)}
                    variant={isPublic ? 'pixel' : 'pixelOutline'}
                    size="pixel"
                    className="text-xs"
                  >
                    {isPublic ? '🌐 PUBLIC' : '🔒 PRIVATE'}
                  </Button>
                </div>
              </Card>

              {/* Game Settings Button */}
              <Card className="p-2 sm:p-3 bg-[#1a1a1a]/50 border-2 border-[#2a2a2a]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-press-start text-gray-300">GAME SETTINGS</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Configure phase times and player count
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowSettingsDialog(true)}
                    variant="pixelOutline"
                    size="pixel"
                    className="text-xs"
                    disabled={defaultsLoading}
                  >
                    {defaultsLoading ? '⏳ LOADING...' : '⚙️ CONFIGURE'}
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Stake Amount Input - Only show for create mode */}
          {mode === 'create' && (
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="stakeAmount" className="text-xs sm:text-sm font-press-start text-gray-300">
                STAKE AMOUNT ({activeChain.nativeCurrency.symbol})
              </Label>
              <Input
                id="stakeAmount"
                type="number"
                value={stakeAmountInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string for editing
                  if (value === '') {
                    setStakeAmountInput('');
                    return;
                  }
                  // Prevent negative numbers
                  const num = parseFloat(value);
                  if (num < 0) {
                    setStakeAmountInput('0.001');
                    return;
                  }
                  setStakeAmountInput(value);
                }}
                onBlur={() => {
                  // Enforce minimum on blur
                  const num = parseFloat(stakeAmountInput);
                  if (isNaN(num) || num < 0.001) {
                    setStakeAmountInput('0.001');
                  }
                }}
                placeholder="Enter stake amount"
                min="0.001"
                step="0.001"
                className="font-press-start text-center text-sm sm:text-lg tracking-widest"
              />
            </div>
          )}

          {/* Join mode UI */}
          {mode === 'join' && (
            <>
              {/* Group 1: Join with Room Code */}
              <div className="space-y-2 p-4 border-2 border-[#2a2a2a] rounded-lg bg-[#1a1a1a]/30">
                <Input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char room code"
                  maxLength={6}
                  className="w-full font-press-start text-left text-lg tracking-widest p-4 bg-black/50 border-2 border-[#2a2a2a] focus:border-primary focus:ring-primary"
                />
                <Button
                  onClick={handleStake}
                  disabled={isStaking || isPending || isConfirming || !isConnected || !balanceInfo?.sufficient || roomCode.length !== 6 || !isCorrectNetwork}
                  variant="pixel"
                  size="pixelLarge"
                  className="w-full"
                >
                  {isStaking || isPending || isConfirming ? (
                    <div className="flex items-center justify-center gap-2">
                      <GifLoader size="sm" />
                      <span>{isPending ? 'CONFIRM IN WALLET...' : 'STAKING...'}</span>
                    </div>
                  ) : (
                    `💰 Stake to join `
                  )}
                </Button>
              </div>

              {/* Separator */}
              <div className="flex items-center">
                <div className="flex-grow border-t border-[#2a2a2a]"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-500 font-press-start">OR</span>
                <div className="flex-grow border-t border-[#2a2a2a]"></div>
              </div>

              {/* Group 2: Browse Public Lobbies */}
              {onBrowsePublicLobbies && (
                <div>
                  <Button
                    onClick={onBrowsePublicLobbies}
                    variant="pixelOutline"
                    size="pixelLarge"
                    className="w-full"
                  >
                    🌐 BROWSE PUBLIC LOBBIES
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Error Message */}
          {error && (
            <Card className="p-2 sm:p-3 bg-red-900/20 border-2 border-red-500/50">
              <div className="text-xs sm:text-sm text-red-400 font-press-start">
                ❌ {error}
              </div>
            </Card>
          )}

          {/* Staking Info */}
          {stakingInfo && (
            <Card className="p-2 sm:p-3 lg:p-4 bg-[#1a1a1a]/50 border-2 border-[#2a2a2a]">
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm font-press-start text-gray-300">GAME STATUS</div>
                <div className={`text-base sm:text-lg font-bold font-press-start ${getStakingStatusColor(stakingInfo.status)}`}>
                  {getStakingStatusText(stakingInfo.status)}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  Players: {stakingInfo.playersCount}/{stakingInfo.minPlayers}
                </div>
                <div className="text-xs sm:text-sm text-gray-400">
                  Total Staked: {stakingInfo.totalStakedInAPT} {activeChain.nativeCurrency.symbol}
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 sm:space-y-3">
            {mode === 'create' && (
              <Button
                onClick={handleStake}
                disabled={isStaking || isPending || isConfirming || !isConnected || !balanceInfo?.sufficient || !isCorrectNetwork}
                variant="pixel"
                size="pixelLarge"
                className="w-full"
              >
                {isStaking || isPending || isConfirming ? (
                  <div className="flex items-center justify-center gap-2">
                    <GifLoader size="sm" />
                    <span>{isPending ? 'CONFIRM IN WALLET...' : 'STAKING...'}</span>
                  </div>
                ) : (
                  `🎮 STAKE ${stakeAmountFormatted} ${activeChain.nativeCurrency.symbol}`
                )}
              </Button>
            )}

            <Button
              onClick={onCancel}
              variant="pixelOutline"
              size="pixelLarge"
              className="w-full"
            >
              CANCEL
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center space-y-0.5 sm:space-y-1">
            <div>• Minimum stake: 0.001 {activeChain.nativeCurrency.symbol}</div>
            <div>• Winners get 98% of total pool</div>
            <div>• Losers get 0% of total pool</div>
            <div>• 2% house cut applies</div>
          </div>
        </div>

        {/* Settings Dialog */}
        <LobbySettingsDialog
          key={JSON.stringify(gameSettings)} // Force re-render when settings change
          open={showSettingsDialog}
          onOpenChange={setShowSettingsDialog}
          settings={gameSettings}
          onSettingsChange={setGameSettings}
          onSave={() => {
            console.log('Game settings updated:', gameSettings);
          }}
        />
      </Card>
    </div>
  )
}
