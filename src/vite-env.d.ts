/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  /** Web OAuth client id from the same Google Cloud project the API verifies. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Account-picker hint only. The API decides which domains may sign in. */
  readonly VITE_COMPANY_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
