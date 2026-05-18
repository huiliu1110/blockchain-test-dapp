/** https://dashboard.reown.com → Project → Allowlist → add http://localhost:5173 */
export const WALLET_CONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID ||
  '3ed8cc046c6211a798dc5ec70f1302b43e07db9639fd287de44a9aa115a21ed6'

function getAppUrl() {
  if (typeof window === 'undefined') {
    return 'https://blockchain-test-dapp.vercel.app'
  }
  return window.location.origin
}

export const DAPP_METADATA = {
  name: 'Ethereum Test DApp',
  description: 'Blockchain Test DApp',
  url: getAppUrl(),
  icons: [`${getAppUrl()}/logo.svg`],
}

export const WALLET_CONNECT_ALLOWLIST_HINT =
  'Add this origin to your WalletConnect (Reown) project allowlist: ' +
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
