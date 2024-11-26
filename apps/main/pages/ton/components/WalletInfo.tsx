import { fromNano } from '@ton/core'
import { walletAddressToString } from '../App'
import { Wallet } from '../state'

export function WalletInfo({
  version,
  isDeployed,
  address,
  balance,
  jettonBalance,
}: Wallet) {
  return (
    <div className="p-5" style={{ maxWidth: '100%' }}>
      <div className="mt-2">
        <span>Wallet Contract Version: </span>
        <code className="rounded bg-muted text-sm break-all">{version}</code>
      </div>
      <div className="mt-2">
        <span>Wallet Address: </span>
        <code className="rounded bg-muted text-sm break-all">
          {walletAddressToString(address)}
        </code>
      </div>
      <div className="mt-2">
        <span>Wallet Contract Deployed: </span>
        <code className="rounded bg-muted text-sm break-all">
          {isDeployed?.toString()}
        </code>
      </div>
      <div className="mt-2">
        <span>TON Balance: </span>
        <code className="rounded bg-muted text-sm break-all">
          {balance !== undefined ? fromNano(balance ?? '') : ''}
        </code>
      </div>
      <div className="mt-2">
        <span>Jetton Token Address: </span>
        <code className="rounded bg-muted text-sm break-all">
          kQAiboDEv_qRrcEdrYdwbVLNOXBHwShFbtKGbQVJ2OKxY_Di
        </code>
      </div>
      <div className="mt-2">
        <span>Jetton Token Symbol: </span>
        <code className="rounded bg-muted text-sm break-all">AIOTX</code>
      </div>
      <div className="mt-2">
        <span>Jetton Token Balance: </span>
        <code className="rounded bg-muted text-sm break-all">
          {jettonBalance !== undefined ? fromNano(jettonBalance ?? '') : ''}
        </code>
      </div>
    </div>
  )
}
