import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ command }) => ({
  plugins: [vue()],
  ...(command === 'build' && {
    build: {
      lib: {
        entry: fileURLToPath(new URL('src/index.js', import.meta.url)),
        name: 'VueSelect',
        formats: ['es', 'umd'],
        fileName: 'vue-select',
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: { vue: 'Vue' },
          exports: 'named',
          assetFileNames: (assetInfo) =>
            assetInfo.name === 'style.css' ? 'vue-select.css' : assetInfo.name,
        },
      },
    },
  }),
}))
