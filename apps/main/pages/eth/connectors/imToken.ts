import {
  ChainNotConfiguredError,
  createConnector,
  ProviderNotFoundError,
} from 'wagmi'
import {
  type Address,
  fromHex,
  getAddress,
  numberToHex,
  type ProviderRpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from 'viem'

/** Response from `imToken_requestAccountInfo` (no chainId) */
export type ImTokenAccountInfoResponse = {
  identifier: string
  address: string
}

/** Persisted account info (`chainId` from `eth_chainId`) */
export type ImTokenAccountInfo = {
  identifier: string
  address: Address
  chainId: number
}

type EthereumProvider = {
  request: (args: {
    method: string
    params?: unknown[]
  }) => Promise<unknown>
  on?: (event: string, listener: (...args: unknown[]) => void) => void
  removeListener?: (
    event: string,
    listener: (...args: unknown[]) => void,
  ) => void
}

const STORAGE_KEY = 'imToken.accountInfo'

function getImTokenProvider(): EthereumProvider | undefined {
  if (typeof window === 'undefined') return undefined
  const provider = window.ethereum as EthereumProvider | undefined
  if (!provider?.request) return undefined
  return provider
}

function parseAccountInfoResponse(
  data: unknown,
): Pick<ImTokenAccountInfo, 'identifier' | 'address'> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid imToken account info response')
  }
  const { identifier, address } = data as ImTokenAccountInfoResponse
  if (!identifier || !address) {
    throw new Error('Invalid imToken account info response')
  }
  return { identifier, address: getAddress(address) }
}

function parseStoredAccountInfo(data: unknown): ImTokenAccountInfo {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid imToken account info storage')
  }
  const { identifier, address, chainId } = data as ImTokenAccountInfo
  if (!identifier || !address || typeof chainId !== 'number') {
    throw new Error('Invalid imToken account info storage')
  }
  return {
    identifier,
    address: getAddress(address),
    chainId,
  }
}

async function fetchChainId(provider: EthereumProvider): Promise<number> {
  const chainId = await provider.request({ method: 'eth_chainId' })
  if (typeof chainId === 'string') {
    return fromHex(chainId, 'number')
  }
  return Number(chainId)
}

imToken.type = 'imToken' as const

export function imToken() {
  let accountInfo: ImTokenAccountInfo | undefined
  let accountsChanged: ((accounts: string[]) => void) | undefined
  let chainChanged: ((chainId: string) => void) | undefined
  let disconnect: ((error?: unknown) => void) | undefined

  return createConnector<EthereumProvider>((config) => ({
    id: 'imToken',
    name: 'imToken',
    type: imToken.type,

    async setup() {
      const stored = await config.storage?.getItem(STORAGE_KEY)
      if (stored) {
        accountInfo = parseStoredAccountInfo(stored)
      }
    },

    async connect({ chainId, isReconnecting } = {}) {
      const provider = await this.getProvider()
      if (!provider) throw new ProviderNotFoundError()

      if (isReconnecting && accountInfo?.address) {
        const currentChainId = await fetchChainId(provider)
        accountInfo = { ...accountInfo, chainId: currentChainId }
        await config.storage?.setItem(STORAGE_KEY, accountInfo)
        return {
          accounts: [accountInfo.address],
          chainId: currentChainId,
        }
      }

      try {
        const result = await provider.request({
          method: 'imToken_requestAccountInfo',
          params: [],
        })
        const { identifier, address } = parseAccountInfoResponse(result)

        let currentChainId = await fetchChainId(provider)

        accountInfo = { identifier, address, chainId: currentChainId }

        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId }).catch((error) => {
            if (error instanceof UserRejectedRequestError) throw error
            return { id: currentChainId }
          })
          currentChainId = chain?.id ?? currentChainId
          accountInfo = { ...accountInfo, chainId: currentChainId }
        }

        await config.storage?.setItem(STORAGE_KEY, accountInfo)

        if (!config.chains.some((chain) => chain.id === currentChainId)) {
          throw new ChainNotConfiguredError()
        }

        if (!accountsChanged) {
          accountsChanged = this.onAccountsChanged.bind(this)
          provider.on?.('accountsChanged', accountsChanged)
        }
        if (!chainChanged) {
          chainChanged = this.onChainChanged.bind(this)
          provider.on?.('chainChanged', chainChanged)
        }
        if (!disconnect) {
          disconnect = this.onDisconnect.bind(this)
          provider.on?.('disconnect', disconnect)
        }

        return {
          accounts: [accountInfo.address],
          chainId: currentChainId,
        }
      } catch (error) {
        const err = error as ProviderRpcError
        if (err?.code === 4001) {
          throw new UserRejectedRequestError(err)
        }
        throw error
      }
    },

    async disconnect() {
      const provider = await this.getProvider()
      accountInfo = undefined
      await config.storage?.removeItem(STORAGE_KEY)

      if (accountsChanged && provider?.removeListener) {
        provider.removeListener('accountsChanged', accountsChanged)
        accountsChanged = undefined
      }
      if (chainChanged && provider?.removeListener) {
        provider.removeListener('chainChanged', chainChanged)
        chainChanged = undefined
      }
      if (disconnect && provider?.removeListener) {
        provider.removeListener('disconnect', disconnect)
        disconnect = undefined
      }
    },

    async getAccounts() {
      if (!accountInfo?.address) {
        return []
      }
      return [accountInfo.address]
    },

    async getChainId() {
      const provider = await this.getProvider()
      if (!provider) throw new ProviderNotFoundError()
      const chainId = await fetchChainId(provider)
      if (accountInfo) {
        accountInfo = { ...accountInfo, chainId }
        void config.storage?.setItem(STORAGE_KEY, accountInfo)
      }
      return chainId
    },

    async getProvider() {
      const provider = getImTokenProvider()
      if (!provider) throw new ProviderNotFoundError()
      return provider
    },

    async isAuthorized() {
      return !!accountInfo?.address
    },

    async switchChain({ chainId }) {
      const provider = await this.getProvider()
      const chain = config.chains.find((c) => c.id === chainId)
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError())

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: numberToHex(chainId) }],
        })
      } catch (error) {
        const err = error as ProviderRpcError
        if (err?.code === 4001) {
          throw new UserRejectedRequestError(err)
        }
        throw error
      }

      const currentChainId = await fetchChainId(provider)
      if (accountInfo) {
        accountInfo = { ...accountInfo, chainId: currentChainId }
        await config.storage?.setItem(STORAGE_KEY, accountInfo)
      }

      return chain
    },

    onAccountsChanged(accounts) {
      if (!accounts.length) {
        this.onDisconnect()
        return
      }
      if (accountInfo) {
        accountInfo = { ...accountInfo, address: getAddress(accounts[0]!) }
        void config.storage?.setItem(STORAGE_KEY, accountInfo)
      }
      config.emitter.emit('change', {
        accounts: accounts.map((a) => getAddress(a)),
      })
    },

    onChainChanged(chainId) {
      const id =
        typeof chainId === 'string' && chainId.startsWith('0x')
          ? fromHex(chainId, 'number')
          : Number(chainId)
      if (accountInfo) {
        accountInfo = { ...accountInfo, chainId: id }
        void config.storage?.setItem(STORAGE_KEY, accountInfo)
      }
      config.emitter.emit('change', { chainId: id })
    },

    onDisconnect() {
      void this.disconnect()
      config.emitter.emit('disconnect')
    },
  }))
}
