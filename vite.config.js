import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: "../vitejs/static"
  },
  // server: {
  //   proxy: {
  //     '/aloha': 'http://localhost:5173',
  //   },
  // },
  plugins: [
    vue(),
    VitePWA({ 
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      } 
    })
  ],
})