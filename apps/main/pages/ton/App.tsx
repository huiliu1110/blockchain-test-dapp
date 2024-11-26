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
import {
  Address,
  internal,
  toNano,
  comment,
  SendMode,
  beginCell,
  Cell,
} from '@ton/core'
import { TonClient } from '@ton/ton/dist/client/TonClient'
import { getHttpEndpoint } from '@orbs-network/ton-access'

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
  const endpoint = await getHttpEndpoint({
    host: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    network,
  })
  return new TonClient({ endpoint })
}

// const parseAddress = (
//   address: string,
// ): {
//   isValid: boolean
//   isRaw?: boolean
//   isUserFriendly?: boolean
//   isBounceable?: boolean
//   isTestOnly?: boolean
//   address?: Address
// } => {
//   try {
//     if (Address.isRaw(address)) {
//       return {
//         address: Address.parseRaw(address),
//         isRaw: true,
//         isValid: true,
//       }
//     } else if (Address.isFriendly(address)) {
//       return {
//         ...Address.parseFriendly(address),
//         isUserFriendly: true,
//         isValid: true,
//       }
//     }
//   } catch (err) {
//     // Do nothing
//   }

//   return { isValid: false }
// }

const getJettonBalance = async (
  client: TonClient,
  walletAddress: Address,
  jettonMasterAddress: Address,
): Promise<bigint> => {
  // Get jetton wallet address
  const jettonWalletAddressCell = await client.runMethod(
    jettonMasterAddress,
    'get_wallet_address',
    [
      {
        type: 'slice',
        cell: beginCell().storeAddress(walletAddress).endCell(),
      },
    ],
  )
  const jettonWalletAddress = jettonWalletAddressCell.stack.readAddress()
  const jettonWalletData = await client.runMethod(
    jettonWalletAddress,
    'get_wallet_data',
  )
  return BigInt(jettonWalletData.stack.readNumber())
}

const tonTransfer = async (
  client: TonClient,
  wallet: WalletContractV5R1,
  secretKey: Buffer,
  params: {
    jettonMasterAddress: Address
    toAddress: Address
    amount: bigint
    responseAddress?: Address
    forwardAmount?: bigint
    forwardPayload?: Cell
  },
) => {
  // Send transaction
  const walletContract = client.open(wallet)
  const seqno = await walletContract.getSeqno()

  return walletContract.sendTransfer({
    secretKey: secretKey,
    seqno,
    messages: [
      internal({
        to: params.toAddress,
        value: params.amount, // Convert amount to nanotons
        body: comment('test'), // Optional comment
        bounce: true,
      }),
    ],
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    timeout: Math.floor(Date.now() / 1000) + 600,
  })
}

const jettonTransfer = async (
  client: TonClient,
  wallet: WalletContractV5R1,
  secretKey: Buffer,
  params: {
    jettonMasterAddress: Address
    toAddress: Address
    amount: bigint
    responseAddress?: Address
    forwardAmount?: bigint
    forwardPayload?: Cell
  },
) => {
  // Get sender's jetton wallet address
  const jettonWalletAddressCell = await client.runMethod(
    params.jettonMasterAddress,
    'get_wallet_address',
    [
      {
        type: 'slice',
        cell: beginCell().storeAddress(wallet.address).endCell(),
      },
    ],
  )
  const jettonWalletAddress = jettonWalletAddressCell.stack.readAddress()

  // Prepare transfer message body
  const transferBody = beginCell()
    .storeUint(0xf8a7ea5, 32) // transfer op code
    .storeUint(0, 64) // query id
    .storeCoins(params.amount) // amount
    .storeAddress(params.toAddress) // destination address
    .storeAddress(params.responseAddress || wallet.address) // response address
    .storeBit(false) // custom payload
    .storeCoins(params.forwardAmount || 0n) // forward amount
    .storeBit(false) // forward payload, storeMaybeRef put 1 bit before cell (forward_payload in cell) or 0 for null (forward_payload in slice)
    .endCell()

  // Send transaction
  const walletContract = client.open(wallet)
  const seqno = await walletContract.getSeqno()

  return walletContract.sendTransfer({
    secretKey,
    seqno,
    messages: [
      internal({
        to: jettonWalletAddress,
        value: toNano('0.05'), // Attach TON for gas
        body: transferBody,
        bounce: true,
      }),
    ],
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    timeout: Math.floor(Date.now() / 1000) + 600,
  })
}

export default function App() {
  const { toast } = useToast()
  const [state, dispatch] = useReducer(reducer, initialState)

  const generateMnemonic = async () => {
    const words = await mnemonicNew(12)
    const mnemonic = words.join(' ')
    dispatch({ type: 'SET_MNEMONIC', payload: mnemonic.split(' ') })
  }

  const generateAddress = async () => {
    try {
      const version = state.version ?? WalletVersion.V5R1
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
      const jettonBalance = await getJettonBalance(
        client,
        address,
        Address.parse('kQAiboDEv_qRrcEdrYdwbVLNOXBHwShFbtKGbQVJ2OKxY_Di'), // example jetton master address
      )
      dispatch({
        type: `SET_WALLET`,
        payload: {
          version,
          wallet,
          address,
          balance,
          isDeployed,
          jettonBalance,
        },
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
      const wallet = state.wallet.wallet as WalletContractV5R1
      const toAddress = state.recipient
      const amount = state.amount
      const client = await getTonClient()

      const token = state.token ?? 'AIOTX'
      const transfer = token === 'AIOTX' ? jettonTransfer : tonTransfer
      transfer(client, wallet, secretKey, {
        jettonMasterAddress: Address.parse(
          'kQAiboDEv_qRrcEdrYdwbVLNOXBHwShFbtKGbQVJ2OKxY_Di',
        ),
        toAddress: Address.parse(toAddress),
        amount: toNano(amount),
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
        onVersionChange={(e) => {
          const value = (e.target as HTMLButtonElement).value as WalletVersion
          if (value) {
            dispatch({ type: 'SET_VERSION', payload: value })
          }
        }}
        generateAddress={generateAddress}
      />
      <Separator />
      <WalletInfo {...state.wallet} />
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
        onTokenChange={(e) => {
          const value = (e.target as HTMLButtonElement).value
          if (value) {
            dispatch({ type: 'SET_TOKEN', payload: value })
          }
        }}
        onSignTx={onSignTx}
      />
      <Separator />
    </div>
  )
}
