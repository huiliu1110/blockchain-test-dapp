/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_NETWORK: string
  readonly VITE_PUBLIC_MEMPOOL_API: string
  readonly VITE_PUBLIC_RPC_URL: string
  readonly VITE_PUBLIC_API_URL: string
  readonly VITE_WALLET_CONNECT_PROJECT_ID?: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  okxwallet: WalletProvider
  $onekey: WalletProvider
  bitcoin: WalletProvider
  btcwallet: WalletProvider
  cosmos: WalletProvider
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
    on?: (event: string, listener: (...args: unknown[]) => void) => void
    removeListener?: (
      event: string,
      listener: (...args: unknown[]) => void,
    ) => void
  }
}
