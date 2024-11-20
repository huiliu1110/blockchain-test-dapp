import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.tsx'
import '@repo/ui/main.css'
import { Toaster } from '@ui/components/index.ts'
import { ThemeProvider } from '@/components/theme-provider'

import '@interchain-ui/react/styles'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
    <Toaster />
  </React.StrictMode>,
)
