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
  balance?: bigint
  jettonBalance?: bigint
  isDeployed?: boolean
}

export type State = {
  mnemonic: string[]
  version: WalletVersion
  wallet: Wallet
  token: string
  recipient: string
  amount: string
  memo: string
  fee: string
  signature: string
}

export type Action =
  | { type: 'SET_MNEMONIC'; payload: string[] }
  | { type: 'SET_VERSION'; payload: WalletVersion }
  | { type: 'SET_WALLET'; payload: Wallet }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'SET_RECIPIENT'; payload: string }
  | { type: 'SET_AMOUNT'; payload: string }
  | { type: 'SET_MEMO'; payload: string }
  | { type: 'SET_FEE'; payload: string }
  | { type: 'SET_SIGNATURE'; payload: string }

export const initialState: State = {
  mnemonic: [],
  version: WalletVersion.V5R1,
  wallet: {} as Wallet,
  token: 'AIOTX',
  recipient: '0QAybjHWkd6dQazm5Sod1Ljax5sJtiGa83WYo-hyfini2sYa',
  amount: '0.01',
  memo: '',
  fee: '',
  signature: '',
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_MNEMONIC':
      return { ...state, mnemonic: action.payload }
    case 'SET_VERSION':
      return { ...state, version: action.payload }
    case 'SET_WALLET':
      return { ...state, wallet: action.payload }
    case 'SET_TOKEN':
      return { ...state, token: action.payload }
    case 'SET_RECIPIENT':
      return { ...state, recipient: action.payload }
    case 'SET_AMOUNT':
      return { ...state, amount: action.payload }
    case 'SET_MEMO':
      return { ...state, memo: action.payload }
    case 'SET_FEE':
      return { ...state, fee: action.payload }
    case 'SET_SIGNATURE':
      return { ...state, signature: action.payload }
    default:
      return state
  }
}
