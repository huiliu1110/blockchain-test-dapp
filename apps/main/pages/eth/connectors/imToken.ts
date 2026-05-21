import {
  ChainNotConfiguredError,
  createConnector,
  ProviderNotFoundError,
  type Storage,
} from 'wagmi'

import { formatConnectionError } from '../utils/formatConnectionError'
import {
  type Address,
  fromHex,
  getAddress,
  numberToHex,
  type ProviderRpcError,
  SwitchChainError,
  UserRejectedRequestError,
} from 'viem'

/** Response from `imToken_requestWalletId` */
export type ImTokenWalletIdResponse = string

/** Persisted account info (`chainId` from `eth_chainId`) */
export type ImTokenAccountInfo = {
  walletId: string
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

export const IMTOKEN_STORAGE_KEY = 'imToken.accountInfo'

function getImTokenProvider(): EthereumProvider | undefined {
  if (typeof window === 'undefined') return undefined
  const provider = window.ethereum as EthereumProvider | undefined
  if (!provider?.request) return undefined
  return provider
}

function getProviderOrThrow(): EthereumProvider {
  const provider = getImTokenProvider()
  if (!provider) throw new ProviderNotFoundError()
  return provider
}

export function parseStoredAccountInfo(data: unknown): ImTokenAccountInfo {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid imToken account info storage')
  }
  const stored = data as ImTokenAccountInfo & { identifier?: string }
  const walletId = stored.walletId ?? stored.identifier
  const { address, chainId } = stored
  if (!walletId || !address || typeof chainId !== 'number') {
    throw new Error('Invalid imToken account info storage')
  }
  return {
    walletId,
    address: getAddress(address),
    chainId,
  }
}

export async function readImTokenAccountInfo(
  storage: Storage | null | undefined,
): Promise<ImTokenAccountInfo | undefined> {
  const stored = await storage?.getItem(IMTOKEN_STORAGE_KEY)
  if (!stored) return undefined
  return parseStoredAccountInfo(stored)
}

async function fetchChainId(provider: EthereumProvider): Promise<number> {
  const chainId = await provider.request({ method: 'eth_chainId' })
  if (typeof chainId === 'string' && chainId.startsWith('0x')) {
    return fromHex(chainId as `0x${string}`, 'number')
  }
  return Number(chainId)
}

imToken.type = 'imToken' as const

