import { useReducer } from 'react'
import { mnemonicNew, KeyPair } from '@ton/crypto'
import { WalletContractV3R2 } from '@ton/ton/dist/wallets/WalletContractV3R2'
import { WalletContractV4 } from '@ton/ton/dist/wallets/WalletContractV4'
import { WalletContractV5R1 } from '@ton/ton/dist/wallets/WalletContractV5R1'
import {
  keyPairFromSeed,
  mnemonicToPrivateKey,
  mnemonicValidate as validateStandardTonMnemonic,
} from '@ton/crypto'
import { mnemonicToSeed, validateMnemonic as validBip39Mnemonic } from 'bip39'
import { Separator, useToast } from '@ui/components'
import { initialState, reducer, WalletVersion } from './state'
import { Header } from './components/Header'
import { WalletInfo } from './components/WalletInfo'
import { Mnemonic } from './components/Mnemonic'
import { SignTx } from './components/SignTx'
import { deriveED25519Path } from './ed25519'
import { Address, internal, toNano, comment, SendMode } from '@ton/core'
import { TonClient } from '@ton/ton/dist/client/TonClient'
import { getHttpEndpoint } from '@orbs-network/ton-access'
import { fromNano } from '@ton/core'

async function bip39ToPrivateKey(mnemonic: string[]) {
  const seed = await mnemonicToSeed(mnemonic.join(' '))
  const TON_DERIVATION_PATH = "m/44'/607'/0'"
  const seedContainer = deriveED25519Path(
    TON_DERIVATION_PATH,
    seed.toString('hex'),
  )
  return keyPairFromSeed(seedContainer.key)
}

export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

const mnemonicToKeyPair = async (mnemonic: string): Promise<KeyPair> => {
  const mnemonicArr = mnemonic.split(' ')
  let keyPair = null

  if (await validateStandardTonMnemonic(mnemonicArr)) {
    keyPair = await mnemonicToPrivateKey(mnemonicArr)
  } else if (await validBip39Mnemonic(mnemonic)) {
    keyPair = await bip39ToPrivateKey(mnemonicArr)
  }

  if (!keyPair) {
    throw new Error('Invalid mnemonic')
  }

  return keyPair
}

const mnemonicToKeyPairHex = async (
  mnemonic: string,
): Promise<{
  publicKey: string
  secretKey: string
}> => {
  const keyPair = await mnemonicToKeyPair(mnemonic)
  const { publicKey, secretKey } = keyPair

  if (!publicKey || !secretKey) {
    throw new Error('Invalid mnemonic')
  }

  return {
    publicKey: Buffer.from(publicKey).toString('hex'),
    secretKey: Buffer.from(secretKey).toString('hex'),
  }
}

const mnemonicToWallet = async (
  mnemonic: string,
  walletVersion: WalletVersion = WalletVersion.V5R1,
) => {
  const { publicKey } = await mnemonicToKeyPairHex(mnemonic)

  if (!publicKey) {
    throw new Error('Invalid mnemonic')
  }

  const walletContract =
    (walletVersion === WalletVersion.V3R2 && WalletContractV3R2) || // tonweb.wallet.all.v3R2
    (walletVersion === WalletVersion.V4R2 && WalletContractV4) ||
    (walletVersion === WalletVersion.V5R1 && WalletContractV5R1) ||
    null

  if (!walletContract) {
    throw new Error('Unsupported wallet contract version')
  }

  const wallet = await walletContract.create({
    workchain: 0,
    publicKey: Buffer.from(publicKey, 'hex'),
  })

  return wallet
}

export const walletAddressToString = (
  address: Address,
  network: Network = Network.TESTNET,
) => {
  if (!address) return ''
  return address.toString({
    urlSafe: true,
    bounceable: false,
    testOnly: network === Network.TESTNET, // mainnet or testnet
  })
}

const getTonClient = async (network: Network = Network.TESTNET) => {
  const endpoint = await getHttpEndpoint({ network })
  return new TonClient({ endpoint })
}

const parseAddress = (
  address: string,
): {
  isValid: boolean
  isRaw?: boolean
  isUserFriendly?: boolean
  isBounceable?: boolean
  isTestOnly?: boolean
  address?: Address
} => {
  try {
    if (Address.isRaw(address)) {
      return {
        address: Address.parseRaw(address),
        isRaw: true,
        isValid: true,
      }
    } else if (Address.isFriendly(address)) {
      return {
        ...Address.parseFriendly(address),
        isUserFriendly: true,
        isValid: true,
      }
    }
  } catch (err) {
    // Do nothing
  }

  return { isValid: false }
}

