/// <reference types="vite/client" />

/** Typed environment, so the two variables this SPA reads are `string |
 *  undefined` rather than Vite's default `any` (`CLAUDE.md`: strict, no `any`
 *  without justification).
 *
 *  Both are optional on purpose. With neither set, the app runs against the
 *  seeded demo source and never touches the network — see
 *  `features/auth/active-source.ts`. */
interface ImportMetaEnv {
  /** The Google Web OAuth client id, from the SAME Google Cloud project the
   *  backend verifies against. Setting it is what switches the SPA from seeded
   *  demo users to the published contract. Public by nature, but it still lives
   *  in `.env` rather than in source. */
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  /** Absolute API origin, e.g. `https://codev-osrs-backend.vercel.app`.
   *
   *  Leave it UNSET during development while the backend returns no
   *  `Access-Control-Allow-Origin`: the default `/api` goes through the Vite
   *  proxy in `vite.config.ts`, which makes the API same-origin and keeps the
   *  session cookie first-party. Set it once CORS allows the SPA's origin. */
  readonly VITE_API_URL?: string;

  /** The company's Google Workspace domain, passed to Google Identity Services
   *  as the `hd` account-picker hint so the chooser offers work accounts first.
   *
   *  A HINT, not a control. `hd` is trivially removable from the client and the
   *  API remains responsible for domain validation. Nothing in the SPA treats
   *  it as an authorization decision. */
  readonly VITE_COMPANY_DOMAIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
