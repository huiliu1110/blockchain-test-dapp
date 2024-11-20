import { fromNano } from '@ton/core'
import { walletAddressToString } from '../App'
import { Wallet } from '../state'

export function WalletInfo({ version, isDeployed, address, balance }: Wallet) {
  return (
    <div className="p-5" style={{ maxWidth: '100%' }}>
      <div className="mt-2">
        <span>Version: </span>
        <code className="rounded bg-muted text-sm break-all">{version}</code>
      </div>
      <div className="mt-2">
        <span>Address: </span>
        <code className="rounded bg-muted text-sm break-all">
          {walletAddressToString(address)}
        </code>
      </div>
      <div className="mt-2">
        <span>Balance: </span>
        <code className="rounded bg-muted text-sm break-all">
          {balance !== undefined ? fromNano(balance ?? '') : ''}
        </code>
      </div>
      <div className="mt-2">
        <span>Deployed: </span>
        <code className="rounded bg-muted text-sm break-all">
          {isDeployed?.toString()}
        </code>
      </div>
    </div>
  )
}
