export interface QuoteRequest {
  store_id: string;
  client_name: string;
  number_of_spaces: number;
  sale_amount: number;
}

export interface QuoteResponse {
  rate: number;
}

export interface User {
  id: string;
  email?: string;
  created_at?: string;
}

// Just export the types we need
export type {};

// Add the Vite environment variables type
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_SUPABASE_PROJECT_ID: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
