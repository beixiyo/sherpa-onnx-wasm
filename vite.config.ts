import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    headers: {
      // 确保 WASM 文件以正确的 MIME 类型提供
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
})

