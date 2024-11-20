import { Label, Button, Input } from '@ui/components'

export function SignTx({
  recipient,
  amount,
  fee,
  onRecipientChange,
  onAmountChange,
  onMemoChange,
  onSignTx,
}: {
  recipient: string
  amount: string
  fee: string
  signature: string
  onRecipientChange: React.ChangeEventHandler<HTMLInputElement>
  onAmountChange: React.ChangeEventHandler<HTMLInputElement>
  onMemoChange: React.ChangeEventHandler<HTMLInputElement>
  onSignTx: () => void
}) {
  return (
    <div className="p-5 text-center">
      <h3 className="text-xl font-semibold">Sign Tx</h3>
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
        Sign
      </Button>
      <div className="mt-2">
        <p>Fee: </p>
        <code className="rounded bg-muted text-sm break-all">{fee}</code>
      </div>
    </div>
  )
}
