export interface User {
  id: string;
  email?: string;
  created_at?: string;
  isAdmin?: boolean;
}

// Just export the types we need
export type {};

// Add the Vite environment variables type
declare global {
  interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_SUPABASE_PROJECT_ID: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