export function imToken() {
  let accountInfo: ImTokenAccountInfo | undefined
  let accountsChanged: ((...args: unknown[]) => void) | undefined
  let chainChanged: ((...args: unknown[]) => void) | undefined
  let onDisconnectListener: ((...args: unknown[]) => void) | undefined

  return createConnector<EthereumProvider>((config) => ({
    id: 'imToken',
    name: 'imToken',
    type: imToken.type,

    async setup() {
      const stored = await config.storage?.getItem(IMTOKEN_STORAGE_KEY)
      if (stored) {
        accountInfo = parseStoredAccountInfo(stored)
      }
    },

    async connect<withCapabilities extends boolean = false>(
      {
        chainId,
        isReconnecting,
        withCapabilities: withCapabilitiesParam,
      }: {
        chainId?: number
        isReconnecting?: boolean
        withCapabilities?: boolean | withCapabilities
      } = {},
    ) {
      const provider = getProviderOrThrow()

      const toConnectResult = (
        accounts: readonly Address[],
        chainIdResult: number,
      ) =>
        ({
          accounts: withCapabilitiesParam
            ? accounts.map((address) => ({
                address,
                capabilities: {} as Record<string, unknown>,
              }))
            : accounts,
          chainId: chainIdResult,
        }) as {
          accounts: withCapabilities extends true
            ? readonly {
                address: Address
                capabilities: Record<string, unknown>
              }[]
            : readonly Address[]
          chainId: number
        }

      if (isReconnecting && accountInfo?.address) {
        const currentChainId = await fetchChainId(provider)
        accountInfo = { ...accountInfo, chainId: currentChainId }
        await config.storage?.setItem(IMTOKEN_STORAGE_KEY, accountInfo)
        return toConnectResult([accountInfo.address], currentChainId)
      }

      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts',
        })
        if (!Array.isArray(accounts) || accounts.length === 0) {
          throw new Error('No accounts returned from eth_requestAccounts')
        }

        const walletIdResult = await provider.request({
          method: 'imToken_requestWalletId',
        })
        if (typeof walletIdResult !== 'string') {
          throw new Error('Invalid imToken wallet id response')
        }
        const address = getAddress(accounts[0] as string)
        const walletId = walletIdResult

        let currentChainId = await fetchChainId(provider)

        accountInfo = { walletId, address, chainId: currentChainId }

        if (chainId && currentChainId !== chainId) {
          const chain = await this.switchChain!({ chainId }).catch((error) => {
            if (error instanceof UserRejectedRequestError) throw error
            return { id: currentChainId }
          })
          currentChainId = chain?.id ?? currentChainId
          accountInfo = { ...accountInfo, chainId: currentChainId }
        }

        await config.storage?.setItem(IMTOKEN_STORAGE_KEY, accountInfo)

        if (!config.chains.some((chain) => chain.id === currentChainId)) {
          throw new ChainNotConfiguredError()
        }

        if (!accountsChanged) {
          accountsChanged = (...args: unknown[]) => {
            this.onAccountsChanged(args[0] as string[])
          }
          provider.on?.('accountsChanged', accountsChanged)
        }
        if (!chainChanged) {
          chainChanged = (...args: unknown[]) => {
            this.onChainChanged(args[0] as string)
          }
          provider.on?.('chainChanged', chainChanged)
        }
        if (!onDisconnectListener) {
          onDisconnectListener = () => {
            void this.onDisconnect()
          }
          provider.on?.('disconnect', onDisconnectListener)
        }

        return toConnectResult([accountInfo.address], currentChainId)
      } catch (error) {
        console.log('error', error)
        const err = error as ProviderRpcError
        if (err?.code === 4001) {
          throw new UserRejectedRequestError(err)
        }
        throw new Error(formatConnectionError(error))
      }
    },

    async disconnect() {
      const provider = getImTokenProvider()
      accountInfo = undefined
      await config.storage?.removeItem(IMTOKEN_STORAGE_KEY)

      if (accountsChanged && provider?.removeListener) {
        provider.removeListener('accountsChanged', accountsChanged)
        accountsChanged = undefined
      }
      if (chainChanged && provider?.removeListener) {
        provider.removeListener('chainChanged', chainChanged)
        chainChanged = undefined
      }
      if (onDisconnectListener && provider?.removeListener) {
        provider.removeListener('disconnect', onDisconnectListener)
        onDisconnectListener = undefined
      }
    },

    async getAccounts() {
      if (!accountInfo?.address) {
        return []
      }
      return [accountInfo.address]
    },

    async getChainId() {
      const provider = getProviderOrThrow()
      const chainId = await fetchChainId(provider)
      if (accountInfo) {
        accountInfo = { ...accountInfo, chainId }
        void config.storage?.setItem(IMTOKEN_STORAGE_KEY, accountInfo)
      }
      return chainId
    },

    async getProvider() {
      return getProviderOrThrow()
    },

    async isAuthorized() {
      return !!accountInfo?.address
    },

    async switchChain({ chainId }) {
      const provider = getProviderOrThrow()
      const chain = config.chains.find((c) => c.id === chainId)
      if (!chain) throw new SwitchChainError(new ChainNotConfiguredError())

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: numberToHex(chainId) }],
        })
      } catch (error) {
        console.log('error', error)
        const err = error as ProviderRpcError
        if (err?.code === 4001) {
          throw new UserRejectedRequestError(err)
        }
        throw new Error(formatConnectionError(error))
      }

      const currentChainId = await fetchChainId(provider)
      if (accountInfo) {
        accountInfo = { ...accountInfo, chainId: currentChainId }
        await config.storage?.setItem(IMTOKEN_STORAGE_KEY, accountInfo)
      }

      return chain
    },

    onAccountsChanged(accounts) {
      if (!accounts.length) {
        this.onDisconnect()
        return
      }
      if (accountInfo && accounts[0]) {
        accountInfo = { ...accountInfo, address: getAddress(accounts[0]) }
        void config.storage?.setItem(IMTOKEN_STORAGE_KEY, accountInfo)
      }
      config.emitter.emit('change', {
        accounts: accounts.map((a) => getAddress(a)),
      })
    },

    onChainChanged(chainId) {
      const id =
        typeof chainId === 'string' && chainId.startsWith('0x')
          ? fromHex(chainId as `0x${string}`, 'number')
          : Number(chainId)
      if (accountInfo) {
        accountInfo = { ...accountInfo, chainId: id }
        void config.storage?.setItem(IMTOKEN_STORAGE_KEY, accountInfo)
      }
      config.emitter.emit('change', { chainId: id })
    },

    onDisconnect() {
      void this.disconnect()
      config.emitter.emit('disconnect')
    },
  }))
}
