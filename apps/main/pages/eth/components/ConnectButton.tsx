import { useState } from 'react'
import type { ReactNode } from 'react'
import { Cable, Smartphone, Unplug, Wallet } from 'lucide-react'
import type { Connector } from 'wagmi'
import { Button } from '@ui/components'
import { useConnect, useConnection, useConnectors, useDisconnect } from 'wagmi'

import { formatConnectionError } from '../utils/formatConnectionError'

function ConnectorButton({
  connector,
  label,
  icon,
  isPending,
  pendingConnectorId,
  onConnect,
}: {
  connector: Connector
  label: string
  icon: ReactNode
  isPending: boolean
  pendingConnectorId?: string
  onConnect: (connector: Connector) => void
}) {
  const isThisPending = isPending && pendingConnectorId === connector.id

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() => onConnect(connector)}
    >
      {icon}
      {isThisPending ? 'Connecting...' : label}
    </Button>
  )
}

type ConnectButtonProps = {
  onWalletConnectStart: () => void
  onWalletConnectUri: (uri: string) => void
  onWalletConnectError: (message: string) => void
  onConnectionError: (message: string | null) => void
}

export function ConnectButton({
  onWalletConnectStart,
  onWalletConnectUri,
  onWalletConnectError,
  onConnectionError,
}: ConnectButtonProps) {
  const { address, isConnected, connector: activeConnector } = useConnection()
  const { connectAsync, isPending, variables } = useConnect()
  const { disconnect } = useDisconnect()
  const connectors = useConnectors()
  const [imTokenPending, setImTokenPending] = useState(false)

  const injectedConnectors = connectors.filter((c) => c.type === 'injected')
  const imTokenConnector = connectors.find((c) => c.id === 'imToken')
  const walletConnectConnector = connectors.find((c) => c.type === 'walletConnect')

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-center gap-2">
        {activeConnector && (
          <p className="text-sm text-muted-foreground">
            Connected via {activeConnector.name}
          </p>
        )}
        <Button variant="destructive" onClick={() => disconnect()}>
          <Unplug className="mr-2 h-4 w-4" /> Disconnect Wallet
        </Button>
      </div>
    )
  }

  const reportError = (error: unknown) => {
    onConnectionError(formatConnectionError(error))
  }

  const handleWalletConnect = async (connector: Connector) => {
    onConnectionError(null)
    onWalletConnectStart()

    const onUri = (uri: string) => {
      if (uri) onWalletConnectUri(uri)
    }

    const onMessage = (message: { type: string; data?: unknown }) => {
      if (message.type === 'display_uri' && typeof message.data === 'string') {
        onUri(message.data)
      }
    }

    connector.emitter.on('message', onMessage)

    type WcProvider = {
      session?: unknown
      on: (event: string, cb: (uri: string) => void) => void
      off: (event: string, cb: (uri: string) => void) => void
      events?: {
        on: (event: string, cb: (uri: string) => void) => void
        off: (event: string, cb: (uri: string) => void) => void
      }
      signer?: {
        on: (event: string, cb: (uri: string) => void) => void
        off: (event: string, cb: (uri: string) => void) => void
      }
    }

    let provider: WcProvider | undefined

    const cleanup = () => {
      connector.emitter.off('message', onMessage)
      provider?.off?.('display_uri', onUri)
      provider?.events?.off('display_uri', onUri)
      provider?.signer?.off('display_uri', onUri)
    }

    try {
      provider = (await connector.getProvider()) as WcProvider

      // Clear stale session so a new pairing URI is always generated
      if (provider.session) {
        await connector.disconnect()
        provider = (await connector.getProvider()) as WcProvider
      }

      provider.on('display_uri', onUri)
      provider.events?.on('display_uri', onUri)
      provider.signer?.on('display_uri', onUri)

      await connectAsync({ connector })
    } catch (error) {
      const message = formatConnectionError(error)
      onWalletConnectError(message)
      onConnectionError(message)
    } finally {
      cleanup()
    }
  }

  const handleImTokenConnect = async () => {
    if (!imTokenConnector) return
    onConnectionError(null)
    setImTokenPending(true)
    try {
      await connectAsync({ connector: imTokenConnector })
    } catch (error) {
      reportError(error)
    } finally {
      setImTokenPending(false)
    }
  }

  const handleConnect = async (connector: Connector) => {
    if (connector.type === 'walletConnect') {
      await handleWalletConnect(connector)
      return
    }

    onConnectionError(null)
    try {
      await connectAsync({ connector })
    } catch (error) {
      reportError(error)
    }
  }

  const pendingConnector =
    variables?.connector && 'id' in variables.connector
      ? variables.connector
      : undefined
  const pendingConnectorId = pendingConnector?.id

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">Choose a connection method</p>
      <div className="flex flex-wrap justify-center gap-2">
        {injectedConnectors.map((connector) => (
          <ConnectorButton
            key={connector.id}
            connector={connector}
            label={`Injected: ${connector.name}`}
            icon={<Cable className="mr-2 h-4 w-4" />}
            isPending={isPending}
            pendingConnectorId={pendingConnectorId}
            onConnect={handleConnect}
          />
        ))}
        {imTokenConnector && (
          <Button
            variant="outline"
            disabled={isPending || imTokenPending}
            onClick={handleImTokenConnect}
          >
            <Wallet className="mr-2 h-4 w-4" />
            {imTokenPending ? 'Connecting...' : 'imToken'}
          </Button>
        )}
        {walletConnectConnector && (
          <ConnectorButton
            connector={walletConnectConnector}
            label="WalletConnect"
            icon={<Smartphone className="mr-2 h-4 w-4" />}
            isPending={isPending}
            pendingConnectorId={pendingConnectorId}
            onConnect={handleConnect}
          />
        )}
      </div>
      {injectedConnectors.length === 0 && !walletConnectConnector && (
        <Button disabled>No wallet connectors available</Button>
      )}
      {injectedConnectors.length === 0 && walletConnectConnector && (
        <p className="text-xs text-muted-foreground">
          No browser extension detected. Use WalletConnect to connect a mobile
          wallet.
        </p>
      )}
    </div>
  )
}
