"use client"

import { useMemo } from "react"
import { useGame } from "@/hooks/useGame"
import { Player } from "@/hooks/useGame"
import { Game } from "@/services/api"
import FullscreenToggle from "@/components/common/fullscreen-toggle"
import ColoredPlayerName from "@/components/game/colored-player-name"

interface ScreenHeaderProps {
    isConnected?: boolean
    showRefresh?: boolean
    showFullscreen?: boolean
    onRefresh?: () => void
    players?: Player[]
    game?: Game | null
    currentPlayer?: Player | null
}

export default function ScreenHeader({
    isConnected = true,
    showRefresh = true,
    showFullscreen = true,
    onRefresh,
    players: propPlayers,
    game: propGame,
    currentPlayer: propCurrentPlayer
}: ScreenHeaderProps) {
    // Use props if provided, otherwise fall back to useGame hook
    const gameData = useGame()
    const players = propPlayers || gameData.players
    const game = propGame !== undefined ? propGame : gameData.game
    const currentPlayer = propCurrentPlayer || gameData.currentPlayer

    console.log('🔍 ScreenHeader received:', {
        propCurrentPlayer,
        gameDataCurrentPlayer: gameData.currentPlayer,
        finalCurrentPlayer: currentPlayer,
        finalCurrentPlayerAddress: currentPlayer?.address
    })

    // Memoize player status to prevent unnecessary re-renders
    // Sort to put current player first
    const playerStatuses = useMemo(() => {
        if (!players || players.length === 0) {
            console.log('🔍 ScreenHeader: No players')
            return []
        }

        console.log('🔍 ScreenHeader Debug:', {
            playersCount: players.length,
            currentPlayerAddress: currentPlayer?.address,
            playerAddresses: players.map(p => p.address)
        })

        const statuses = players.map(p => {
            const isCurrentPlayer = p.address === currentPlayer?.address
            console.log(`🔍 Player ${p.name}:`, {
                address: p.address,
                currentPlayerAddress: currentPlayer?.address,
                isCurrentPlayer,
                match: p.address === currentPlayer?.address
            })
            return {
                name: p.name,
                isEliminated: game?.eliminated?.includes(p.address!) || false,
                isCurrentPlayer
            }
        })

        console.log('🔍 Before sort:', statuses.map(s => ({ name: s.name, isCurrentPlayer: s.isCurrentPlayer })))

        // Sort: current player first, then others
        const sorted = [...statuses].sort((a, b) => {
            if (a.isCurrentPlayer && !b.isCurrentPlayer) return -1
            if (!a.isCurrentPlayer && b.isCurrentPlayer) return 1
            return 0
        })

        console.log('🔍 After sort:', sorted.map(s => ({ name: s.name, isCurrentPlayer: s.isCurrentPlayer })))

        return sorted
    }, [players, game?.eliminated, currentPlayer?.address])

    const handleRefresh = () => {
        if (onRefresh) {
            onRefresh()
        } else {
            window.location.reload()
        }
    }

    return (
        <div className="flex-shrink-0 w-full bg-black/60 border-b border-white/20 py-2 px-4 z-50">
            <div className="flex justify-between items-center gap-4">
                {/* Left: Controls */}
                <div className="flex gap-2 bg-black/40 px-2 py-1 rounded border border-white/10">
                    {showRefresh && (
                        <button
                            onClick={handleRefresh}
                            className="w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded flex items-center justify-center transition-colors"
                            title="Refresh Game State"
                        >
                            🔄
                        </button>
                    )}
                    {showFullscreen && (
                        <div className="w-8 h-8 bg-black/60 rounded flex items-center justify-center border border-white/20 hover:border-white/40 transition-colors">
                            <FullscreenToggle variant="icon" className="text-white text-sm" />
                        </div>
                    )}
                </div>

                {/* Player Status Section */}
                {playerStatuses && playerStatuses.length > 0 && (
                    <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                        {playerStatuses.map((player, index) => (
                            <div
                                key={index}
                                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded border transition-all ${player.isCurrentPlayer
                                    ? 'bg-gradient-to-r from-blue-600/50 to-blue-500/40 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-2 ring-blue-400/30'
                                    : player.isEliminated
                                        ? 'bg-gray-900/30 border-gray-800/50 opacity-60'
                                        : 'bg-gray-900/50 border-gray-700/50 hover:border-gray-600'
                                    }`}
                            >
                                {/* Greyish overlay for eliminated players */}
                                {player.isEliminated && !player.isCurrentPlayer && (
                                    <div className="absolute inset-0 bg-gray-600/60 rounded backdrop-blur-[1px]"></div>
                                )}
                                <div className={`w-2 h-2 rounded-full z-10 ${player.isEliminated ? 'bg-red-400/50' : 'bg-green-500'}`}></div>
                                <div className={`text-xs font-press-start whitespace-nowrap z-10 ${player.isEliminated && !player.isCurrentPlayer ? 'text-gray-400 opacity-60' : ''}`}>
                                    <ColoredPlayerName
                                        playerName={player.name}
                                        isCurrentPlayer={player.isCurrentPlayer}
                                        showYouIndicator={false}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Right: Connection Status */}
                <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded border border-white/10">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <div className="text-xs text-gray-400 font-press-start whitespace-nowrap">{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</div>
                </div>
            </div>
        </div>
    )
}
