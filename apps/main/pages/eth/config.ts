import { createConfig, http, injected } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { walletConnect } from 'wagmi/connectors'

import { imToken } from './connectors/imToken'
import { DAPP_METADATA, WALLET_CONNECT_PROJECT_ID } from './constants'

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [
    injected(),
    imToken(),
    walletConnect({
      projectId: WALLET_CONNECT_PROJECT_ID,
      metadata: DAPP_METADATA,
      showQrModal: false,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})
