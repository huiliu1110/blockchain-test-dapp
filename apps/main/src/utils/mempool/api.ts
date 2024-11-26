import { Fees, UTXO } from '../providers/base'
import { getNetworkConfig } from './network.config'

const { mempoolApiUrl, rpcUrl } = getNetworkConfig()

/*
 * URL Construction methods
 */
const mempoolAPI = `${mempoolApiUrl}/api/`

// URL for the address info endpoint
function addressInfoUrl(address: string): URL {
  return new URL(`${mempoolAPI}address/${address}`)
}

// URL for the push transaction endpoint
function pushTxUrl(): URL {
  return new URL(`${mempoolAPI}tx`)
}

// URL for retrieving information about an address' UTXOs
function utxosInfoUrl(address: string): URL {
  return new URL(`${mempoolAPI}address/${address}/utxo`)
}

// URL for retrieving information about the recommended network fees
function networkFeesUrl(): URL {
  return new URL(`${mempoolAPI}v1/fees/recommended`)
}

// URL for retrieving the tip height of the BTC chain
function btcTipHeightUrl(): URL {
  return new URL(`${mempoolAPI}blocks/tip/height`)
}

// URL for validating an address which contains a set of information about the address
// including the scriptPubKey
function validateAddressUrl(address: string): URL {
  return new URL(`${mempoolAPI}v1/validate-address/${address}`)
}

type DecodePsbtResult = {
  tx: {
    txid: string
    hash: string
    version: number
    size: number
    vsize: number
    weight: number
    locktime: number
    vin: Array<{
      txid: string
      vout: 0
      scriptSig: {
        asm: string
        hex: string
      }
      sequence: number
    }>
    vout: Array<{
      value: number
      n: number
      scriptPubKey: {
        asm: string
        hex: string
        reqSigs: number
        type: string
        addresses: string[]
      }
    }>
  }
  global_xpubs: Array<unknown>
  psbt_version: 0 | 2
  proprietary: Array<unknown>
  inputs: Array<{
    witness_utxo: {
      amount: number
      scriptPubKey: {
        asm: string
        desc: string
        hex: string
        address: string
        type: string
      }
    }
    final_scriptwitness: string[]
    taproot_key_path_sig: string
    taproot_internal_key: string
  }>
  outputs: Array<unknown>
  fee: number
}
/**
 * decode psbt tx
 * @param psbt - The hex string corresponding to the full transaction.
 * @returns A promise that resolves to the response message.
 */
export async function decodePsbt(
  psbt: string,
): Promise<{ result: DecodePsbtResult }> {
  const data = {
    jsonrpc: '2.0',
    method: 'decodepsbt',
    params: [psbt],
    id: 1,
  }
  const response = await fetch(rpcUrl, {
    method: 'POST',
    mode: 'cors',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      'X-DEVICE-TOKEN': 'test',
    },
  })
  return await response.json()
}

/**
 * Pushes a transaction to the Bitcoin network.
 * @param txHex - The hex string corresponding to the full transaction.
 * @returns A promise that resolves to the response message.
 */
export async function pushTx(txHex: string): Promise<string> {
  const response = await fetch(pushTxUrl(), {
    method: 'POST',
    body: txHex,
  })
  if (response.ok) {
    return await response.text()
  }

  const mempoolError = await response.text()
  // Extract the error message from the response
  const message = mempoolError.split('"message":"')[1].split('"}')[0]
  if (mempoolError.includes('error') || mempoolError.includes('message')) {
    throw new Error(message)
  } else {
    throw new Error('Error broadcasting transaction. Please try again')
  }
}

/**
 * Returns the balance of an address.
 * @param address - The Bitcoin address in string format.
 * @returns A promise that resolves to the amount of satoshis that the address
 *          holds.
 */
export async function getAddressBalance(address: string): Promise<number> {
  const response = await fetch(addressInfoUrl(address))
  if (response.ok) {
    const addressInfo = await response.json()
    return (
      addressInfo.chain_stats.funded_txo_sum -
      addressInfo.chain_stats.spent_txo_sum
    )
  }
  const err = await response.text()
  throw new Error(err)
}

/**
 * Retrieve the recommended Bitcoin network fees.
 * @returns A promise that resolves into a `Fees` object.
 */
export async function getNetworkFees(): Promise<Fees> {
  const response = await fetch(networkFeesUrl())
  if (!response.ok) {
    const err = await response.text()
    throw new Error(err)
  } else {
    return await response.json()
  }
}
// Get the tip height of the BTC chain
export async function getTipHeight(): Promise<number> {
  const response = await fetch(btcTipHeightUrl())
  const result = await response.text()
  if (!response.ok) {
    throw new Error(result)
  }
  const height = Number(result)
  if (Number.isNaN(height)) {
    throw new Error('Invalid result returned')
  }
  return height
}

/**
 * Retrieve a set of UTXOs that are available to an address
 * and satisfy the `amount` requirement if provided. Otherwise, fetch all UTXOs.
 * The UTXOs are chosen based on descending amount order.
 * @param address - The Bitcoin address in string format.
 * @param amount - The amount we expect the resulting UTXOs to satisfy.
 * @returns A promise that resolves into a list of UTXOs.
 */
export async function getFundingUTXOs(
  address: string,
  amount?: number,
): Promise<UTXO[]> {
  // Get all UTXOs for the given address
  const response = await fetch(utxosInfoUrl(address))
  const utxos: Array<
    UTXO & {
      status: { confirmed: boolean }
    }
  > = await response.json()

  // Remove unconfirmed UTXOs as they are not yet available for spending
  // and sort them in descending order according to their value.
  // We want them in descending order, as we prefer to find the least number
  // of inputs that will satisfy the `amount` requirement,
  // as less inputs lead to a smaller transaction and therefore smaller fees.
  const confirmedUTXOs = utxos
    .filter((utxo) => utxo.status.confirmed)
    .sort((a, b) => b.value - a.value)

  // If amount is provided, reduce the list of UTXOs into a list that
  // contains just enough UTXOs to satisfy the `amount` requirement.
  let sliced = confirmedUTXOs
  if (amount) {
    let sum = 0
    let i = 0
    for (i = 0; i < confirmedUTXOs.length; ++i) {
      sum += confirmedUTXOs[i].value
      if (sum > amount) {
        break
      }
    }
    if (sum < amount) {
      return []
    }
    sliced = confirmedUTXOs.slice(0, i + 1)
  }

  const res = await fetch(validateAddressUrl(address))
  const addressInfo = await res.json()
  const { isvalid, scriptPubKey } = addressInfo
  if (!isvalid) {
    throw new Error('Invalid address')
  }

  // Iterate through the final list of UTXOs to construct the result list.
  // The result contains some extra information,
  return sliced.map((s) => {
    return {
      txid: s.txid,
      vout: s.vout,
      value: s.value,
      scriptPubKey,
    }
  })
}
