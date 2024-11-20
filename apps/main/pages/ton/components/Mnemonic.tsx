import { Label, Button, Textarea } from '@ui/components'
import { WalletVersion } from '../state'

export function Mnemonic({
  mnemonic,
  generateMnemonic,
  onMnemonicChange,
  generateAddress,
}: {
  mnemonic: string[]
  generateMnemonic: () => void
  onMnemonicChange: React.ChangeEventHandler<HTMLTextAreaElement>
  generateAddress: (version: WalletVersion) => void
}) {
  return (
    <div className="p-5 text-center">
      <Button variant="destructive" onClick={generateMnemonic}>
        Generate Mnemonic
      </Button>
      <div className="mt-2">
        <Label htmlFor="mnemonic">Mnemonic: </Label>
        <Textarea
          placeholder="Type your Mnemonic here."
          id="mnemonic"
          defaultValue={mnemonic.join(' ')}
          onChange={onMnemonicChange}
        />
      </div>
      <div className="mt-2">
        <Button
          variant="secondary"
          onClick={() => generateAddress(WalletVersion.V3R2)}
        >
          Generate V3R2 Address
        </Button>
        <Button
          variant="secondary"
          onClick={() => generateAddress(WalletVersion.V4R2)}
        >
          Generate V4R2 Address
        </Button>
        <Button
          variant="secondary"
          onClick={() => generateAddress(WalletVersion.V5R1)}
        >
          Generate V5R1 Address
        </Button>
      </div>
    </div>
  )
}
