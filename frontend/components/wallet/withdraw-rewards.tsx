"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useWalletContext } from "@/contexts/WalletContext"
import { useWithdraw } from "@/hooks/useGameContract"
import { activeChain } from "@/lib/wagmi"

interface WithdrawRewardsProps {
  gameId: string
  playerAddress: string
  rewardAmount: string
  rewardInToken: string
  onWithdrawSuccess?: (transactionHash: string) => void
  renderButton?: boolean
  settlementTxHash?: string
}

export default function WithdrawRewards({
  gameId,
  playerAddress,
  rewardAmount,
  rewardInToken,
  onWithdrawSuccess,
  renderButton = true,
  settlementTxHash
}: WithdrawRewardsProps) {
  const [error, setError] = useState<string>('')

  const { address, isConnected, isCorrectNetwork } = useWalletContext()
  const { withdraw, hash, isPending, isConfirming, isSuccess, error: withdrawError } = useWithdraw()

  // Normalize addresses for comparison (remove 0x prefix and convert to lowercase)
  const normalizeAddress = (addr: string | undefined): string => {
    if (!addr) return ''
    return addr.toLowerCase().replace(/^0x/, '')
  }

  const isCorrectWallet = address && playerAddress &&
    normalizeAddress(address) === normalizeAddress(playerAddress)

  console.log('Withdraw wallet check:', {
    address,
    playerAddress,
    normalizedAccount: normalizeAddress(address),
    normalizedPlayer: normalizeAddress(playerAddress),
    isCorrectWallet
  })

  const handleWithdraw = async () => {
    if (!address || !isCorrectWallet) {
      setError("Please connect the correct wallet")
      return
    }

    if (!isCorrectNetwork) {
      setError(`Please switch to ${activeChain.name}`)
      return
    }

    try {
      setError('')
      console.log('💰 Withdrawing rewards...')

      // Call withdraw from wagmi hook
      withdraw()
    } catch (err) {
      console.error('❌ Error withdrawing rewards:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    }
  }

  // Watch for transaction errors
  if (withdrawError) {
    console.error('❌ Withdrawal error:', withdrawError)
    if (!error) {
      setError(`Transaction failed: ${withdrawError.message || 'Unknown error'}`)
    }
  }

  // Watch for transaction success
  if (isSuccess && hash && onWithdrawSuccess) {
    console.log('✅ Withdrawal successful:', hash)
    onWithdrawSuccess(hash)
  }

  // Handle successful withdrawal
  if (isSuccess && hash) {
    const explorerUrl = `${activeChain.blockExplorers?.default.url}/tx/${hash}`

    return (
      <Card className="p-4 bg-green-900/50 border-green-500/50 rounded-none backdrop-blur-sm">
        <div className="text-center space-y-1">
          <div className="text-green-400 text-2xl mb-2">✅</div>
          <div className="text-green-300 font-bold font-press-start mb-3">Rewards Withdrawn!</div>

          {/* Settlement Hash */}
          {settlementTxHash && (
            <div className="text-xs font-press-start mb-2">
              <span className="text-yellow-300">Settlement: </span>
              <a
                href={`${activeChain.blockExplorers?.default.url}/tx/${settlementTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-400 hover:text-blue-300 underline break-all"
              >
                {settlementTxHash.slice(0, 10)}...{settlementTxHash.slice(-8)}
              </a>
            </div>
          )}

          {/* Withdrawal Transaction */}
          <div className="text-xs font-press-start mb-2">
            <span className="text-green-300">Transaction: </span>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 underline break-all"
            >
              {hash.slice(0, 10)}...{hash.slice(-8)}
            </a>
          </div>

          {/* Amount */}
          <div className="text-xs font-press-start">
            <span className="text-blue-300">Amount: </span>
            <span className="text-white font-bold">{rewardInToken} {activeChain.nativeCurrency.symbol}</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-gray-900/50 border-gray-500/50 rounded-none backdrop-blur-sm">
      <div className="text-center space-y-3">
        <h3 className="text-sm font-bold text-yellow-400 font-press-start mb-3">💰 TRANSACTION DETAILS</h3>

        {/* Settlement Hash */}
        {settlementTxHash && (
          <div className="text-xs font-press-start mb-2">
            <span className="text-yellow-300">Settlement: </span>
            <a
              href={`${activeChain.blockExplorers?.default.url}/tx/${settlementTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-400 hover:text-blue-300 underline break-all"
            >
              {settlementTxHash.slice(0, 10)}...{settlementTxHash.slice(-8)}
            </a>
          </div>
        )}

        {/* Amount */}
        <div className="text-xs font-press-start mb-4">
          <span className="text-blue-300">Amount: </span>
          <span className="text-white font-bold">{rewardInToken} {activeChain.nativeCurrency.symbol}</span>
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={isPending || isConfirming || !isCorrectWallet || !isConnected || !isCorrectNetwork}
          variant="pixel"
          size="pixelLarge"
          className="w-full"
        >
          {isPending || isConfirming ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin">⏳</div>
              <span>{isPending ? 'CONFIRM IN WALLET...' : 'WITHDRAWING...'}</span>
            </div>
          ) : (
            `💰 WITHDRAW ${rewardInToken} ${activeChain.nativeCurrency.symbol}`
          )}
        </Button>

        {error && (
          <div className="text-red-400 text-sm font-press-start">
            ❌ {error}
          </div>
        )}

        {address && playerAddress && !isCorrectWallet && (
          <div className="text-yellow-400 text-sm font-press-start">
            ⚠️ Wrong wallet connected
            <div className="text-xs text-gray-400 mt-1">
              Connected: {normalizeAddress(address).slice(0, 8)}...
              <br />
              Expected: {normalizeAddress(playerAddress).slice(0, 8)}...
            </div>
          </div>
        )}

        {isConnected && !isCorrectNetwork && (
          <div className="text-yellow-400 text-sm font-press-start">
            ⚠️ Wrong network! Switch to {activeChain.name}
          </div>
        )}
      </div>
    </Card>
  )
}
