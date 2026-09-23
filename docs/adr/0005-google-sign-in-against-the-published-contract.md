# ADR-0005 — Google sign-in against the published contract

**Status**: Accepted
**Date**: 2026-09-17
**Supersedes**: nothing. **Relates to**: [ADR-0001](0001-spa-rest-api.md), [ADR-0003](0003-three-role-model.md), spec 003 D3/D4

## Context

The backend team published its REST contract on 2026-09-16
(<https://codev-osrs-backend.vercel.app/#/>, now recorded in
`specs/001-office-supplies-mvp/contracts/README.md`). It exposes `POST /auth/google`,
`GET /auth/me` and `POST /auth/logout`, with the session carried as an httpOnly cookie named
`session`.

Spec 003 built the shell against a `SessionSource` boundary precisely so this moment would cost
one file (D3, FR-002, FR-003). Three things about the published contract still needed deciding.

## Decision

### 1. The SPA runs Google Identity Services and holds a client id, and Google's own button receives the click

`GoogleLoginDto.credential` is documented as "the Google OAuth ID token credential returned by
Google Sign-In", and the contract publishes no redirect or callback endpoint. The credential is
therefore obtained in the browser, which means the SPA loads
`https://accounts.google.com/gsi/client` and is configured with a Google Web OAuth client id.

This is narrower than it sounds and does not reopen the SSO non-goal in `docs/product.md`: the SPA
still performs no authentication and makes no authorization decision. It obtains an opaque token
from Google and hands it to the backend, which decides everything. All of it is confined to
`src/features/auth/google-identity.ts`; nothing above the session boundary knows Google exists.

The script is loaded on demand by the sign-in screen, not declared in `index.html`, so a
seeded-source run — and any already-signed-in load, which never renders that screen — makes no
third-party request at all.

**Google's rendered button is the control, laid invisibly over the drawn one.** The first
implementation drove sign-in from `prompt()` (One Tap) so the designed control could own the click.
Tested against the real client id, `prompt()` rendered nothing and invoked no callback: One Tap
declines silently in ordinary conditions and offers no reliable signal to fall back on.
`renderButton` works, and it is what the Linear requirements specify.

That collides with the design file, which draws a 242x64 borderless pill Google's button cannot be
restyled into — it caps near 40px tall and draws its own border and type. So Google's button is
rendered at `opacity: 0`, stretched over the drawn pill, and receives every click in that area:
the requirement and the design are both satisfied rather than traded off.

Two consequences follow, and both are handled in `GoogleSignInOverlay.tsx`:

- The drawn control is `inert` while the overlay is mounted. A keyboard press on it could never
  open Google's popup, so it would open a credential request nothing could satisfy.
- A control at `opacity: 0` has no visible focus indicator, which FR-023 requires. The overlay
  becomes fully visible while focus is inside it, so a keyboard user sees and operates Google's own
  button, with Google's own focus ring. A pointer user never triggers that.

This is the one place the feature reaches above the session boundary: `LoginScreen.tsx` gains a
wrapper and a conditional overlay. It stays boundary-shaped — the screen asks
`hasGoogleButton(source)`, exactly as it already asks `hasDemoAccounts(source)`, and contains no
Google-specific code or environment check.

### 2. The role model is two roles, and constitution II was amended to say so

The contract's `role` enum is `admin | employee`. Constitution II required three roles and stated
that "a combined 'Admin' role MUST NOT replace Approver and Supply Admin".

The product owner confirmed on 2026-09-17 that two roles **is** the model, not a gap awaiting a
third value. Constitution I requires that an instruction contradicting a spec be recorded as an
amendment rather than applied silently, so:

- **Constitution II is amended** in `AGENTS.md` and `specs/constitution.md`, version **3.0.0**
  (MAJOR — a principle was redefined). It now requires two roles, Employee and Admin, while
  keeping the pipeline's *stages* distinct.
- **ADR-0003 is superseded** by this one.
- **`CLAUDE.md`'s "Three roles only" hard rule** is updated to match.

