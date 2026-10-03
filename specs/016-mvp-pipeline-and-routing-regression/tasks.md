# Tasks: MVP pipeline and routing regression

**Spec**: `specs/spec.md`
**Plan**: `specs/plan.md`
**Structure**: By user story, P1 first
**Tracker**: BEN-50 on every task

Format: `- [ ] [TaskID] [P?] [Story?] [BEN-50] Description — path`

## Phase 1: Setup

- [x] T001 [P] [BEN-50] Add `@playwright/test` and an `e2e` script — `package.json`
- [x] T002 [BEN-50] Run the `e2e/` suite on Chromium against the Vite dev server — `playwright.config.ts`

## Phase 2: Foundational

- [x] T003 [P] [BEN-50] Add the shared request register for requests the suite creates, including status, reasons, pickup location, and the signature — `src/features/requests/demo-request-register.ts`
- [x] T004 [P] [BEN-50] Move unit status only for units created in the session, and leave existing seeded rows as they are — `src/features/inventory/seeded-unit-register.ts`
- [x] T005 [BEN-50] Count catalog Available for a newly created asset from the unit register, and keep the seeded Available map for assets that already exist — `src/features/catalog/seeded-stock.ts`
- [x] T006 [BEN-50] On submit, reserve the quantity and append one `Pending Approval` request to the shared register — `src/features/requests/create/seeded-request-submit-source.ts`
- [x] T007 [BEN-50] Read, cancel, mark received, and sign Maya's requests through the shared register — `src/features/requests/detail/seeded-employee-request-source.ts`
- [x] T008 [BEN-50] List those requests on the Admin queue and apply approve, reject, handover, received, complete, and cancel on the same register — `src/features/requests/queue/seeded-admin-request-source.ts`
- [x] T009 [P] [BEN-50] Sign in once at `/login`, then switch Maya and Ethan through the account cluster — `e2e/fixtures/session.ts`
- [x] T010 [P] [BEN-50] Count Davao Inventory rows for the asset the test created — `e2e/fixtures/stock.ts`
- [x] T011 [P] [BEN-50] Annotate a missing notification, and fail when a visible record mismatches the template — `e2e/fixtures/gaps.ts`

## Phase 3: Happy path through pickup to completion (P1)

- [x] T012 [US1] [BEN-50] Encode an asset, add 10 Davao units, submit 3, approve, set Ready for Pickup with a location, refuse Complete before the signature, mark Received, sign, and complete, checking Inventory at every checkpoint — `e2e/happy-path.spec.ts`

## Phase 4: Reject path releases the reservation (P1)

- [x] T013 [US2] [BEN-50] Refuse an empty rejection reason, reject with a reason, show that reason to Maya, restore Available, and submit a new request while the rejected one stays rejected — `e2e/reject-path.spec.ts`

## Phase 5: Cancel paths require a reason (P1)

- [x] T014 [US3] [BEN-50] Cancel as Maya from Pending Approval and as Ethan from Approved and Ready for Pickup, refuse an empty reason, and refuse Maya's cancel once the request is Approved — `e2e/cancel-path.spec.ts`

## Phase 6: Direct-address refusals follow the role (P1)

- [x] T015 [US4] [BEN-50] Refuse the wrong role's destinations, distinguish an unknown address, and return a signed-out visitor through sign-in — `e2e/routing.spec.ts`

## Phase 7: Delivery is a peer, and it cannot be cancelled (P2)

- [x] T016 [US5] [BEN-50] Set For Delivery with stock unchanged, refuse cancel, allow the move to Ready for Pickup, and refuse handover from Pending Approval — `e2e/delivery.spec.ts`

## Phase 8: The owning Employee can mark their own handover received (P2)

- [x] T017 [US6] [BEN-50] Maya marks her own handover Received, a request she does not own is refused, Received is refused before handover, and a second signature is refused — `e2e/employee-received.spec.ts`

## Phase 9: Each transition leaves the notification the product records (P2)

- [x] T018 [US7] [BEN-50] For each transition, annotate a missing notification and fail a visible record that mismatches the template, including the Admin queue on Maya's cancel — `e2e/notifications.spec.ts`

## Phase 10: Polish

- [x] T019 [P] [BEN-50] Run lint, build, and Playwright on the pull request, and upload the trace when the suite fails — `.github/workflows/ci.yml`
- [x] T020 [P] [BEN-50] Document `npm run e2e` and the Davao path through Received, the signature, and Complete — `specs/001-office-supplies-mvp/quickstart.md`
- [x] T021 [BEN-50] Keep the existing verify run green after the register seam — `scripts/verify.mjs`
