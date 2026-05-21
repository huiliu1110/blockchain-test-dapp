import { X } from 'lucide-react'
import { Button } from '@ui/components'

type ConnectionErrorProps = {
  message: string
  onDismiss: () => void
}

export function ConnectionError({ message, onDismiss }: ConnectionErrorProps) {
  return (
    <div
      role="alert"
      className="mx-auto mt-3 max-w-lg rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-left text-sm text-destructive"
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 break-words">{message}</p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-destructive hover:bg-destructive/20 hover:text-destructive"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
