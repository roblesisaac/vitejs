import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  build: {
    outDir: "./static",
    // minify: "terser",
    // terserOptions: {
    //   mangle: false
    // }
  },
  plugins: [
    vue(),
    // VitePWA({ 
    //   registerType: 'autoUpdate',
    //   devOptions: {
    //     enabled: true
    //   } 
    // })
  ],
})