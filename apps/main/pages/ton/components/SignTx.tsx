import {
  Label,
  Button,
  Input,
  RadioGroup,
  RadioGroupItem,
} from '@ui/components'

export function SignTx({
  recipient,
  amount,
  rawTx,
  rawTxHash,
  onRecipientChange,
  onAmountChange,
  onMemoChange,
  onTokenChange,
  onSignTx,
}: {
  recipient: string
  amount: string
  rawTx: string
  rawTxHash: string
  fee: string
  signature: string
  onRecipientChange: React.ChangeEventHandler<HTMLInputElement>
  onAmountChange: React.ChangeEventHandler<HTMLInputElement>
  onMemoChange: React.ChangeEventHandler<HTMLInputElement>
  onTokenChange: React.MouseEventHandler<HTMLDivElement>
  onSignTx: () => void
}) {
  return (
    <div className="p-5 text-center mb-20">
      <h3 className="text-xl font-semibold">Sign Tx</h3>
      <div className="mt-2">
        <Label htmlFor="radio-group-token">Select a token to transfer: </Label>
        <RadioGroup
          id="radio-group-token"
          className="flex"
          defaultValue={'TON'}
          onClick={onTokenChange}
        >
          {['TON', 'AIOTX'].map((token) => (
            <div className="flex" key={token}>
              <RadioGroupItem value={token} id={`radio-${token}`} />
              <Label htmlFor={`radio-${token}`}>{token}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="gap-1.5">
        <Label htmlFor="recipient">Recipient</Label>
        <Input
          type="text"
          id="recipient"
          placeholder="recipient"
          onChange={onRecipientChange}
          value={recipient}
        />
      </div>
      <div className="gap-1.5">
        <Label htmlFor="amount">Amount</Label>
        <Input
          type="number"
          id="amount"
          placeholder="amount"
          onChange={onAmountChange}
          value={amount}
        />
      </div>
      <div className="gap-1.5">
        <Label htmlFor="memo">Memo</Label>
        <Input id="memo" placeholder="memo" onChange={onMemoChange} />
      </div>
      <Button variant="default" onClick={onSignTx} className="mt-2">
        Sign Tx
      </Button>
      <div className="gap-1.5">
        <Label htmlFor="tx">Tx:</Label>
        <div className="rounded bg-muted text-sm break-all">{rawTx}</div>
      </div>
      <div className="gap-1.5">
        <Label htmlFor="tx">Tx Hash:</Label>
        <code className="rounded bg-muted text-sm break-all">{rawTxHash}</code>
      </div>
    </div>
  )
}
