import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import PepasurABI from '@/lib/PepasurABI.json';

const getContractAddress = () => {
    const addr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!addr || !isAddress(addr) || addr === '0x0000000000000000000000000000000000000000') {
        return null;
    }
    return addr as `0x${string}`;
};

const contractAddress = getContractAddress();

// Hook to read game information
export function useGameInfo(gameId: bigint | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contractAddress || undefined,
        abi: PepasurABI,
        functionName: 'getGame',
        args: gameId !== undefined ? [gameId] : undefined,
        query: {
            enabled: !!contractAddress && gameId !== undefined,
        },
    });

    return {
        gameInfo: data,
        isLoading,
        error: !contractAddress ? new Error("Invalid contract address") : error,
        refetch,
    };
}

// Hook to read pending withdrawal amount
export function usePendingWithdrawal(playerAddress: `0x${string}` | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contractAddress || undefined,
        abi: PepasurABI,
        functionName: 'getPendingWithdrawal',
        args: playerAddress ? [playerAddress] : undefined,
        query: {
            enabled: !!contractAddress && !!playerAddress,
        },
    });

    return {
        pendingWithdrawal: data ? formatEther(data as bigint) : '0',
        pendingWithdrawalRaw: data as bigint | undefined,
        isLoading,
        error: !contractAddress ? new Error("Invalid contract address") : error,
        refetch,
    };
}

// Hook to join a game
export function useJoinGame() {
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const joinGame = (gameId: bigint, stakeAmount: string) => {
        if (!contractAddress) {
            console.error("❌ Cannot join game: Contract address is missing or invalid.");
            alert("Error: Smart Contract address is not configured correctly. Please check .env settings.");
            return;
        }

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
        error: writeError,
    };
}

// Hook to withdraw rewards
export function useWithdraw() {
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const withdraw = () => {
        if (!contractAddress) {
            console.error("❌ Cannot withdraw: Contract address is missing or invalid.");
            alert("Error: Smart Contract address is not configured correctly.");
            return;
        }

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
        error: writeError,
    };
}

// Hook to create a game (for backend use, but can be called from frontend)
export function useCreateGame() {
    const { writeContract, data: hash, isPending, error: writeError } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createGame = (stakeAmount: string, minPlayers: number) => {
        if (!contractAddress) {
            console.error("❌ Cannot create game: Contract address is missing or invalid.");
            alert("Error: Smart Contract address is not configured correctly.");
            return;
        }

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
        error: writeError,
    };
}

// Hook to check if player is in game
export function useIsPlayerInGame(gameId: bigint | undefined, playerAddress: `0x${string}` | undefined) {
    const { data, isLoading, error } = useReadContract({
        address: contractAddress || undefined,
        abi: PepasurABI,
        functionName: 'isPlayerInGame',
        args: gameId !== undefined && playerAddress ? [gameId, playerAddress] : undefined,
        query: {
            enabled: !!contractAddress && gameId !== undefined && !!playerAddress,
        },
    });

    return {
        isPlayerInGame: data as boolean | undefined,
        isLoading,
        error: !contractAddress ? new Error("Invalid contract address") : error,
    };
}

// Hook to get player count
export function usePlayerCount(gameId: bigint | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        address: contractAddress || undefined,
        abi: PepasurABI,
        functionName: 'getPlayerCount',
        args: gameId !== undefined ? [gameId] : undefined,
        query: {
            enabled: !!contractAddress && gameId !== undefined,
        },
    });

    return {
        playerCount: data ? Number(data) : 0,
        isLoading,
        error: !contractAddress ? new Error("Invalid contract address") : error,
        refetch,
    };
}

// Hook to get contract info
export function useContractInfo() {
    const { data, isLoading, error } = useReadContract({
        address: contractAddress || undefined,
        abi: PepasurABI,
        functionName: 'getContractInfo',
        query: {
            enabled: !!contractAddress,
        },
    });

    return {
        contractInfo: data,
        isLoading,
        error: !contractAddress ? new Error("Invalid contract address") : error,
    };
}
