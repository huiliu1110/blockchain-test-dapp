import QRCode from 'react-qr-code'
import { Loader2, X } from 'lucide-react'
import { Button } from '@ui/components'
import { WALLET_CONNECT_ALLOWLIST_HINT } from '../constants'

type WalletConnectModalProps = {
  uri: string | null
  isConnecting: boolean
  error: string | null
  onClose: () => void
}

export function WalletConnectModal({
  uri,
  isConnecting,
  error,
  onClose,
}: WalletConnectModalProps) {
  if (!isConnecting && !uri && !error) return null

  const copyUri = async () => {
    if (!uri) return
    await navigator.clipboard.writeText(uri)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="WalletConnect QR code"
    >
      <div className="relative w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg">
        <button
          type="button"
          className="absolute right-3 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="mb-1 text-center text-lg font-semibold">WalletConnect</h3>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          {error ? 'Connection failed' : 'Scan with your mobile wallet'}
        </p>
        {error ? (
          <div className="mb-4 space-y-2 text-center text-sm text-destructive">
            <p>{error}</p>
            <p className="text-xs text-muted-foreground">
              {WALLET_CONNECT_ALLOWLIST_HINT}
            </p>
            <p className="text-xs text-muted-foreground">
              Configure at{' '}
              <a
                href="https://dashboard.reown.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                dashboard.reown.com
              </a>
            </p>
          </div>
        ) : (
          <div className="mx-auto flex h-[246px] w-[246px] items-center justify-center rounded-lg bg-white p-3">
            {uri ? (
              <QRCode value={uri} size={220} />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                {import.meta.env.DEV && (
                  <p className="max-w-[200px] text-center text-xs text-muted-foreground">
                    {WALLET_CONNECT_ALLOWLIST_HINT}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        <div className="mt-4 flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={copyUri}
            disabled={!uri}
          >
            Copy link
          </Button>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
