import { ThemeProvider } from './components/theme-provider'
import { ModeToggle } from './components/mode-toggle'
import { Separator } from '@ui/components'
function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="flex min-h-screen flex-col items-center justify-center">
        <ModeToggle />
        <div className="mb-5 flex flex-col items-center">
          <h2 className="text-lg font-semibold mt-4">Blockchain Test DApp</h2>
          <a href="https://github.com/xwartz" target="_blank">
            By @xwartz
          </a>
        </div>

        <Separator />

        <div className="mt-5">
          <h4 className="font-semibold">Test DApps:</h4>
          <ul className="ml-6 list-disc [&>li]:mt-2">
            <li>
              <a href="./pages/bip322/">BIP-322</a>
            </li>
            <li>
              <a href="./pages/bip370/">BIP-370</a>
            </li>
            <li>
              <a href="./pages/cosmos/">cosmos</a>
            </li>
            <li>
              <a href="./pages/ton/">ton</a>
            </li>
          </ul>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default App
