import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'sobre-mi.html'),
        services: resolve(import.meta.dirname, 'servicios.html'),
        locations: resolve(import.meta.dirname, 'zonas.html'),
        contact: resolve(import.meta.dirname, 'contacto.html'),
      },
    },
  },
});
