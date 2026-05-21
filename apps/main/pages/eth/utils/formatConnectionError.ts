type RpcErrorLike = {
  message?: string
  shortMessage?: string
  code?: number | string
  data?: unknown
}

function messageFromData(data: unknown): string | undefined {
  if (!data) return undefined
  if (typeof data === 'string') return data
  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return undefined
}

export function formatConnectionError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error instanceof Error) {
    const shortMessage = (error as Error & { shortMessage?: string })
      .shortMessage
    return shortMessage ?? error.message ?? 'Request failed'
  }
  if (!error || typeof error !== 'object') return 'Request failed'

  const rpcError = error as RpcErrorLike
  const dataMessage = messageFromData(rpcError.data)
  if (dataMessage) return dataMessage
  if (typeof rpcError.shortMessage === 'string') return rpcError.shortMessage
  if (typeof rpcError.message === 'string') return rpcError.message

  return 'Request failed'
}