`admin` maps one-to-one onto a new `admin` role in the SPA. An admin gets the union of what the
two split roles could do — the pending-requests queue, the fulfilment queue, inventory, history and
the catalog — and lands on the approvals queue, because their work starts with the decisions
waiting on them. That is also the bar the design file actually drew, before spec 003's D1 split it.

`approver` and `supply_admin` stay in the `Role` union. They are not issued by the contract, but
the separation they describe is still the product's process, and the seeded demo source uses them
to demonstrate each stage on its own. If the API ever splits `admin`, they are already here and no
further amendment is needed.

**What this costs, stated plainly**: separation of duty. One person can now approve a request and
then release it. The stages remain separate transitions with separate notifications, so the process
is still auditable, but the control point ADR-0003 was protecting is gone. That is the product
owner's decision, not an oversight.

A contract role outside the mapping table is a **refusal**, never a cast. `Role` stays a closed
union (FR-005); widening it to absorb an unknown string is how an undefined role would silently
acquire whatever access it happened to land on.

### 3. Development proxies the API through the Vite dev server

The backend currently returns no `Access-Control-Allow-Origin` for any origin we tested, so a
direct cross-origin call from the SPA is blocked before it starts. `vite.config.ts` proxies `/api`
to the backend during development, which makes the API same-origin.

That also removes the cookie question: a same-origin cookie is first-party and needs no
`SameSite=None; Secure` negotiation. Setting `VITE_API_URL` to the absolute origin bypasses the
proxy and requires the backend to add the SPA's origin to its allowlist — still outstanding as of
2026-09-17 (`questionsToBackend.md` §3), so it stays unset in development.

### 4. `VITE_COMPANY_DOMAIN` is a hint, not a control

The domain is passed to Google as the `hd` account-picker parameter so the chooser offers work
accounts first. It is a client-side parameter anyone can remove, so nothing in the SPA treats it as
an authorization fact; the API remains responsible for domain validation.

## Consequences

- One new file implements the boundary (`api-source.ts`); `LoginScreen`, `SessionProvider`,
  `RequireAccess`, the routes and the guards are untouched. Spec 003's D3 paid off exactly as
  designed.
- The SPA holds no session token and cannot inspect the session. Every question about identity and
  role is answered by `/auth/me` on each resolution, so a role changed behind the boundary is
  picked up rather than cached (FR-017b).
- An httpOnly cookie fires no JavaScript events, so cross-tab sign-out (FR-017a) needs a
  localStorage ping to wake other tabs. The ping carries no user, role or token — only "ask again".
- With `VITE_GOOGLE_CLIENT_ID` unset the SPA runs the seeded source unchanged, so the demo, the
  Playwright targets and the fidelity gates keep working when the backend is unreachable.
- The Approver gap above must be visible to the product owner, not buried in this file.

## Alternatives considered

- **Backend-hosted redirect flow.** Would keep Google entirely out of the SPA, but the contract
  publishes no endpoint for it; adopting it would mean inventing one, which ADR-0001 and
  `ARCHITECT.md` §8 forbid.
- **Render Google's own button visibly**, in place of the drawn control. Simpler, and it is what a
  literal reading of the requirement asks for — but it cannot be styled into the 242x64 borderless
  pill the design specifies, so it would break spec 002 fidelity and contradict the mockup. The
  transparent overlay keeps both.
- **Drive sign-in from `prompt()` (One Tap)** so the drawn control owns the click. Implemented
  first, then removed: against the real client id it rendered nothing and called nothing back.
- **Map `admin` onto the existing `supply_admin`** (what the first pass did). It type-checks and
  needs no amendment, but an admin would get the fulfilment queue and no way to approve anything,
  so requests could never leave `Pending Approval`. It quietly broke the pipeline.
- **Map `admin` onto `approver`.** The mirror image: decisions work, nothing can be prepared or
  released.
- **Refuse `admin` sign-in** until the contract has three roles. Honest, but it would leave the SPA
  unable to sign in most of the backend's users and would block the integration outright.
- **Collapse the union to `employee | admin`** and delete the other two. Closest to the contract,
  but it would rip the approver and supply_admin tables out of spec 003's destinations, navigation
  and seeded source — a large change to files under review, for no behavioural gain.
