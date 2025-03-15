export interface QuoteRequest {
  store_id: string;
  number_of_spaces: number;
  sale_amount: number;
}

export interface QuoteResponse {
  rate: number;
}

// Just export the types we need
export type { }

// Add the Vite environment variables type
declare global {
  interface ImportMetaEnv {
    readonly VITE_STORE_ID: string;
    readonly VITE_LOGO_URL: string;
    readonly VITE_API_URL: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}