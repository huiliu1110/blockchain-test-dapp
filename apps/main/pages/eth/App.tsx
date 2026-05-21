import { useEffect, useState } from 'react'
import { Separator } from '@ui/components'
import {
  useBalance,
  useChains,
  useConnection,
  useSwitchChain,
} from 'wagmi'

import { ConnectButton } from './components/ConnectButton'
import { ConnectionError } from './components/ConnectionError'
import { Header } from './components/Header'
import { WalletConnectModal } from './components/WalletConnectModal'
import { WalletInfo } from './components/WalletInfo'
import { useImTokenAccountInfo } from './hooks/useImTokenAccountInfo'
import { formatConnectionError } from './utils/formatConnectionError'

export default function App() {
  const { address, chain, chainId, isConnected } = useConnection()
  const imTokenAccount = useImTokenAccountInfo()
  const chains = useChains()
  const {
    switchChain,
    isPending: isSwitchingChain,
    error: switchChainError,
  } = useSwitchChain()
  const { data: balance } = useBalance({
    address,
    query: { enabled: isConnected && !!address },
  })

  const [wcUri, setWcUri] = useState<string | null>(null)
  const [wcConnecting, setWcConnecting] = useState(false)
  const [wcError, setWcError] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected) {
      setWcUri(null)
      setWcConnecting(false)
      setWcError(null)
      setConnectionError(null)
    }
  }, [isConnected])

  useEffect(() => {
    if (switchChainError) {
      setConnectionError(formatConnectionError(switchChainError))
    }
  }, [switchChainError])

  const closeWalletConnectModal = () => {
    setWcUri(null)
    setWcConnecting(false)
    setWcError(null)
  }

  const handleChainChange = (id: number) => {
    setConnectionError(null)
    switchChain({ chainId: id })
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
              setConnectionError(null)
            }}
            onWalletConnectUri={setWcUri}
            onWalletConnectError={(message) => {
              setWcError(message)
              setWcConnecting(false)
            }}
            onConnectionError={setConnectionError}
          />
          {connectionError && (
            <ConnectionError
              message={connectionError}
              onDismiss={() => setConnectionError(null)}
            />
          )}
        </div>
        <Separator />
        <WalletInfo
          address={address}
          walletId={imTokenAccount?.walletId}
          chainId={chainId}
          chainName={chain?.name}
          balance={balance}
          chains={chains}
          isSwitchingChain={isSwitchingChain}
          onChainChange={handleChainChange}
        />
        <Separator />
      </div>
    </>
  )
}
