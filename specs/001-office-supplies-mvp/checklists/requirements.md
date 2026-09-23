# Requirements Quality Checklist

Checks whether **requirements are well-written**, not whether the product is implemented.

- [ ] CHK001 Are all four pipeline stages represented as user stories with acceptance criteria? [Coverage, Spec §User Scenarios]
- [ ] CHK002 Is “real-time status” defined as pull-after-mutation vs push? [Clarity, Spec §Assumptions]
- [ ] CHK003 Are inventory rules 1–4 consistent between spec FR-006/FR-008/FR-017 and `docs/process-flow.md`? [Consistency]
- [ ] CHK004 Is rejection-without-reason specified as a refused action? [Completeness, FR-008]
- [ ] CHK005 Are notification recipients specified per event (not only subjects)? [Completeness, FR-014]
- [ ] CHK006 Can SC-001 through SC-006 be objectively demonstrated without extra product interpretation? [Measurability]
- [ ] CHK007 Are concurrent oversell and multi-line atomicity specified as edge cases? [Edge Cases]
- [ ] CHK008 Is the three-role model explicit so a combined Admin cannot satisfy the spec? [Consistency, Constitution II]
- [ ] CHK009 Are out-of-scope items listed so purchasing/SSO cannot be treated as implied MVP work? [Completeness]
- [ ] CHK010 Is “new request after reject” stated so reopen is not an implicit feature? [Clarity, FR-009]
- [ ] CHK011 Is the actor who sets `Completed` specified — a Supply Admin, never the Employee? [Coverage, US5, FR-012a/b]
- [ ] CHK012 Is pickup location required at release, matching the email “[Location]” placeholder? [Dependencies, FR-011]
