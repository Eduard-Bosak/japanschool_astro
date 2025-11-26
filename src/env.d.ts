/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  interface Window {
    __appInitialized?: boolean;
  }

  interface HTMLElement {
    __hidden?: boolean;
  }
}

export {};
