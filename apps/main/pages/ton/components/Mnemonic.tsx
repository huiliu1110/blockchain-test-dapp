import {
  Label,
  Button,
  Textarea,
  RadioGroup,
  RadioGroupItem,
} from '@ui/components'
import { WalletVersion } from '../state'

export function Mnemonic({
  mnemonic,
  generateMnemonic,
  onMnemonicChange,
  onVersionChange,
  generateAddress,
}: {
  mnemonic: string[]
  generateMnemonic: () => void
  onMnemonicChange: React.ChangeEventHandler<HTMLTextAreaElement>
  onVersionChange: React.MouseEventHandler<HTMLDivElement>
  generateAddress: () => void
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
        <Label htmlFor="radio-group-version">Select a contract version: </Label>
        <RadioGroup
          id="radio-group-version"
          className="flex"
          defaultValue={WalletVersion.V5R1}
          onClick={onVersionChange}
        >
          {[WalletVersion.V3R2, WalletVersion.V4R2, WalletVersion.V5R1].map(
            (version) => (
              <div className="flex" key={version}>
                <RadioGroupItem value={version} id={`radio-${version}`} />
                <Label htmlFor={`radio-${version}`}>{version}</Label>
              </div>
            ),
          )}
        </RadioGroup>
      </div>
      <div className="mt-2">
        <Button variant="secondary" onClick={generateAddress}>
          Generate Wallet Address
        </Button>
      </div>
    </div>
  )
}
