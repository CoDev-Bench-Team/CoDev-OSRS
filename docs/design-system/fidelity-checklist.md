# Fidelity checklist

How spec 002's verification criteria were checked. **All gates pass.**

Run everything with `npm run verify`. The browser gates need `npm run dev` and a
headless Chrome on port 9222:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --remote-debugging-port=9222 --user-data-dir=/tmp/osrs-cdp &
npm run dev
npm run verify
```

Chrome is driven over the DevTools Protocol through Node's built-in WebSocket
(`scripts/cdp.mjs`), so none of this adds a dependency — constitution VIII holds.

## Gates

| Gate | Requirement | Result |
|------|-------------|--------|
| Token reconciliation | FR-001 | 156 / 156 against the source's own `tokenKinds`, no orphans either way |
| Namespace reset holds | FR-003, SC-001 | Tailwind defaults produce no rule: `bg-blue-500`, `text-sm`, `rounded-lg`, `shadow-md`, `font-thin`, `bg-gray-100` all absent |
| Every utility resolves | FR-003 | 181 utilities across 24 files |
| No constructed class names | FR-003 | none — Tailwind extracts statically, so `text-${size}` yields nothing |
| No raw hex | FR-003 | 0. 18 arbitrary values remain, all fixed geometry the source states but never tokenises |
| Type safety | FR-007, SC-004 | `tsc -b` with `strict`; `RequestStatus` admits only the six legal states |
| **Computed-style fidelity** | **FR-005a, SC-003** | **12 pairs, 168 properties, 0 differences** against the vendored source |
| Composite type roles | FR-001, FR-002 | all 13 render at their declared family, size and weight |
| Self-hosted fonts | FR-004, SC-002 | 49 requests, all same-origin; all four faces resolve |
| Keyboard + focus | FR-011, SC-006 | 38 elements reached by Tab, every one shows an indicator |
| Responsive | FR-012, SC-005 | no horizontal overflow at 360/768/1024/1440; all targets ≥44px below the design width |
| Overflow geometry | FR-016a | card width identical at 436px, height bounded by the clamps |
| Contrast | FR-011a | 13 of 15 pairings pass AA; 2 fail and are recorded in [additions.md](additions.md), unchanged |
| Source drift | FR-019 | `shasum -a 256 -c SHA256SUMS` clean |
| No vendored source in production | plan §Assets | `design-system/` absent from the built bundle |

## Bugs these gates caught

Worth recording, because each was invisible to review and to the build.

| Bug | Why it was invisible |
|-----|----------------------|
| **Every display heading rendered in Inter, not Space Grotesk.** The 13 composite type roles still referenced `var(--weight-medium)` after that token was renamed `--font-weight-medium`. A dangling `var()` makes the whole `font:` shorthand invalid, so the declaration is dropped and the element inherits. | The utility compiled fine — only its *value* was broken. No compile check can see this; it needed a rendering browser. The fidelity comparison missed it too, because the source components use inline styles rather than the type utilities. |
| `min-w-44` styled nothing — no 44px spacing token existed. | With Tailwind's namespaces cleared, an unknown utility emits no CSS and no error. |
| `inset-0` and `min-w-0` disappeared when `--spacing` was cleared. | Same silent failure. Zero is not a design value, so `--spacing-0` was added. |
| `text-32` was never generated — the gallery built the class name by interpolation. | Tailwind extracts statically. The size ladder would have rendered every sample identically. |
| `ButtonTemplate`'s saved state kept its white background. | Two `bg-*` classes on one element: CSS source order wins, not attribute order. |
| The availability chip was never compared. | The harness skipped captions by matching `className.indexOf('text-11')` — and `text-11-5` contains that substring. FR-009's component silently fell out of the comparison. |
| The compare harness shipped in the production bundle. | `import.meta.env.DEV` guarded the *use* of a `lazy()` component declared unconditionally, so Rollup still emitted the chunk. The guard has to wrap the `lazy()` call itself. |
| `#compare` did nothing on an already-open page. | Changing the hash fires `hashchange` without reloading; nothing listened, so React never re-rendered. |
| The fidelity script reported PASS while comparing nothing. | It found 0 pairs and exited 0. It now fails unless it finds all 12. |

## Still done by eye

The gates cover measurable properties. They do not judge whether a component
*looks* right — background images, icon path rendering, and optical alignment
are not compared. Open the gallery beside
`design-system/ui_kits/osrs-web/index.html` and the `guidelines/*.card.html`
specimens at 1440px for that pass.
