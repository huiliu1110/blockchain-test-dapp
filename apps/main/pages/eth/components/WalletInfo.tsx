import { formatEther } from 'viem'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components'

type WalletInfoProps = {
  address?: string
  walletId?: string
  chainId?: number
  chainName?: string
  balance?: { value: bigint; symbol: string; decimals: number }
  chains: readonly { id: number; name: string }[]
  onChainChange: (chainId: number) => void
  isSwitchingChain: boolean
}

export function WalletInfo({
  address,
  walletId,
  chainId,
  chainName,
  balance,
  chains,
  onChainChange,
  isSwitchingChain,
}: WalletInfoProps) {
  if (!address) {
    return (
      <p className="p-5 text-center text-muted-foreground">
        Connect a wallet to view account details.
      </p>
    )
  }

  return (
    <div className="p-5" style={{ maxWidth: '100%' }}>
      <div className="mt-2">
        <span>Address: </span>
        <code className="rounded bg-muted text-sm break-all">{address}</code>
      </div>
      {walletId && (
        <div className="mt-2">
          <span>Wallet ID: </span>
          <code className="rounded bg-muted text-sm break-all">{walletId}</code>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span>Network: </span>
        <Select
          value={chainId?.toString()}
          onValueChange={(value) => onChainChange(Number(value))}
          disabled={isSwitchingChain}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {chains.map((chain) => (
              <SelectItem key={chain.id} value={chain.id.toString()}>
                {chain.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {chainName && (
          <code className="rounded bg-muted text-sm">{chainName}</code>
        )}
      </div>
      <div className="mt-2">
        <span>Balance: </span>
        <code className="rounded bg-muted text-sm break-all">
          {balance
            ? `${formatEther(balance.value)} ${balance.symbol}`
            : 'Loading...'}
        </code>
      </div>
    </div>
  )
}
