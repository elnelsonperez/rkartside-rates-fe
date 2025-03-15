/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STORE_ID: string;
  readonly VITE_LOGO_URL: string;
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
