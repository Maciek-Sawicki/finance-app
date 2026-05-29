import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    https: fs.existsSync(path.resolve(__dirname, "../server/certs/server.key")) ? {
      key: fs.readFileSync(path.resolve(__dirname, "../server/certs/server.key")),
      cert: fs.readFileSync(path.resolve(__dirname, "../server/certs/server.cert")),
    } : undefined,
  },
})
