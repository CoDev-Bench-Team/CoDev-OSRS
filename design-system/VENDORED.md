# Vendored design-system source — DO NOT EDIT

A verbatim copy of the OSRS design system generated from
`Office Supplies Request System (OSRS).fig` (Mockups page, 18 frames).

**Vendored**: 2026-09-12 · **Origin**: `~/Downloads/OSRS Design System/`
**Files**: 106 (excludes `.DS_Store` and `.thumbnail`)

## Why this is in the repository

Spec 002 reads every token, component and asset from this source. Leaving it in a
Downloads folder made the foundation depend on a path outside version control
(plan 002, precondition P2). It is committed so that:

1. `docs/design-system/token-map.md` can trace each token to a real, stable path (FR-019).
2. The FR-005a fidelity check can render the original `.jsx` components beside the
   ported `.tsx` and diff computed styles.
3. A re-export from the designer can be diffed against this baseline to surface drift.

## Rules

- **Never edit anything in this directory.** It is not source we own.
- A change here means the designer re-exported. That is exactly what the FR-019
  drift check looks for — re-vendor, then diff, then reconcile the token map.
- Imported only by the gallery's dev-only compare harness, via the `@ds/*` alias.
  Nothing here may reach a production bundle.

## Verifying integrity

`SHA256SUMS` is the baseline manifest. To check this copy is unmodified:

```bash
cd design-system && shasum -a 256 -c SHA256SUMS
```

To check a fresh export from the designer for drift, vendor it to a temporary
directory, regenerate the manifest there, and diff the two files.
