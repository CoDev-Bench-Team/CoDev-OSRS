# Tasks: HTTP Client, Session, and Seeded-Source Switch

**Spec**: `specs/spec.md`
**Plan**: `specs/plan.md`
**Structure**: By user story. Setup and Foundational block every story. Stories 1–4 are P1. Story 5 is P2.

Format: `- [ ] [TaskID] [P?] [Story?] Description — path`

## Phase 1: Setup

- [x] T001 [P] Declare `VITE_API_BASE_URL` on `ImportMetaEnv` — `src/vite-env.d.ts`
- [x] T002 [P] Add the session gate and register it with the other gates. With the variable unset, the seeded Employee still lands on `/catalog` and the seeded Admin on `/queue` — `scripts/check-api-session.mjs`, `scripts/verify.mjs`

## Phase 2: Foundational

- [x] T003 [P] Compare the integration guide with a live API document and write the dated note: current-user fields, role vocabulary, office vocabulary, the frontend Google client id, and whether the status and category maps are final. An unnamed client id is recorded as a stop. Do not add a mapper module here — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T004 [P] Read `application/problem+json` as `title`, `status`, `detail`, and optional `errors[]` of `{ detail, pointer }`, reusing `pointerPath` — `src/shared/api/problem.ts`
- [x] T005 [P] Read a paged list as `{ data, total, page, limit, totalPages }` — `src/shared/api/page.ts`
- [x] T006 `apiRequest`: cookie via `credentials: 'include'`, JSON body when present, one problem error, no retry, no browser storage — `src/shared/api/client.ts`
- [x] T007 Export the client, the problem reader, and the page reader from one module — `src/shared/api/index.ts`

## Phase 3: The configured address selects the session (P1)

- [x] T008 [US1] `selectSessionSource()` returns the seeded source when `VITE_API_BASE_URL` is unset or blank, and a fail-closed API source when it is set. That API source must not read `osrs.session`, `osrs.demo.sessions`, or `osrs.demo.account`. Pass it from the app root. Leave the provider default seeded — `src/features/auth/session-source.ts`, `src/features/auth/api-session-source.ts`, `src/app/App.tsx`
- [x] T009 [US1] Assert the unset path still uses the seeded session, and that catalog, My Requests, profile, the admin queue, history, assets, and inventory still construct their seeded sources — `scripts/check-api-session.mjs`

## Phase 4: Sign in, return, and sign out on the API session (P1)

- [x] T010 [P] [US2] `current()` calls `GET /auth/me`, `signIn(credential)` posts `{ credential }` to `POST /auth/google` and drops the string when the call settles, `signOut()` calls `POST /auth/logout`. `subscribe` wakes other tabs on a `BroadcastChannel` named `osrs.session` that carries no user and no role, and re-reads `/auth/me` when the tab becomes visible — `src/features/auth/api-session-source.ts`
- [x] T011 [P] [US2] `signIn(credential?: string)`. The notice can carry the published problem text — `src/features/auth/session-context.ts`
- [x] T012 [US2] Pass the credential through to the source. A `403` refusal and an unreachable API become sign-in notices and do not swap in the seeded source. `status` still starts at `unknown` — `src/features/auth/SessionProvider.tsx`
- [x] T013 [US2] Keep the designed Google control. Demo accounts call `signIn()` as they do today. API mode renders Google's own button over that control when `VITE_GOOGLE_CLIENT_ID` is set, holds the credential only for the call, and otherwise refuses without inventing an id — `src/features/auth/LoginScreen.tsx`
- [x] T014 [P] [US2] Dev-server proxy to `VITE_API_BASE_URL` so the session cookie is first-party on the Vite origin. A Netlify build proxies `/auth` the same way. Any other production build calls the base directly — `vite.config.ts`
- [x] T015 [P] [US2] Document the one switch, the dev-only proxy, `credentials: 'include'`, and the production check that a refresh on the real same-site hosts restores the person. Drop `VITE_API_ORIGIN` as a second switch — `specs/001-office-supplies-mvp/quickstart.md`, `README.md`

## Phase 5: Screens follow the current user (P1)

- [x] T016 [US3] Make `User.name` and `User.email` optional. Keep `Role` as `employee` | `admin` — `src/features/auth/types.ts`
- [x] T017 [US3] Map `id`, `role`, and `location` from the live current user. Copy `name` and `email` only when present and derive initials from the name. An unrecognised role is not a session. An unrecognised office is left unset — `src/features/auth/api-session-source.ts`
- [x] T018 [P] [US3] When the session name is absent, show the existing role label and no invented initials. The avatar stays initials on a flat colour — `src/app/AppLayout.tsx`
- [x] T019 [P] [US3] Show email and office only when the session has them, with no dangling separator and no invented person — `src/features/profile/IdentityBlock.tsx`

## Phase 6: A dead or forbidden session is not replayed (P1)

- [x] T020 [US4] Any `401` ends the session. `403` on `POST /auth/google` and `GET /auth/me` is a sign-in refusal. `401` or `403` on `POST /requests`, `POST /requests/:id/receive`, and `POST /requests/:id/sign` ends the session and is not sent again. Any other `403` is returned as the problem. No retry — `src/shared/api/client.ts`
- [x] T021 [US4] Show the problem `detail` on sign-in, or `title` when `detail` is only `Unauthorized` or `Forbidden`. When the body has neither, keep the existing refusal sentence. `401` from the current-user read shows sign-in — `src/features/auth/LoginScreen.tsx`
- [x] T022 [US4] Assert a `401` and a `403` are each issued once, and that the session-ending writes are exactly those three paths — `scripts/check-api-session.mjs`

## Phase 7: One client, and mappings only after a live comparison (P2)

- [x] T023 [P] [US5] Turn an API image string into an `<img>` source. Reject HTML. No `dangerouslySetInnerHTML` — `src/shared/api/asset-image.ts`
- [x] T024 [US5] Add `src/shared/api/maps.ts` only when the contract note says the live comparison made the status and category maps final, including `Wifi`. When the note says the live document could not be compared, leave the mapper uncreated — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T025 [US5] Export the image helper, and the maps only when that file exists. Do not export `GET /assets`, `GET /assets/:id`, `GET /inventory-items`, `GET /inventory-items/:id`, or `POST /requests/:id/receive` — `src/shared/api/index.ts`
- [x] T026 [US5] Assert those five routes are absent from `src/shared/api/`, the client writes no browser storage, and `maps.ts` exists only when the contract note says the maps are final — `scripts/check-api-session.mjs`

## Final Phase: Polish

- [x] T027 Record every contract gap found while wiring the client, including a current user missing a name or an email — `specs/001-office-supplies-mvp/contracts/README.md`
- [x] T028 Run the session gate inside `npm run verify` and confirm seeded sign-in still passes — `scripts/verify.mjs`
