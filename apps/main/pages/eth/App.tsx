import { useEffect, useState } from 'react'
import { Separator } from '@ui/components'
import {
  useBalance,
  useChains,
  useConnection,
  useSwitchChain,
} from 'wagmi'

import { ConnectButton } from './components/ConnectButton'
import { Header } from './components/Header'
import { WalletConnectModal } from './components/WalletConnectModal'
import { WalletInfo } from './components/WalletInfo'

export default function App() {
  const { address, chain, chainId, isConnected } = useConnection()
  const chains = useChains()
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain()
  const { data: balance } = useBalance({
    address,
    query: { enabled: isConnected && !!address },
  })

  const [wcUri, setWcUri] = useState<string | null>(null)
  const [wcConnecting, setWcConnecting] = useState(false)
  const [wcError, setWcError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected) {
      setWcUri(null)
      setWcConnecting(false)
      setWcError(null)
    }
  }, [isConnected])

  const closeWalletConnectModal = () => {
    setWcUri(null)
    setWcConnecting(false)
    setWcError(null)
  }

  return (
    <>
      <WalletConnectModal
        uri={wcUri}
        isConnecting={wcConnecting}
        error={wcError}
        onClose={closeWalletConnectModal}
      />
      <div className="mt-4 grid w-full max-w-5xl mx-auto gap-2">
        <Header />
        <Separator />
        <div className="p-5 text-center">
          <ConnectButton
            onWalletConnectStart={() => {
              setWcConnecting(true)
              setWcUri(null)
              setWcError(null)
            }}
            onWalletConnectUri={setWcUri}
            onWalletConnectError={(message) => {
              setWcError(message)
              setWcConnecting(false)
            }}
          />
        </div>
        <Separator />
        <WalletInfo
          address={address}
          chainId={chainId}
          chainName={chain?.name}
          balance={balance}
          chains={chains}
          isSwitchingChain={isSwitchingChain}
          onChainChange={(id) => switchChain({ chainId: id })}
        />
        <Separator />
      </div>
    </>
  )
}
