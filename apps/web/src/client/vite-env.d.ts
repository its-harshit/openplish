/// <reference types="vite/client" />

declare module '@fontsource-variable/inter';

declare module 'proxy-from-env' {
  export function getProxyForUrl(url: string): string;
}
