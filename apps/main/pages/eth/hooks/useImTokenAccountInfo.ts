import { useEffect, useState } from 'react'
import { useConfig, useConnection } from 'wagmi'

import {
  readImTokenAccountInfo,
  type ImTokenAccountInfo,
} from '../connectors/imToken'

export function useImTokenAccountInfo(): ImTokenAccountInfo | undefined {
  const config = useConfig()
  const { address, connector, isConnected } = useConnection()
  const [accountInfo, setAccountInfo] = useState<ImTokenAccountInfo | undefined>()

  useEffect(() => {
    if (!isConnected || connector?.id !== 'imToken') {
      setAccountInfo(undefined)
      return
    }

    let cancelled = false
    void readImTokenAccountInfo(config.storage).then((info) => {
      if (!cancelled) setAccountInfo(info)
    })

    return () => {
      cancelled = true
    }
  }, [address, config.storage, connector?.id, isConnected])

  return accountInfo
}
