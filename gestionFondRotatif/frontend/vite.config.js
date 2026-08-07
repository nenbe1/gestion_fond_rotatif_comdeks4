import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // AJOUT : host true fait écouter Vite sur le réseau local (pas
  // seulement localhost), pour pouvoir ouvrir le site depuis un
  // téléphone sur le même WiFi. `npm run dev` affichera alors une
  // adresse "Network" en plus de "Local" dans le terminal.
  server: {
    host: true,
  },
})
