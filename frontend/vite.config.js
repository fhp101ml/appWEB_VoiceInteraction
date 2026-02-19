import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174, // Different from main project's 5173 to avoid conflict
        watch: {
            usePolling: true,
        },
        proxy: {
            '/socket.io': {
                target: 'ws://localhost:8001',
                ws: true
            }
        }
    }
})
