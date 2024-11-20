import { Address } from '@ton/core'
import {
  WalletContractV3R2,
  WalletContractV4,
  WalletContractV5R1,
} from '@ton/ton'

export enum WalletVersion {
  V3R2 = 'V3R2',
  V4R2 = 'V4R2',
  V5R1 = 'V5R1',
}

export type Wallet = {
  version: WalletVersion
  wallet: WalletContractV3R2 | WalletContractV4 | WalletContractV5R1
  address: Address
  balance: bigint
  isDeployed: boolean
}

export type State = {
  mnemonic: string[]
  wallets: Record<WalletVersion, Wallet>
  recipient: string
  amount: string
  memo: string
  signature: string
  fee: string
}

export type Action =
  | { type: 'SET_MNEMONIC'; payload: string[] }
  | { type: 'SET_RECIPIENT'; payload: string }
  | { type: 'SET_AMOUNT'; payload: string }
  | { type: 'SET_MEMO'; payload: string }
  | { type: 'SET_FEE'; payload: string }
  | { type: 'SET_SIGNATURE'; payload: string }
  | {
      type: 'SET_WALLET'
      payload: {
        version: WalletVersion
        wallet?: WalletContractV3R2 | WalletContractV4 | WalletContractV5R1
        address?: Address
        balance?: bigint
        isDeployed?: boolean
      }
    }

export const initialState: State = {
  mnemonic: [],
  wallets: {} as Record<WalletVersion, Wallet>,
  recipient: '0QAybjHWkd6dQazm5Sod1Ljax5sJtiGa83WYo-hyfini2sYa',
  amount: '0.01',
  memo: '',
  signature: '',
  fee: '',
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_WALLET': {
      const version = action.payload.version
      const oldWallets = state.wallets
      const oldWallet = oldWallets[version]
      return {
        ...state,
        wallets: {
          ...oldWallets,
          [version]: {
            ...oldWallet,
            ...action.payload,
          },
        },
      }
    }
    case 'SET_MNEMONIC':
      return { ...state, mnemonic: action.payload }
    case 'SET_SIGNATURE':
      return { ...state, signature: action.payload }
    case 'SET_RECIPIENT':
      return { ...state, recipient: action.payload }
    case 'SET_AMOUNT':
      return { ...state, amount: action.payload }
    case 'SET_MEMO':
      return { ...state, memo: action.payload }
    case 'SET_FEE':
      return { ...state, fee: action.payload }
    default:
      return state
  }
}
