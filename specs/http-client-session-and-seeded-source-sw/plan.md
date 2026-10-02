# Implementation Plan: HTTP Client, Session, and Seeded-Source Switch

**Date**: 2026-10-02
**Spec**: `specs/spec.md`
**Status**: Draft

## Summary

When `VITE_API_BASE_URL` is set, the shell's existing session boundary is satisfied by the published API: `POST /auth/google`, `GET /auth/me`, and `POST /auth/logout`, with the browser session cookie and no stored token. When it is unset, `seededSessionSource` stays the provider source and every screen source stays seeded. One shared client in `src/shared/api/` owns cookies, problem details, paged lists, and the rule that a `401` or a `403` is never retried.

## Technical Context

**Stack**: React 19, TypeScript (strict), Vite 8, Tailwind CSS 4. No new application framework.
**Primary Dependencies**: The platform `fetch`. Google Identity Services is loaded only while the API session is selected, because the integration guide says the Google control obtains an ID-token credential. No HTTP library.
**Storage**: API session stores nothing. The Google credential and any future assignee list stay in memory for that action. The seeded source keeps its existing browser-storage keys and the API source never reads them.
**Target Layer(s)**: Frontend only. The backend contract is consumed, not extended.
**Performance Goals**: None in the spec. Session restore stays on the shell's existing loading state (`status === 'unknown'`).
**Constraints**: Constitution VII — no invented routes, fields, or error codes. Constitution IX — no token or credential in storage, no secrets committed. This slice does not switch catalog, My Requests, profile, the admin queue, history, assets, or inventory. It does not add `GET /assets`, `GET /assets/:id`, `GET /inventory-items`, `GET /inventory-items/:id`, or `POST /requests/:id/receive`.

The repo docs mention `VITE_API_ORIGIN`. Nothing in `src/` reads it. This plan uses the epic's one switch, `VITE_API_BASE_URL`, and updates those docs so the old name is not a second switch.

## Data Model

No database and no migration. The shell's `Session` and `Role` stay the SPA vocabulary. The API source maps the published current user into them.

| Fact | API session | Seeded session |
|------|-------------|----------------|
| Identity | Fields the live `GET /auth/me` body actually has | Unchanged `User` records in `seeded-source.ts` |
| `id` | The published id, carried as a string on the existing `User.id` | Unchanged (`maya.santos`, `ethan.cruz`) |
| `role` | `employee` or `admin` only. Any other value is not a session | Unchanged |
| `office` | Published `location` when it is one of `OFFICES` | Unchanged |
| `name`, `email` | Copied only when the live body has them. Initials are derived from the name. Not invented when absent | Still required, still the two demo people |
| Avatar | Initials on the existing flat colour. No photograph, no image URL | Unchanged |
| Persistence | Cookie set by the API. SPA writes no session key | Existing `osrs.session`, `osrs.demo.sessions`, `osrs.demo.account` |

`User.name` and `User.email` become optional so an API user missing either can sign in without a placeholder person. Seeded users still set both. When the live body has a name, the account cluster shows it and initials are derived from it. When the name is absent, the account cluster shows the existing role label (`Employee` or `Admin`) and the avatar carries no invented letters. Profile's identity line shows whichever of email and office is present, with no dangling separator and no invented person. A missing name or email is recorded in the contract README.

An unrecognised role or an unrecognised office is not added to `Role` or `OFFICES`. The gap is written to `specs/001-office-supplies-mvp/contracts/README.md`.

## API Contracts