export default function App() {
  const { toast } = useToast()
  const [state, dispatch] = useReducer(reducer, initialState)

  const generateMnemonic = async () => {
    const words = await mnemonicNew(12)
    const mnemonic = words.join(' ')
    dispatch({ type: 'SET_MNEMONIC', payload: mnemonic.split(' ') })
  }

  const generateAddress = async (version: WalletVersion) => {
    try {
      const words = state.mnemonic
      const mnemonic = words.join(' ')

      const wallet = await mnemonicToWallet(mnemonic, version)
      const address = wallet.address
      dispatch({
        type: `SET_WALLET`,
        payload: { version, wallet, address },
      })

      const client = await getTonClient()
      const balance = await client.getBalance(address)
      const isDeployed = await client.isContractDeployed(address)
      dispatch({
        type: `SET_WALLET`,
        payload: { version, balance, isDeployed },
      })
    } catch (error) {
      toast({
        title: 'generateAddress error',
        description: `${error}`,
        variant: 'destructive',
      })
    }
  }

  const onSignTx = async () => {
    try {
      const { secretKey } = await mnemonicToKeyPair(state.mnemonic.join(' '))
      const wallet = state.wallets[WalletVersion.V5R1]
        .wallet as WalletContractV5R1
      const address = wallet.address
      const toAddress = state.recipient
      const amount = state.amount

      const isFullBalance = false
      const sendMode = isFullBalance
        ? SendMode.CARRY_ALL_REMAINING_BALANCE
        : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
      const TRANSFER_TIMEOUT_SEC = 600
      const timeout = Math.round(Date.now() / 1000) + TRANSFER_TIMEOUT_SEC

      const client = await getTonClient()
      const walletContract = client.open(wallet)
      const seqno = await walletContract.getSeqno()

      const contractState = await client.getContractState(address)
      console.log('>>>>>.contractState', contractState)
      console.log('>>>>>.init', walletContract.init)

      //  const codeHash = Buffer.from(await sha256(base64ToBytes(code))).toString('hex')

      const transaction = walletContract.createTransfer({
        secretKey: Buffer.from(new Uint8Array(64)),
        seqno,
        messages: [
          internal({
            to: toAddress,
            value: toNano(amount),
            body: comment('test'),
            bounce: parseAddress(toAddress).isBounceable,
          }),
        ],
        sendMode,
        timeout,
      })

      const { source_fees: fees } = await client.estimateExternalMessageFee(
        address,
        {
          body: transaction,
          initCode: walletContract.init.code,
          initData: walletContract.init.data,
          ignoreSignature: true,
        },
      )

      const fee = BigInt(
        fees.in_fwd_fee + fees.storage_fee + fees.gas_fee + fees.fwd_fee,
      )
      dispatch({
        type: `SET_FEE`,
        payload: fromNano(fee),
      })

      await walletContract.sendTransfer({
        secretKey: Buffer.from(secretKey),
        seqno,
        messages: [
          internal({
            to: toAddress,
            value: toNano(amount),
            body: comment('test'),
            bounce: parseAddress(toAddress).isBounceable,
          }),
        ],
        sendMode,
        timeout,
      })
    } catch (error) {
      toast({
        title: 'onSignTx error',
        description: `${JSON.stringify(error)}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="mt-4 grid w-full gap-2 grid w-full max-w-5xl mx-auto">
      <Header />
      <Separator />
      <Mnemonic
        mnemonic={state.mnemonic}
        generateMnemonic={generateMnemonic}
        onMnemonicChange={(e) =>
          dispatch({ type: 'SET_MNEMONIC', payload: e.target.value.split(' ') })
        }
        generateAddress={generateAddress}
      />
      <Separator />
      <div className="flex">
        <WalletInfo {...state.wallets?.[WalletVersion.V3R2]} />
        <WalletInfo {...state.wallets?.[WalletVersion.V4R2]} />
        <WalletInfo {...state.wallets?.[WalletVersion.V5R1]} />
      </div>

      <Separator />
      <SignTx
        recipient={state.recipient}
        amount={state.amount}
        fee={state.fee}
        signature={state.signature}
        onRecipientChange={(e) => {
          dispatch({ type: 'SET_RECIPIENT', payload: e.target.value })
        }}
        onAmountChange={(e) =>
          dispatch({ type: 'SET_AMOUNT', payload: e.target.value })
        }
        onMemoChange={(e) =>
          dispatch({ type: 'SET_MEMO', payload: e.target.value })
        }
        onSignTx={onSignTx}
      />
      <Separator />
    </div>
  )
}
