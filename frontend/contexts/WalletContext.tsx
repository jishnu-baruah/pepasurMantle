'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useBalance } from 'wagmi';
import { activeChain } from '@/lib/wagmi';

interface WalletContextType {
    address: string | undefined;
    isConnected: boolean;
    isConnecting: boolean;
    connect: () => void;
    disconnect: () => void;
    switchNetwork: (chainId: number) => void;
    balance: string | undefined;
    balanceFormatted: string | undefined;
    chainId: number | undefined;
    isCorrectNetwork: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
    children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
    const { address, isConnected, chain } = useAccount();
    const { connect: wagmiConnect, connectors, isPending } = useConnect();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();

    // Get balance for connected address
    const { data: balanceData } = useBalance({
        address: address,
    });

    // Connect to the first available connector (MetaMask or WalletConnect)
    const connect = () => {
        const connector = connectors[0];
        if (connector) {
            wagmiConnect({ connector });
        }
    };

    const disconnect = () => {
        wagmiDisconnect();
    };

    const switchNetwork = (chainId: number) => {
        switchChain({ chainId });
    };

    const isCorrectNetwork = chain?.id === activeChain.id;

    const value: WalletContextType = {
        address,
        isConnected,
        isConnecting: isPending,
        connect,
        disconnect,
        switchNetwork,
        balance: balanceData?.value.toString(),
        balanceFormatted: balanceData?.formatted,
        chainId: chain?.id,
        isCorrectNetwork,
    };

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    );
}

export function useWalletContext() {
    const context = useContext(WalletContext);
    if (context === undefined) {
        throw new Error('useWalletContext must be used within a WalletProvider');
    }
    return context;
}
