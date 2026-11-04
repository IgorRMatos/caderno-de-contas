/// <reference types="vitest/config" />
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import { cspPlugin, fontPreloadPlugin } from './vite-plugins.js';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), cspPlugin(), fontPreloadPlugin()],
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
    css: false,
  },
});
