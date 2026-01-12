import { useState, useEffect } from 'react'
import { apiService } from '@/services/api'
import { FullGameSettings, FALLBACK_GAME_SETTINGS } from '@/components/game/lobby-settings-dialog'

interface UseGameDefaultsReturn {
    defaults: FullGameSettings | null
    isLoading: boolean
    error: string | null
    stakeAmountDefault: string | null
    minPlayersDefault: number | null
    maxPlayersDefault: number | null
}

export function useGameDefaults(): UseGameDefaultsReturn {
    const [defaults, setDefaults] = useState<FullGameSettings | null>(null)
    const [stakeAmountDefault, setStakeAmountDefault] = useState<string | null>(null)
    const [minPlayersDefault, setMinPlayersDefault] = useState<number | null>(null)
    const [maxPlayersDefault, setMaxPlayersDefault] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDefaults = async () => {
            try {
                setIsLoading(true)
                setError(null)

                const response = await apiService.fetchDefaults()

                if (response.success && response.defaults) {
                    const backendDefaults = response.defaults

                    // Set game settings defaults
                    const gameDefaults: FullGameSettings = {
                        nightPhaseDuration: backendDefaults.nightPhaseDuration,
                        resolutionPhaseDuration: backendDefaults.resolutionPhaseDuration,
                        taskPhaseDuration: backendDefaults.taskPhaseDuration,
                        votingPhaseDuration: backendDefaults.votingPhaseDuration,
                        maxTaskCount: backendDefaults.maxTaskCount,
                    }

                    setDefaults(gameDefaults)
                    setStakeAmountDefault(backendDefaults.stakeAmount)
                    setMinPlayersDefault(backendDefaults.minPlayers)
                    setMaxPlayersDefault(backendDefaults.maxPlayers)

                    console.log('✅ Loaded defaults from backend:', backendDefaults)
                } else {
                    throw new Error('Invalid response from backend')
                }
            } catch (err) {
                console.error('❌ Failed to fetch defaults from backend:', err)
                setError(err instanceof Error ? err.message : 'Failed to fetch defaults')

                // Use fallback defaults
                setDefaults(FALLBACK_GAME_SETTINGS)
                setStakeAmountDefault('100000000000000000') // 0.1 tokens
                setMinPlayersDefault(4)
                setMaxPlayersDefault(10)

                console.log('⚠️ Using fallback defaults')
            } finally {
                setIsLoading(false)
            }
        }

        fetchDefaults()
    }, [])

    return {
        defaults,
        isLoading,
        error,
        stakeAmountDefault,
        minPlayersDefault,
        maxPlayersDefault
    }
}