import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  // build:{
  //   //  关闭文件hash，避免graalvm 静态资源配置
  //   chunkFileName:'[name].[ext]',
  //   assetFileName:'[name].[ext]'
  // },
  plugins: [vue()],
  server:{
    proxy:{
      "/sw":{
        target:"http://192.168.150.96:5895/sw"
      }
    }
  }
})
