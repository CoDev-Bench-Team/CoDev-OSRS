# Feature Specification: Profile

> **Amended for constitution 3.0.0 (2026-09-24, BEN-123).** This spec shipped
> against three roles; `approver` and `supply_admin` are retired in favour of a
> single **Admin** ([ADR-0005](../../docs/adr/0005-two-role-model.md)). D2, FR-001,
> FR-012, SC-005 and the Known Gaps now say "Admin". The behaviour is
> unchanged — one page for every role. `plan.md` and `tasks.md` are left as the
> record of what was built against three roles. See Phase 0 of
> [specs/001-office-supplies-mvp/tasks.md](../001-office-supplies-mvp/tasks.md)
> and [drift-2026-09-22](../../docs/design-system/drift-2026-09-22.md).

**Feature Branch**: `006-profile`
**Created**: 2026-09-23
**Status**: Draft
**Linear**: [BEN-49](https://linear.app/bench-synergy-project/issue/BEN-49/p2spa-profile) (I0 [BEN-86](https://linear.app/bench-synergy-project/issue/BEN-86))
**Sources**: Figma `.fig` export 2026-09-22, frame `05 - Profile`; `specs/003-app-shell-routing/spec.md` (FR-006a, Story 3); published API contract linked from `specs/001-office-supplies-mvp/contracts/README.md`

## Overview

Give every signed-in user a Profile: who they are, which office they belong to, and — where the system can say so — the equipment currently assigned to them. It replaces the shell's Profile placeholder with the designed screen.

**Relationship to other specs**: furnishes the Profile destination that spec 003 made addressable and reachable from the account cluster (FR-006a). Adds no product behavior to spec 001 — no inventory math, no request transitions, no notifications.

## Decisions

| # | Decision | Consequence |
|---|----------|-------------|
| D1 | **The assigned list reads a register the MVP does not build.** The drawn tags (`CDV-MS-00087`, `CDV-PH-00231`) identify individual units, which belong to a per-unit asset register (serials, assignment to a person) that is out of scope under constitution VIII. The page renders whatever the backend exposes for "equipment assigned to me" and invents nothing. | `Currently Assigned` is a conditional section with three states (FR-007). No rows are fabricated, and no units are modelled to fill it. |
| D2 | **The Admin Profile is undesigned.** The file draws only the Employee's. Reusing the Employee layout unchanged for the Admin is **our invention**, not the designer's. | One page for both roles. Flagged to the designer below. |
| D3 | The identity block comes entirely from the session. Nothing on the page is hard-coded. | The session must carry the user's home office. Today it carries name, email, initials, avatar colour and role — **office is a new session fact** (see Dependencies). |

## User Stories

### Story 1 — See my own details (Priority: P1)

A signed-in user opens the account cluster in the top bar and lands on their Profile. They see the page title `Profile` over `Your details and currently assigned supplies`, then their avatar (initials on a colour chip), their full name, and a line reading their email and home office, for example `mayas@codev.com • Davao Office`.

**Why this priority**: This is the whole of the page for a user with no assigned-equipment data, and it is the only part the MVP backend can serve today.
**Independent Test**: Sign in as each seeded role, open Profile from the account cluster, and compare the identity block with that user's session.

**Acceptance Criteria**:

1. **Given** a signed-in Employee, **When** they choose Profile in the account cluster, **Then** the Profile destination opens with the header `Profile` / `Your details and currently assigned supplies`.
2. **Given** a signed-in user whose session names them Maya Santos, `mayas@codev.com`, office Davao, initials `MS`, **When** Profile renders, **Then** the identity block shows `MS` on their avatar colour, `Maya Santos`, and `mayas@codev.com • Davao Office`.
3. **Given** two different signed-in users, **When** each opens Profile, **Then** each sees only their own identity. Nothing from another user or a fixture appears.
4. **Given** a signed-in Admin, **When** they open Profile, **Then** it renders with the same layout as the Employee's (D2).
5. **Given** any signed-in user, **When** Profile renders, **Then** no navigation item is marked current, because Profile is not a navigation destination (spec 003 FR-006a).

### Story 2 — See equipment currently assigned to me (Priority: P2)

Below the identity block, under the heading `Currently Assigned`, the user sees each piece of equipment assigned to them: the item name, its asset tag, and `Assigned <date>`. When the system knows they have nothing assigned, they see an empty state instead. When the system has no way to know, the section is not shown at all.

**Why this priority**: The designed list depends on data the MVP backend does not provide today (D1). The page must ship without it.
**Independent Test**: Exercise each of the three states (FR-007) with the assigned-equipment source present with items, present and empty, and absent. With today's backend, the absent state is the live one.

**Acceptance Criteria**:

1. **Given** the backend exposes assigned equipment for the signed-in user and returns three items, **When** Profile renders, **Then** `Currently Assigned` lists those three, each with name, asset tag and `Assigned <Mon D, YYYY>` — e.g. `Laptop - Dell Latitude 5440` / `CDV-MS-00087` / `Assigned Jan 14, 2026`.
2. **Given** the backend exposes assigned equipment and returns none for this user, **When** Profile renders, **Then** `Currently Assigned` shows its heading and an empty state.
3. **Given** the backend exposes no assigned-equipment information at all, **When** Profile renders, **Then** the `Currently Assigned` section is not rendered, and the identity block renders normally.
4. **Given** any of the three states, **When** Profile renders, **Then** no item, tag or date appears that the backend did not supply.

### Edge Cases

- **Office missing from the session** (a seeded user without one, or a contract value the SPA does not recognise): the identity line shows the email alone, with no dangling `•` separator.
- **Long name or email**: wraps within the identity block. It is not truncated into ambiguity and does not overflow the page.
- **Assigned-equipment request fails** while a source exists: the section shows an error in place of the list. The identity block still renders, the page does not collapse into a full-screen error, and the error is not presented as the empty state.
- **Assigned-equipment data still loading**: the section shows a loading state. The identity block is not held back, because it comes from the already-resolved session.
- **An assigned item arrives without an asset tag or without an assigned date**: the row renders the fields it has. A missing tag is omitted. A missing or unreadable date is stated in words (`Assignment date not available`), never filled with a date value, so every card keeps the same two lines (amended 2026-09-23).
- **Session expires while Profile is open**: handled by the shell (spec 003 Story 6). Profile adds no behaviour.
- **Narrow viewport**: the assigned list collapses from two columns to one, and the identity block stays readable.
- **Direct address or reload on `/profile`**: renders the signed-in user's Profile; a signed-out visitor is sent to sign-in (spec 003).

## Functional Requirements

- **FR-001**: Profile MUST be reachable by every signed-in role — Employee and Admin — from the account cluster, and MUST NOT appear as a navigation item (spec 003 FR-006a).
- **FR-002**: Profile MUST render the header `Profile` with the supporting line `Your details and currently assigned supplies`.
- **FR-003**: Profile MUST show the signed-in user's avatar as initials on a flat colour chip, never a photograph (spec 003 Story 3, criterion 4), even though the backend's user record carries a photo URL.
- **FR-004**: Profile MUST show the signed-in user's full name, and a line of their email and home office in the form `<email> • <Office> Office`.
- **FR-005**: Every identity fact on Profile MUST come from the current session. No name, email, office, initials or colour may be hard-coded on the page.
- **FR-006**: Profile MUST show only the signed-in user's own information. It MUST NOT accept another user as a parameter, and no role may view another user's Profile.
- **FR-007**: The `Currently Assigned` section MUST have exactly three data states:
  - **(a) Source available, items returned** → a list of items.
  - **(b) Source available, no items** → the heading plus an empty state.
  - **(c) No source exposed by the backend** → the section is not rendered.
- **FR-008**: The system MUST distinguish state (b) from state (c). "Nothing assigned" and "the system cannot say" are different facts and MUST NOT look alike.
- **FR-009**: Each assigned item MUST show the item name, its asset tag as a tag chip, and `Assigned` followed by the assignment date in the form `Mon D, YYYY`, using only values the backend supplied. When the date is missing or does not parse, the date line reads `Assignment date not available` instead of being dropped; no date value is ever invented.
- **FR-010**: Profile MUST NOT fabricate, sample or seed assigned-equipment rows on a normal visit, and MUST NOT model individual units to produce them (D1, constitution VIII). An opt-in demo stub whose rows are visibly synthetic MAY be selected with `?assigned=` on `/profile` in every build (local, deploy preview and production), solely to exercise FR-007a/b, loading and failure. It MUST be loaded only when that parameter is present, as its own chunk that a normal visit never downloads. *(Amended 2026-09-23; second amendment the same day.)*
- **FR-011**: While a source exists, the `Currently Assigned` section MUST show distinct loading and error states. A failure there MUST NOT prevent the identity block from rendering.
- **FR-012**: Profile MUST render the same layout for Admin as for Employee (D2), and MUST NOT show role-specific content the design does not draw.
- **FR-013**: Profile MUST offer no editing. Every fact on it is read-only.

## Dependencies

- **Spec 003 shell** (A6 merged): the account cluster route to Profile and the `/profile` destination exist.
- **Session carries home office (D3)**: the session's user today has no office. The published contract's current-user resource carries an office `location` (one of Cebu, Bacolod, Makati, Pasig, Davao). Mapping it into the session, and giving the seeded demo users an office value, is a change to the shell's session boundary that `plan.md` must scope. The Employee's office (Davao) comes from the design; any office given to the seeded Admin is a non-production placeholder under constitution IX.
- **Assigned-equipment source**: the published contract exposes none today, so state (c) is the live state (FR-007). States (a) and (b) are exercised against a stubbed source until the backend publishes one. This feature does not request, design or name that endpoint (constitution VII).

## Out of Scope

- The per-unit asset register: serial numbers, asset-tag issuance, assignment and unassignment of units to people, BitLocker or other escrow (D1, constitution VIII).
- Editing name, email, office or avatar colour.
- Viewing another user's Profile, including by an Admin.
- Showing the Google profile photograph.
- Role-specific Profile content for the Admin beyond the reused Employee layout.
- Linking assigned items to requests, the catalog, or request history.
- Reconciling the contract's role vocabulary with the three SPA roles. That mapping belongs to the shell's session boundary, not this page.

## Success Criteria

- **SC-001**: For each of the three seeded roles, a tester reaches Profile from the account cluster in one action and sees that user's name, email and office exactly as the session holds them.
- **SC-002**: A search of the Profile feature, excluding its opt-in demo stub, finds no literal name, email, office, asset tag or date for any real or seeded user. *(Amended 2026-09-23.)*
- **SC-003**: Against today's backend, Profile renders with no `Currently Assigned` section and no error.
- **SC-004**: Against a stubbed source returning three items, Profile lists exactly those three, with name, tag and formatted date. Against a stubbed source returning none, it shows the empty state. Each outcome is verifiable in one run.
- **SC-005**: An Admin's Profile matches the Employee's layout in a side-by-side visual check against `05 - Profile`.

## Known Gaps — flag to the designer

| Gap | Impact |
|-----|--------|
| **No Profile screen for the Admin.** Only the Employee's is drawn. | D2 reuses the Employee layout. **Ours, not the designer's.** |
| **No empty state for `Currently Assigned`** is drawn. | Its copy and presentation are invented. |
| **No loading or error state for `Currently Assigned`** is drawn. | Both are invented (FR-011). |
| **The drawn list implies a per-unit asset register** the MVP does not build. | The section is conditional (FR-007) and hidden against today's backend. |
| **No affordance into Profile** is drawn now that Profile has left the navigation. | Inherited from spec 003: the account cluster is the route in. |

## Linear Reconciliation

| Source | Says | This spec |
|--------|------|-----------|
| BEN-49 acceptance 2 | "With no assigned-equipment data, `Currently Assigned` renders its empty state." | Holds when a source exists and returns nothing (FR-007b). With **no source at all** — today's backend — the section is hidden (FR-007c), per the owner's decision below. Verify BEN-49 acceptance 2 against a stubbed empty source. |
| BEN-49 acceptance 3 | "The page renders for **both** roles." | Employee and Admin (constitution 3.0.0 II). As first written this read "three roles, not two"; ADR-0005 made Linear right. |
| BEN-87 plan constraint 2 | data → list, no data → empty state, no endpoint → hidden | Adopted as FR-007. |
| BEN-88 checklist | "Empty state when the contract exposes no assigned equipment" | **Amended in Linear 2026-09-23** to the three states of FR-007. |
| BEN-89 checklist | "Empty state renders when there is no assigned-equipment data"; "PR base `main`" | **Amended in Linear 2026-09-23**: empty state checked with `?assigned=empty`, section hidden with no source; PR base `dev`. |
| BEN-49 acceptance 1 | "Identity, email and home office come from the session" | Met for the seeded session. For a real signed-in user it waits on mapping the contract's `location` into the session: **[BEN-112](https://linear.app/bench-synergy-project/issue/BEN-112)**, a sub-issue of BEN-49. BEN-49 acceptance 2 was amended in Linear the same day. |

## Checklist Overrides

- **CHK001 [Clarity]**: the empty-state wording for `Currently Assigned` is not fixed here. It is deferred to `plan.md`, which must follow `docs/design-system/content-conventions.md`, keep the wording distinct from the hidden state (FR-008), and flag it to the designer as invented copy.

## Clarifications

### Session 2026-09-23

- Q: BEN-49 says `Currently Assigned` shows its empty state when there is no assigned-equipment data; BEN-87 says it is hidden when there is no endpoint. The published contract has no such endpoint today. Which applies? → A: **Plan all three states** — list, empty state and hidden — with hidden as today's live state (FR-007, FR-008).
- Q: (Raised while planning) FR-010 forbids seeded assigned-equipment rows, but states (a) and (b) can only be exercised against a stub until the backend publishes an endpoint. Which wins? → A: **Amend FR-010.** It governs the production build. A development-only stub with visibly synthetic rows is permitted and must be absent from the production build. SC-002 excludes that stub for the same reason.
- Q: (Raised in design review) A card with no assigned date renders one line shorter than its neighbours, and the empty space reads as a defect. Omit the line, or say the date is missing? → A: **Say it.** The date line reads `Assignment date not available` when the date is missing or does not format. This amends FR-009 and the partial-row edge case. It is a statement of absence, not a value, so FR-009's "only values the backend supplied" and Story 2 scenario 4 still hold. The copy is invented and logged in `docs/design-system/additions.md` §3e.
- Q: (Raised on the PR #37 deploy preview) `?assigned=items` shows Netlify's 404, and even once the host serves the SPA, the stub was development-only, so previews and production could not show the demo states. Where should `?assigned=` work? → A: **Locally, on deploy previews and in production.** FR-010 is amended a second time: the stub ships in every build, opt-in by query and lazily loaded, so a normal visit neither renders nor downloads it. Consequence, accepted by the owner: anyone can open `/profile?assigned=items` on production and see the visibly synthetic `Stub item` rows on their own profile. Separately, the host now serves `index.html` for every route (`public/_redirects`), since every deep link, not just this one, returned 404 on Netlify.
