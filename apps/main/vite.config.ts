import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { fileURLToPath } from 'url'
import path, { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: [
      {
        find: './runtimeConfig',
        replacement: './runtimeConfig.browser',
      },
      // Reference: https://github.com/vercel/turbo/discussions/620#discussioncomment-2136195
      {
        find: '@ui',
        replacement: path.resolve(__dirname, '../../packages/ui/src'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
      },
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        bip322: path.resolve(__dirname, 'pages/bip322/index.html'),
        bip370: path.resolve(__dirname, 'pages/bip370/index.html'),
        cosmos: path.resolve(__dirname, 'pages/cosmos/index.html'),
        ton: path.resolve(__dirname, 'pages/ton/index.html'),
      },
    },
  },
})