Published contract: [CoDev OSRS API (Swagger UI)](https://codev-osrs-backend.vercel.app/) and the backend [INTEGRATION.md](https://github.com/CoDev-Bench-Team/codev-osrs-backend/blob/main/docs/INTEGRATION.md). Where they disagree, the live API wins and the gap is recorded in `specs/001-office-supplies-mvp/contracts/README.md`. This plan does not author a REST document.

This slice calls only:

| Call | Body | Result |
|------|------|--------|
| `POST /auth/google` | `{ credential }` — the Google ID token, in memory for this call | Current user, and the API sets the HTTP-only `session` cookie |
| `GET /auth/me` | none | Current user, or `401` when there is no session |
| `POST /auth/logout` | none | Cookie cleared |

Every call uses `credentials: 'include'` and `Content-Type: application/json` when there is a body. The client does not read or store the cookie.

The guide's example current user is `id`, `role`, and `location` only. Name and email are copied if the live schema has them. If either is missing, the README records that gap and the SPA type for the API user does not gain those fields.

Errors: `application/problem+json` with `title`, `status`, `detail`, and optional `errors[]` of `{ detail, pointer }`. The existing `src/shared/validation.ts` parser stays the form parser. The shared client reads the general problem, including `detail`, and reuses `pointerPath` rather than parsing pointers a second way.

Paged lists: `{ data, total, page, limit, totalPages }`. The reader exists in this slice. No screen calls it yet.

`401` and `403` are never retried. Classification, so later slices cannot forget it:

- `401` on any call ends the session and the shell shows sign-in.
- `403` on `POST /auth/google` or `GET /auth/me` is a sign-in refusal: no session, the problem's `detail` or `title` shown on the sign-in screen.
- `401` or `403` on `POST /requests`, `POST /requests/:id/receive`, and `POST /requests/:id/sign` ends the session. The client does not send the write again. This slice does not add those functions; the client recognises the paths when a later slice calls them through it. `scripts/check-api-session.mjs` asserts those three paths. Changing one requires a dated note in the contract README in the same change.
- `403` on any other call is returned to the caller as the problem, for that screen to show. The role in React state is not consulted.

Status and category label maps (`pending_approval` through `cancelled`, categories including `Wifi`) are added only after this slice compares the integration guide with a live API document and writes the result in the contract README. A fetch of `https://codev-osrs-backend.vercel.app/api-json` on 2026-10-02 returned 404, so this plan does not freeze those maps. If the live document still cannot be read, no mapper module is added and the README says the maps are not final.

The guide says signing moves a request to `completed`. This slice does not call sign, and it does not encode that transition. Parent BEN-154 already says to record that conflict rather than drop the Admin Complete step.

## Component / Module Breakdown

### Shared client — `src/shared/api/`

- `client.ts` — `apiRequest`. Builds the URL from the configured base, sends the cookie, parses JSON, throws one problem error, and never loops. On `401`, and on `403` for the session-ending paths above, it notifies the session source once. It does not touch `localStorage` or `sessionStorage`.
- `problem.ts` — the problem type and reader (`title`, `status`, `detail`, `errors`).
- `page.ts` — the paged-list reader.
- `asset-image.ts` — turns an API image string into an `<img src>` value. A value that is HTML is rejected. No `dangerouslySetInnerHTML`. Asset screens are not switched in this slice; later slices use this helper.
- `index.ts` — the only import path for later slices.

`GET /assets`, `GET /assets/:id`, `GET /inventory-items`, `GET /inventory-items/:id`, and `POST /requests/:id/receive` are not exported.

### Session source — `src/features/auth/`

- `api-session-source.ts` — second `SessionSource`. `current()` calls `GET /auth/me`. `signIn(credential)` posts `{ credential }` and drops the string when the call settles. `signOut()` calls `POST /auth/logout`. `subscribe` uses a `BroadcastChannel` named `osrs.session` that carries no user and no role, so another tab re-reads `/auth/me` after sign-out. The same listener also re-reads `/auth/me` when the tab becomes visible again, so a browser that blocks the channel still drops a signed-out tab without waiting for a manual reload. It does not read `osrs.session`, `osrs.demo.sessions`, or `osrs.demo.account`.
- `session-source.ts` — `signIn(credential?: string)`. The seeded source ignores the argument. Add `selectSessionSource()`: unset or blank `VITE_API_BASE_URL` returns the seeded source; a set value returns the API source and never falls back if that source's calls fail.
- `types.ts` — `name` and `email` optional, as the Data Model says. `Role` stays `'employee' | 'admin'`.
- `SessionProvider.tsx` — passes the credential through to `source.signIn`. A `403` refusal and an unreachable API become a sign-in notice. They do not swap in `seededSessionSource`. `status` still starts at `unknown`, so a restore does not flash the sign-in card.
- `session-context.ts` — `signIn(credential?: string)`. Notice can carry the published problem text.
- `LoginScreen.tsx` — the designed `SignInButton` stays. With demo accounts, the click calls `signIn()` as it does today. Without them, and when `VITE_GOOGLE_CLIENT_ID` is set, Google's own button is laid over that control (`renderButton`). One Tap is not used: against the real client id it produced no credential. The credential is passed into `signIn` for that call only. A keyboard activation inside Google's iframe delivers the same credential. The demo chooser already hides itself when the source has no `accounts()`. A refusal shows the problem `detail`, unless that detail is only the HTTP reason phrase (`Unauthorized`, `Forbidden`), in which case it shows `title`. When the body has neither, the existing "Sign-in did not succeed" sentence stays. The live `POST /auth/google` examples use that phrase in `detail` and the explanation in `title`.
- `src/app/App.tsx` — `<SessionProvider source={selectSessionSource()}>`. The provider's default stays the seeded source so a caller can still inject one.

The Google client id is not an API field. The live Swagger document does not name one. BEN-96 configures it as `VITE_GOOGLE_CLIENT_ID`. The API-mode button reads that variable and does not invent an id in source. When it is unset, API-mode sign-in refuses and the Google script is not loaded. Seeded mode, with `VITE_API_BASE_URL` unset, does not load the Google script. `VITE_COMPANY_DOMAIN` is the account-picker hint only.

### Screens left on seeded sources

No edits to the source pickers for catalog, My Requests, profile, the admin queue, history, assets, or inventory. The account cluster (`src/app/AppLayout.tsx`) and Profile (`src/features/profile/IdentityBlock.tsx`) already read the session user. They gain the missing-name behavior from the Data Model: role label in the cluster, and email and office only when present on Profile.

### Cookie and the one switch

- `vite.config.ts` — when `VITE_API_BASE_URL` is set, the dev server proxies `/auth` to it so the session cookie is first-party on the Vite origin. The client then uses a same-origin path in development. A Netlify build does the same with a `/auth/*` rewrite, because a deploy preview is a different site from the API and a direct call is blocked. Any other production build calls `VITE_API_BASE_URL` directly.
- `specs/001-office-supplies-mvp/quickstart.md` and the README line that mentions `VITE_API_ORIGIN` — document `VITE_API_BASE_URL`, the dev-only proxy, `credentials: 'include'`, and that an unset variable keeps the seeded session. Do not document a second variable. Quickstart also carries a production check: the SPA and the API are on the same site, the cookie is `Secure` and `SameSite=Lax`, and a refresh on those real hosts restores the person. A passing localhost session does not satisfy that check.

### Contract record and checks

- `specs/001-office-supplies-mvp/contracts/README.md` — dated notes for whatever the live comparison finds: current-user name and email, role vocabulary, office vocabulary, Google client id if unpublished, and status/category maps final or explicitly not final.
- `scripts/check-api-session.mjs`, registered in `scripts/verify.mjs` — with no API base URL, the seeded Employee and Admin still land on `/catalog` and `/queue`. The API client module contains the three auth calls and does not contain the five deferred routes. A `401` and a `403` are issued once. The session-ending write paths are exactly `POST /requests`, `POST /requests/:id/receive`, and `POST /requests/:id/sign`. The API source module does not reference the seeded storage keys or `localStorage`. The account cluster source shows the role label when the session name is absent.

## Project Structure

```
src/shared/api/
  client.ts
  problem.ts
  page.ts
  asset-image.ts
  index.ts
src/features/auth/
  api-session-source.ts
  session-source.ts          # selectSessionSource, signIn credential argument
  types.ts                   # optional name and email
  SessionProvider.tsx
  session-context.ts
  LoginScreen.tsx
src/app/App.tsx              # source={selectSessionSource()}
src/app/AppLayout.tsx        # role label when the session name is absent
src/features/profile/IdentityBlock.tsx  # email and office only when present
vite.config.ts               # dev proxy only when the base URL is set
scripts/check-api-session.mjs
scripts/verify.mjs
specs/001-office-supplies-mvp/quickstart.md
specs/001-office-supplies-mvp/contracts/README.md
```

No mapper file in this layout. `src/shared/api/maps.ts` is created only after the live comparison in the contract README says the status and category maps are final.

## Dependencies

No new npm dependency. Google Identity Services is loaded from Google's script only in API mode, and only after the live document has identified the frontend client id. `.env` stays gitignored. No client id, cookie, or credential is committed.

## Constitution Compliance

| Principle | Status |
|-----------|--------|
| I. Spec-driven | PASS. The plan implements `specs/spec.md` and does not pull in BEN-155–BEN-162. |
| II. Two roles | PASS. `employee` and `admin` only. An unrecognised role grants no screens. |
| III. Inventory integrity | PASS. This slice changes no stock. |
| IV. Request state machine | PASS. No transition is called. The guide's sign-to-completed claim is not encoded. |
| V. Notifications | PASS. The SPA sends no email. |
| VI. Independently testable | PASS. Seeded mode is the current demo. API mode is the session only, checked without switching the other screens. |
| VII. Typed contracts | PASS. Auth calls, problem shape, and page shape are the published ones. Gaps go to the contract README. Maps stay unfrozen until a live document is read. |
| VIII. MVP restraint | PASS. No new framework, no new server, no ADR. The dev proxy is the option `quickstart.md` already allows. |
| IX. Secrets | PASS. No token in storage. The credential is an argument that is dropped when the call settles. Seeded users stay the documented placeholders. |

## Requirement coverage

| Requirement | Where the plan meets it |
|-------------|-------------------------|
| FR-001, FR-003 | `selectSessionSource()` unset path; screen source pickers untouched |
| FR-002, FR-006 | `api-session-source.ts` |
| FR-004, FR-027 | No fallback inside the API source; it never reads seeded storage keys |
| FR-005, FR-007 | `signIn(credential)` and `credentials: 'include'` |
| FR-008, FR-014 | Problem `detail` or `title` on the sign-in screen; no session |
| FR-009, FR-010 | Role from `GET /auth/me` into the existing guard; page role is not an authorization check |
| FR-011, FR-012 | Map name, email, office only when present; initials from the name; role label when the name is absent; gap recorded |
| FR-013, FR-026 | `401` from `current()` → signed out; `unknown` until `current()` settles |
| FR-015, FR-016 | Client path classification; no retry |
| FR-017, FR-018 | `src/shared/api/` only; deferred routes not exported |
| FR-019, FR-020 | `problem.ts`, `page.ts` |
| FR-021 | Mapper file gated on the live comparison note |
| FR-022 | `asset-image.ts` |
| FR-023 | Client writes no browser storage; no `/users` call |
| FR-024 | Dev proxy and the Netlify `/auth` proxy; quickstart production same-site check on the real hosts |
| FR-025 | Contract README notes. The Google client id is `VITE_GOOGLE_CLIENT_ID`, not a Swagger field |

## Known Risks

Red-team on 2026-10-02. All five risks are mitigated. None are accepted.

| Risk | Mitigation in this plan |
|------|-------------------------|
| The live document never names a Google client id | Read `VITE_GOOGLE_CLIENT_ID` (BEN-96). Do not write the id into source. Unset, API-mode sign-in refuses. Seeded sign-in keeps working. |
| The dev proxy makes the cookie look fine on localhost while production drops it | A Netlify build proxies `/auth` the same way, because that host is a different site from the API. Quickstart requires a refresh on the real SPA and API hosts, on the same site, before the cookie setup is called done. A localhost or deploy-preview session does not satisfy that check. |
| `GET /auth/me` has no name, and the shell looks empty | The account cluster shows the existing role label. Profile shows email and office only when the body has them. The missing fields are recorded. No person is invented. |
| Another tab stays signed in because `BroadcastChannel` is blocked | That tab re-reads `GET /auth/me` when it becomes visible again, as well as when the channel fires. |
| A later rename of the session-ending writes leaves a `403` on the screen | The check script asserts `POST /requests`, `POST /requests/:id/receive`, and `POST /requests/:id/sign`. A path change lands with a contract-record note in the same change. |
