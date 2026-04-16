/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
  export function registerSW(options?: any): void;
}

declare const __APP_VERSION__: string;
