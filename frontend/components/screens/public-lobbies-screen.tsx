"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import FaucetButton from "@/components/wallet/faucet-button"
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, type Abi } from 'viem'
import PepasurArtifact from '@/contracts/PepasurABI.json'

const PepasurABI = PepasurArtifact.abi as Abi

interface PublicLobby {
    gameId: string
    roomCode: string
    creator: string
    creatorName?: string
    stakeAmount: string  // Wei as string from backend
    stakeAmountFormatted?: string  // Token units for display
    minPlayers: number
    maxPlayers: number
    playerCount: number
    currentPlayers: string[]
    createdAt: string
    contractGameId?: string
}

interface PublicLobbiesScreenProps {
    onJoinLobby: (gameId: string, roomCode: string) => void
    onBack: () => void
    onCreateLobby?: () => void
    playerAddress: string
}

const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const formatCELO = (tokenAmount: string | number) => {
    try {
        // Backend sends token units (0.001), not Wei
        const value = Number(tokenAmount)
        return value.toFixed(4)
    } catch {
        return '0.0000'
    }
}

export default function PublicLobbiesScreen({
    onJoinLobby,
    onBack,
    onCreateLobby,
    playerAddress
}: PublicLobbiesScreenProps) {
    const [lobbies, setLobbies] = useState<PublicLobby[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState('')
    const [sortBy, setSortBy] = useState<'newest' | 'stake' | 'players'>('newest')

    // Staking modal state
    const [showStakingModal, setShowStakingModal] = useState(false)
    const [selectedLobby, setSelectedLobby] = useState<PublicLobby | null>(null)
    const [isStaking, setIsStaking] = useState(false)
    const [stakingError, setStakingError] = useState('')

    // Wagmi hooks
    const { address } = useAccount()
    const { data: balanceData } = useBalance({ address })
    const { writeContractAsync } = useWriteContract()

    // Fetch public lobbies
    const fetchLobbies = async (isInitial = false) => {
        try {
            if (isInitial) {
                setIsLoading(true)
            } else {
                setIsRefreshing(true)
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/public/lobbies`)
            const data = await response.json()

            if (data.success) {
                setLobbies(data.lobbies || [])
                setError('')
            } else {
                setError('Failed to load lobbies')
            }
        } catch (err) {
            console.error('Error fetching lobbies:', err)
            if (isInitial) {
                setError('Failed to connect to server')
            }
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    // Initial fetch and periodic refresh
    useEffect(() => {
        fetchLobbies(true)
        const interval = setInterval(() => fetchLobbies(false), 5000)
        return () => clearInterval(interval)
    }, [])

    const handleJoinClick = (lobby: PublicLobby) => {
        setSelectedLobby(lobby)
        setShowStakingModal(true)
        setStakingError('')
    }

    const handleStakeAndJoin = async () => {
        if (!selectedLobby || !address) return

        // stakeAmount is now in Wei, stakeAmountFormatted is in token units
        const stakeAmountWei = BigInt(selectedLobby.stakeAmount)
        const stakeAmountTokens = selectedLobby.stakeAmountFormatted || selectedLobby.stakeAmount

        // Check balance
        const balance = balanceData?.value || 0n
        if (balance < stakeAmountWei) {
            setStakingError(`Insufficient balance. You need ${formatCELO(stakeAmountTokens)} ${process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'CELO'}`)
            return
        }

        try {
            setIsStaking(true)
            setStakingError('')

            // Get game data from backend
            console.log('🔍 Getting game data for room:', selectedLobby.roomCode)
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/room/${selectedLobby.roomCode}`)
            const result = await response.json()

            if (!result.success) {
                throw new Error('Room code not found')
            }

            const gameData = result.game
            console.log('✅ Found game:', gameData)

            // Submit staking transaction
            console.log('💰 Staking to join game:', gameData.contractGameId)

            const txHash = await writeContractAsync({
                address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                abi: PepasurABI,
                functionName: 'joinGame',
                args: [BigInt(gameData.contractGameId)],
                value: stakeAmountWei,
            })

            console.log('✅ Transaction submitted:', txHash)

            // Record stake in backend
            const recordResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/record-stake`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gameId: gameData.gameId,
                    playerAddress: playerAddress,
                    transactionHash: txHash
                }),
            })

            const recordResult = await recordResponse.json()

            if (recordResult.success) {
                console.log('✅ Stake recorded successfully')
                setShowStakingModal(false)
                // Navigate to lobby
                onJoinLobby(gameData.gameId, gameData.roomCode)
            } else {
                throw new Error('Failed to record stake')
            }

        } catch (error: any) {
            console.error('❌ Error staking:', error)
            setStakingError(`Failed to stake: ${error?.message || error?.shortMessage || 'Unknown error'}`)
        } finally {
            setIsStaking(false)
        }
    }

    // Sort lobbies
    const sortedLobbies = [...lobbies].sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            case 'stake':
                // stakeAmount is Wei string - convert to BigInt for comparison
                const aStake = BigInt(a.stakeAmount)
                const bStake = BigInt(b.stakeAmount)
                return bStake > aStake ? 1 : bStake < aStake ? -1 : 0
            case 'players':
                return b.playerCount - a.playerCount
            default:
                return 0
        }
    })

    if (isLoading && lobbies.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
                <Card className="w-full max-w-md p-8 bg-[#111111]/90 backdrop-blur-sm border-2 border-[#2a2a2a] text-center">
                    <div className="space-y-4">
                        <div className="text-lg font-press-start pixel-text-3d-green">LOADING LOBBIES...</div>
                        <div className="text-sm text-gray-400 font-press-start">Fetching available games</div>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-2 sm:p-4 gaming-bg scanlines">
            <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-press-start pixel-text-3d-green">
                            PUBLIC LOBBIES
                        </h1>
                        {isRefreshing && (
                            <div className="text-xs text-gray-400 animate-pulse">🔄</div>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        {onCreateLobby && (
                            <Button
                                onClick={onCreateLobby}
                                variant="pixel"
                                size="pixel"
                                className="text-xs sm:text-sm"
                            >
                                ➕ CREATE LOBBY
                            </Button>
                        )}
                        <Button
                            onClick={onBack}
                            variant="pixelOutline"
                            size="pixel"
                            className="text-xs sm:text-sm"
                        >
                            ← BACK
                        </Button>
                    </div>
                </div>

                {/* Sort Options */}
                <Card className="p-2 sm:p-3 bg-[#111111]/90 backdrop-blur-sm border-2 border-[#2a2a2a]">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-xs font-press-start text-gray-300 self-center mr-2">SORT BY:</span>
                        <Button
                            onClick={() => setSortBy('newest')}
                            variant={sortBy === 'newest' ? 'pixel' : 'pixelOutline'}
                            size="pixel"
                            className="text-xs"
                        >
                            NEWEST
                        </Button>
                        <Button
                            onClick={() => setSortBy('stake')}
                            variant={sortBy === 'stake' ? 'pixel' : 'pixelOutline'}
                            size="pixel"
                            className="text-xs"
                        >
                            STAKE AMOUNT
                        </Button>
                        <Button
                            onClick={() => setSortBy('players')}
                            variant={sortBy === 'players' ? 'pixel' : 'pixelOutline'}
                            size="pixel"
                            className="text-xs"
                        >
                            PLAYERS
                        </Button>
                    </div>
                </Card>

                {/* Error Message */}
                {error && (
                    <Card className="p-3 bg-red-900/20 border-2 border-red-500/50">
                        <div className="text-sm text-red-400 font-press-start text-center">
                            ❌ {error}
                        </div>
                    </Card>
                )}

                {/* Lobbies Grid */}
                {sortedLobbies.length === 0 ? (
                    <Card className="p-8 bg-[#111111]/90 backdrop-blur-sm border-2 border-[#2a2a2a] text-center">
                        <div className="text-4xl mb-4">😔</div>
                        <div className="text-lg font-press-start pixel-text-3d-green mb-2">
                            NO PUBLIC LOBBIES
                        </div>
                        <div className="text-sm text-gray-400 font-press-start mb-4">
                            Be the first to create a public lobby!
                        </div>
                        {onCreateLobby && (
                            <Button
                                onClick={onCreateLobby}
                                variant="pixel"
                                size="pixelLarge"
                            >
                                ➕ CREATE YOUR LOBBY
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {sortedLobbies.map((lobby) => (
                            <Card
                                key={lobby.gameId}
                                className="p-3 sm:p-4 bg-[#111111]/90 backdrop-blur-sm border-2 border-[#2a2a2a] hover:border-[#4A8C4A]/80 transition-all"
                            >
                                <div className="flex gap-4 items-center">
                                    {/* Left (Data) Column */}
                                    <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <div className="p-2 bg-[#1a1a1a]/50 rounded border border-[#2a2a2a]">
                                            <span className="text-xs text-gray-400 font-press-start">ROOM:</span>
                                            <span className="ml-2 text-sm font-bold font-press-start text-green-400">
                                                {lobby.roomCode}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-[#1a1a1a]/50 rounded border border-[#2a2a2a]">
                                            <span className="text-xs text-gray-400 font-press-start">STAKE:</span>
                                            <span className="ml-2 text-sm font-bold text-yellow-400">
                                                {formatCELO(lobby.stakeAmountFormatted || lobby.stakeAmount)} {process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'CELO'}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-[#1a1a1a]/50 rounded border border-[#2a2a2a]">
                                            <span className="text-xs text-gray-400 font-press-start">PLAYERS:</span>
                                            <span className={`ml-2 text-sm font-bold ${lobby.playerCount >= lobby.minPlayers ? 'text-green-400' : 'text-yellow-400'
                                                }`}>
                                                {lobby.playerCount}/{lobby.minPlayers}
                                            </span>
                                        </div>
                                        <div className="p-2 bg-[#1a1a1a]/50 rounded border border-[#2a2a2a] col-span-2 sm:col-span-3">
                                            <span className="text-xs text-gray-400 font-press-start">CREATOR:</span>
                                            <span className="ml-2 text-sm text-blue-400">
                                                {lobby.creatorName || truncateAddress(lobby.creator)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Right (Join) Column */}
                                    <div className="flex items-center">
                                        <Button
                                            onClick={() => handleJoinClick(lobby)}
                                            variant="pixel"
                                            size="pixelXl"
                                            disabled={lobby.playerCount >= lobby.maxPlayers}
                                        >
                                            {lobby.playerCount >= lobby.maxPlayers ? '🔒 FULL' : '🎮 JOIN'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Refresh Info */}
                <div className="text-center text-xs text-gray-500">
                    Auto-refreshing every 5 seconds • {lobbies.length} {lobbies.length === 1 ? 'lobby' : 'lobbies'} available
                </div>
            </div>

            {/* Staking Modal */}
            <Dialog open={showStakingModal} onOpenChange={setShowStakingModal}>
                <DialogContent className="bg-[#111111]/90 backdrop-blur-sm border-2 border-[#4A8C4A] max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-press-start text-lg pixel-text-3d-green text-center">
                            💰 STAKE & JOIN
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-400 text-center">
                            Join the lobby by staking the required amount
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-center space-y-3 pt-4">
                        {selectedLobby && (
                            <>
                                <div className="space-y-2">
                                    <div className="p-2 bg-black/40 rounded border border-[#4A8C4A]/30">
                                        <span className="text-xs text-gray-400 font-press-start">ROOM CODE:</span>
                                        <span className="ml-2 text-sm font-bold font-press-start pixel-text-3d-green">
                                            {selectedLobby.roomCode}
                                        </span>
                                    </div>
                                    <div className="p-2 bg-black/40 rounded border border-[#4A8C4A]/30">
                                        <span className="text-xs text-gray-400 font-press-start">STAKE REQUIRED:</span>
                                        <span className="ml-2 text-sm font-bold text-yellow-400">
                                            {formatCELO(selectedLobby.stakeAmountFormatted || selectedLobby.stakeAmount)} {process.env.NEXT_PUBLIC_NATIVE_TOKEN_SYMBOL || 'CELO'}
                                        </span>
                                    </div>
                                    <div className="p-2 bg-black/40 rounded border border-[#4A8C4A]/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-gray-400 font-press-start">YOUR BALANCE:</span>
                                            <span className={`text-sm font-bold ${balanceData && balanceData.value >= BigInt(selectedLobby.stakeAmount) ? 'text-green-400' : 'text-red-400'}`}>
                                                {balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : '...'}
                                            </span>
                                        </div>
                                        {/* Faucet Button */}
                                        <div className="pt-2 border-t border-[#333333]/50">
                                            <div className="scale-75 origin-left -ml-2">
                                                <FaucetButton
                                                    walletAddress={playerAddress || null}
                                                    onSuccess={() => {
                                                        console.log('✅ Faucet claim successful!')
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {stakingError && (
                                    <div className="text-sm text-red-400 font-press-start">
                                        ❌ {stakingError}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            onClick={() => setShowStakingModal(false)}
                            variant="pixelOutline"
                            size="pixelLarge"
                            disabled={isStaking}
                            className="w-full sm:w-auto text-xs"
                        >
                            ❌ CANCEL
                        </Button>
                        <Button
                            onClick={handleStakeAndJoin}
                            variant="pixel"
                            size="pixelLarge"
                            disabled={isStaking || !balanceData || (selectedLobby && balanceData.value < BigInt(selectedLobby.stakeAmount))}
                            className="w-full sm:w-auto text-xs"
                        >
                            {isStaking ? '⏳ STAKING...' : '💰 STAKE & JOIN'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
