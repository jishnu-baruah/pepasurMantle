"use client"

import { Card } from "@/components/ui/card"
import { Player } from "@/hooks/useGame"
import { Game } from "@/services/api"
import ColoredPlayerName from "@/components/game/colored-player-name"
import ScreenHeader from "@/components/common/screen-header"

interface VotingResolutionScreenProps {
    eliminatedPlayer: Player | null
    eliminatedPlayerAvatar: string | null
    votingResult: string | undefined
    game: Game | null
    timeLeft: number
    isConnected: boolean
    totalVotes: number
    noVotesCast: boolean
    isActualTie: boolean
    playersWithMaxVotes: number
    maxVotes: number
    players: Player[]
    currentPlayer: Player | null
}

export default function VotingResolutionScreen({
    eliminatedPlayer,
    eliminatedPlayerAvatar,
    votingResult,
    game,
    timeLeft,
    isConnected,
    noVotesCast,
    isActualTie,
    playersWithMaxVotes,
    maxVotes,
    players,
    currentPlayer
}: VotingResolutionScreenProps) {
    return (
        <div className="min-h-screen gaming-bg flex flex-col">
            <ScreenHeader
                isConnected={isConnected}
                players={players}
                game={game}
                currentPlayer={currentPlayer}
            />
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-2xl p-6 sm:p-8 bg-card border-4 border-destructive text-center">
                    <div className="space-y-8">
                        {/* Main Avatar Section - Only show if someone was eliminated AND votingResult confirms it */}
                        {eliminatedPlayer && (votingResult === 'INNOCENT_ELIMINATED' || votingResult === 'ASUR_ELIMINATED') && (
                            <div className="space-y-6">
                                {/* Context-specific header based on who was eliminated */}
                                <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">
                                    {votingResult === 'ASUR_ELIMINATED' ? 'ASUR ELIMINATED!' : 'INNOCENT ELIMINATED!'}
                                </div>

                                {/* Eliminated Player Avatar */}
                                <div className="flex justify-center">
                                    {eliminatedPlayerAvatar && eliminatedPlayerAvatar.startsWith('http') ? (
                                        <img
                                            src={eliminatedPlayerAvatar}
                                            alt={eliminatedPlayer.name}
                                            className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-none border-2 border-[#666666] shadow-lg"
                                            style={{ imageRendering: 'pixelated' }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const nextElement = e.currentTarget.nextSibling as HTMLElement | null;
                                                if (nextElement && 'style' in nextElement) {
                                                    nextElement.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-[#333333] border-2 border-[#666666] flex items-center justify-center shadow-lg" style={{ display: eliminatedPlayerAvatar && eliminatedPlayerAvatar.startsWith('http') ? 'none' : 'flex' }}>
                                        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">?</span>
                                    </div>
                                </div>

                                {/* Player Info */}
                                <div className="space-y-2">
                                    <div className="text-xl sm:text-2xl md:text-3xl font-press-start">
                                        <ColoredPlayerName playerName={eliminatedPlayer.name} />
                                    </div>
                                    {eliminatedPlayer.role && (
                                        <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">Role: {eliminatedPlayer.role}</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Context-aware message based on voting result - Only show for non-elimination cases */}
                        <div className="space-y-6">
                            {noVotesCast ? (
                                // No votes cast
                                <>
                                    <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-yellow pixel-text-3d-float">
                                        NO VOTES CAST
                                    </div>
                                    <div className="text-base sm:text-lg md:text-xl font-press-start text-gray-400">
                                        All players remain alive
                                    </div>
                                </>
                            ) : isActualTie ? (
                                // Actual voting tie (multiple players with same max votes)
                                <>
                                    <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-blue pixel-text-3d-float">
                                        VOTING TIE
                                    </div>
                                    <div className="text-base sm:text-lg md:text-xl font-press-start text-gray-400">
                                        {playersWithMaxVotes} players tied with {maxVotes} vote{maxVotes !== 1 ? 's' : ''} each
                                    </div>
                                </>
                            ) : !eliminatedPlayer ? (
                                // Fallback - shouldn't normally reach here
                                <>
                                    <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-gray pixel-text-3d-float">
                                        NO ELIMINATION
                                    </div>
                                    <div className="text-base sm:text-lg md:text-xl font-press-start text-gray-400">
                                        All players remain alive
                                    </div>
                                </>
                            ) : null}
                        </div>

                        <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">
                            {timeLeft > 0 ? `Continuing in ${timeLeft}s...` : 'The game continues...'}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
