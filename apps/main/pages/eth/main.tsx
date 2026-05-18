import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'

import App from './App.tsx'
import { config } from './config.ts'
import '@repo/ui/main.css'
import { Toaster } from '@ui/components/index.ts'
import { ThemeProvider } from '@/components/theme-provider'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <App />
        </ThemeProvider>
        <Toaster />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
)
