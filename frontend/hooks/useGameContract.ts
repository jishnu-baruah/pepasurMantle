import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import PepasurABI from '@/lib/PepasurABI.json';

const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as `0x${string}`;

// Hook to read game information
export function useGameInfo(gameId: bigint | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contractAddress,
        abi: PepasurABI,
        functionName: 'getGame',
        args: gameId !== undefined ? [gameId] : undefined,
        query: {
            enabled: gameId !== undefined,
        },
    });

    return {
        gameInfo: data,
        isLoading,
        error,
        refetch,
    };
}

// Hook to read pending withdrawal amount
export function usePendingWithdrawal(playerAddress: `0x${string}` | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contractAddress,
        abi: PepasurABI,
        functionName: 'getPendingWithdrawal',
        args: playerAddress ? [playerAddress] : undefined,
        query: {
            enabled: !!playerAddress,
        },
    });

    return {
        pendingWithdrawal: data ? formatEther(data as bigint) : '0',
        pendingWithdrawalRaw: data as bigint | undefined,
        isLoading,
        error,
        refetch,
    };
}

// Hook to join a game
export function useJoinGame() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const joinGame = (gameId: bigint, stakeAmount: string) => {
        writeContract({
            address: contractAddress,
            abi: PepasurABI,
            functionName: 'joinGame',
            args: [gameId],
            value: parseEther(stakeAmount),
        });
    };

    return {
        joinGame,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// Hook to withdraw rewards
export function useWithdraw() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const withdraw = () => {
        writeContract({
            address: contractAddress,
            abi: PepasurABI,
            functionName: 'withdraw',
        });
    };

    return {
        withdraw,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// Hook to create a game (for backend use, but can be called from frontend)
export function useCreateGame() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createGame = (stakeAmount: string, minPlayers: number) => {
        writeContract({
            address: contractAddress,
            abi: PepasurABI,
            functionName: 'createGame',
            args: [parseEther(stakeAmount), minPlayers],
        });
    };

    return {
        createGame,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// Hook to check if player is in game
export function useIsPlayerInGame(gameId: bigint | undefined, playerAddress: `0x${string}` | undefined) {
    const { data, isLoading, error } = useReadContract({
        address: contractAddress,
        abi: PepasurABI,
        functionName: 'isPlayerInGame',
        args: gameId !== undefined && playerAddress ? [gameId, playerAddress] : undefined,
        query: {
            enabled: gameId !== undefined && !!playerAddress,
        },
    });

    return {
        isPlayerInGame: data as boolean | undefined,
        isLoading,
        error,
    };
}

// Hook to get player count
export function usePlayerCount(gameId: bigint | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contractAddress,
        abi: PepasurABI,
        functionName: 'getPlayerCount',
        args: gameId !== undefined ? [gameId] : undefined,
        query: {
            enabled: gameId !== undefined,
        },
    });

    return {
        playerCount: data ? Number(data) : 0,
        isLoading,
        error,
        refetch,
    };
}

// Hook to get contract info
export function useContractInfo() {
    const { data, isLoading, error } = useReadContract({
        address: contractAddress,
        abi: PepasurABI,
        functionName: 'getContractInfo',
    });

    return {
        contractInfo: data,
        isLoading,
        error,
    };
}
