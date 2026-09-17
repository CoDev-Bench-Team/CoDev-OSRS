# Token map

Every token in the SPA traced to the design-system source it was read from, so
a re-exported `.fig` can be diffed against this foundation (spec 002 FR-019).

**Baseline**: `design-system/SHA256SUMS` — 106 files, vendored 2026-09-12.
Verify with `cd design-system && shasum -a 256 -c SHA256SUMS`. A checksum
change means the designer re-exported; re-vendor, then reconcile this table.

**Totals**: 156 source tokens. 69 colour, 47 type, 27 spacing, 9 radius,
1 shadow, 3 motion. 24 renamed (see below); every value is unchanged.

## Renames

Values are identical to the source. Only the name differs, and only where the
source name could not survive the port intact.

| Source | In the SPA | Why |
|--------|-----------|-----|
| `--backdrop-fill` | `--color-backdrop` | Moved into the colour namespace. |
| `--border-default` | `--color-line-default` | Moved into the colour namespace; `--color-border-*` would produce `border-border-default`. |
| `--border-strong` | `--color-line-strong` | Moved into the colour namespace; `--color-border-*` would produce `border-border-default`. |
| `--control-height-lg` | `--spacing-control-height-lg` | Moved into the spacing namespace so it produces width/height utilities. |
| `--control-height-md` | `--spacing-control-height-md` | Moved into the spacing namespace so it produces width/height utilities. |
| `--control-height-sm` | `--spacing-control-height-sm` | Moved into the spacing namespace so it produces width/height utilities. |
| `--layout-content-width` | `--spacing-layout-content-width` | Moved into the spacing namespace so it produces width/height utilities. |
| `--layout-gutter` | `--spacing-layout-gutter` | Moved into the spacing namespace so it produces width/height utilities. |
| `--layout-page-width` | `--spacing-layout-page-width` | Moved into the spacing namespace so it produces width/height utilities. |
| `--layout-topbar-height` | `--spacing-layout-topbar-height` | Moved into the spacing namespace so it produces width/height utilities. |
| `--row-height-inventory` | `--spacing-row-height-inventory` | Moved into the spacing namespace so it produces width/height utilities. |
| `--row-height-request` | `--spacing-row-height-request` | Moved into the spacing namespace so it produces width/height utilities. |
| `--text-body` | `--color-ink-body` | Is a colour, but the name occupies Tailwind's `--text-*` font-size namespace, where `--text-11`–`--text-32` also live. Both would break. |
| `--text-heading` | `--color-ink-heading` | Is a colour, but the name occupies Tailwind's `--text-*` font-size namespace, where `--text-11`–`--text-32` also live. Both would break. |
| `--text-link` | `--color-ink-link` | Is a colour, but the name occupies Tailwind's `--text-*` font-size namespace, where `--text-11`–`--text-32` also live. Both would break. |
| `--text-muted` | `--color-ink-muted` | Is a colour, but the name occupies Tailwind's `--text-*` font-size namespace, where `--text-11`–`--text-32` also live. Both would break. |
| `--text-primary` | `--color-ink-primary` | Is a colour, but the name occupies Tailwind's `--text-*` font-size namespace, where `--text-11`–`--text-32` also live. Both would break. |
| `--text-secondary` | `--color-ink-secondary` | Is a colour, but the name occupies Tailwind's `--text-*` font-size namespace, where `--text-11`–`--text-32` also live. Both would break. |
| `--text-strong` | `--color-ink-strong` | Is a colour, but the name occupies Tailwind's `--text-*` font-size namespace, where `--text-11`–`--text-32` also live. Both would break. |
| `--weight-bold` | `--font-weight-bold` | Tailwind's font-weight namespace is `--font-weight-*`. |
| `--weight-extrabold` | `--font-weight-extrabold` | Tailwind's font-weight namespace is `--font-weight-*`. |
| `--weight-medium` | `--font-weight-medium` | Tailwind's font-weight namespace is `--font-weight-*`. |
| `--weight-regular` | `--font-weight-regular` | Tailwind's font-weight namespace is `--font-weight-*`. |
| `--weight-semibold` | `--font-weight-semibold` | Tailwind's font-weight namespace is `--font-weight-*`. |

## Additions

Thirteen tokens exist that the vendored source does not define. All are recorded
in `additions.md`. The last five came from the 2026-09-15 `.fig` re-export
(`drift-2026-09-15.md`), which gave `Completed` a purple of its own and added
`Cancelled`.

| Token | Value | Why |
|-------|-------|-----|
| `--spacing-0` | `0px` | Not a design value. `inset-0`, `min-w-0` and every zero-length utility derive from the spacing scale, and clearing Tailwind's default removed them. |
| `--spacing-touch-target` | `44px` | The minimum touch target below the design width (spec 002 FR-012). The source has no mobile frames. |
| `--color-osrs-pink-500` | `rgb(239,93,168)` | The "For Delivery" ink. No pink exists anywhere in the source palette; specified by the project owner, 2026-09-14 (additions.md §2b). |
| `--color-osrs-pink-tint` | `rgba(239,93,168,0.1)` | Its 10% fill, following the `--osrs-*-tint` convention the source already uses for green and red. |
| `--color-status-delivery-bg` / `-fg` | the pink pair | Semantic alias for the delivery handover label. |
| `--color-status-pickup-bg` / `-fg` | `var(--color-osrs-blue-50)` / `var(--color-osrs-blue-700)` | Semantic alias only — **both values are source primitives**, unchanged. The source defines the blues but no component uses this pairing. |
| `--color-osrs-google-green` | `rgb(52,168,83)` | A Google brand colour. **Present in the `.fig`, absent from the export**: the mark's vector carries only the red in `fillPaints` and takes this from `vectorData.styleOverrideTable` (styleID 3), which `tokens/colors.css` never captured. Restored 2026-09-15 (additions.md §4.2). |
| `--color-osrs-google-yellow` | `rgb(251,188,5)` | The same, styleID 4. |
| `--color-osrs-purple-600` | `rgb(104,64,184)` | `Completed`'s ink in the 2026-09-15 export — the file's own `Status/Completed` colour style. Not in the vendored palette, which had `Completed` green. |
| `--color-osrs-purple-50` | `rgb(241,236,255)` | Its fill, taken from the rendered pill on `04.1 - My Requests - View Request`. Slightly bluer than a flat 10% tint of the ink, so it is transcribed rather than computed. |
| `--color-osrs-ink-tint` | `rgba(75,80,99,0.1)` | `Cancelled`'s fill. The file gives the ink (`Status/Cancelled` = `rgb(75,80,99)`, already `--osrs-ink-700`) but draws no chip, so the fill follows the `--osrs-*-tint` convention the source uses for red, green, blue and pink. |
| `--color-status-completed-bg` / `-fg` | the purple pair | Semantic alias for `Completed`. |
| `--color-status-cancelled-bg` / `-fg` | `var(--color-osrs-ink-tint)` / `var(--color-osrs-ink-700)` | Semantic alias for `Cancelled`. |

## Every token

| Source token | Source file | Value | In the SPA | Kind |
|---|---|---|---|---|
| `--backdrop-fill` | `tokens/colors.css` | `rgba(0,0,0,0.5)` | `--color-backdrop` | color |
| `--border-default` | `tokens/colors.css` | `var(--osrs-border)` | `--color-line-default` | color |
| `--border-strong` | `tokens/colors.css` | `var(--osrs-black)` | `--color-line-strong` | color |
| `--brand-on-primary` | `tokens/colors.css` | `var(--osrs-white)` | `--color-brand-on-primary` | color |
| `--brand-primary` | `tokens/colors.css` | `var(--osrs-red-600)` | `--color-brand-primary` | color |
| `--brand-primary-alt` | `tokens/colors.css` | `var(--osrs-red-500)` | `--color-brand-primary-alt` | color |
| `--components-backdrop-fill` | `tokens/fig-tokens.css` | `rgba(0,0,0,0.5)` | `--color-components-backdrop-fill` | color |
| `--osrs-amber-50` | `tokens/colors.css` | `rgb(255,245,222)` | `--color-osrs-amber-50` | color |
| `--osrs-amber-700` | `tokens/colors.css` | `rgb(161,92,0)` | `--color-osrs-amber-700` | color |
| `--osrs-avatar-green` | `tokens/colors.css` | `rgb(21,101,53)` | `--color-osrs-avatar-green` | color |
| `--osrs-avatar-orange` | `tokens/colors.css` | `rgb(244,129,13)` | `--color-osrs-avatar-orange` | color |
| `--osrs-black` | `tokens/colors.css` | `rgb(0,0,0)` | `--color-osrs-black` | color |
| `--osrs-blue-50` | `tokens/colors.css` | `rgb(237,245,255)` | `--color-osrs-blue-50` | color |
| `--osrs-blue-600` | `tokens/colors.css` | `rgb(45,95,163)` | `--color-osrs-blue-600` | color |
| `--osrs-blue-700` | `tokens/colors.css` | `rgb(35,94,167)` | `--color-osrs-blue-700` | color |
| `--osrs-blue-tint` | `tokens/colors.css` | `rgba(45,95,163,0.1)` | `--color-osrs-blue-tint` | color |
| `--osrs-border` | `tokens/colors.css` | `rgb(227,230,236)` | `--color-osrs-border` | color |
| `--osrs-border-warm` | `tokens/colors.css` | `rgb(231,230,226)` | `--color-osrs-border-warm` | color |
| `--osrs-canvas` | `tokens/colors.css` | `rgb(250,250,249)` | `--color-osrs-canvas` | color |
| `--osrs-google-blue` | `tokens/colors.css` | `rgb(66,133,244)` | `--color-osrs-google-blue` | color |
| `--osrs-google-gray` | `tokens/colors.css` | `rgb(128,134,139)` | `--color-osrs-google-gray` | color |
| `--osrs-google-red` | `tokens/colors.css` | `rgb(234,67,53)` | `--color-osrs-google-red` | color |
| `--osrs-gray-400` | `tokens/colors.css` | `rgb(138,143,156)` | `--color-osrs-gray-400` | color |
| `--osrs-gray-500` | `tokens/colors.css` | `rgb(102,112,133)` | `--color-osrs-gray-500` | color |
| `--osrs-green-50` | `tokens/colors.css` | `rgb(234,248,240)` | `--color-osrs-green-50` | color |
| `--osrs-green-600` | `tokens/colors.css` | `rgb(46,126,71)` | `--color-osrs-green-600` | color |
| `--osrs-green-700` | `tokens/colors.css` | `rgb(22,121,74)` | `--color-osrs-green-700` | color |
| `--osrs-green-800` | `tokens/colors.css` | `rgb(22,101,0)` | `--color-osrs-green-800` | color |
| `--osrs-green-avatar` | `tokens/colors.css` | `rgb(21,101,53)` | `--color-osrs-green-avatar` | color |
| `--osrs-green-tint` | `tokens/colors.css` | `rgba(46,126,71,0.1)` | `--color-osrs-green-tint` | color |
| `--osrs-ink-700` | `tokens/colors.css` | `rgb(75,80,99)` | `--color-osrs-ink-700` | color |
| `--osrs-ink-800` | `tokens/colors.css` | `rgb(27,29,41)` | `--color-osrs-ink-800` | color |
| `--osrs-ink-900` | `tokens/colors.css` | `rgb(23,32,51)` | `--color-osrs-ink-900` | color |
| `--osrs-red-50` | `tokens/colors.css` | `rgb(255,241,240)` | `--color-osrs-red-50` | color |
| `--osrs-red-500` | `tokens/colors.css` | `rgb(204,47,74)` | `--color-osrs-red-500` | color |
| `--osrs-red-550` | `tokens/colors.css` | `rgb(210,58,58)` | `--color-osrs-red-550` | color |
| `--osrs-red-600` | `tokens/colors.css` | `rgb(198,40,40)` | `--color-osrs-red-600` | color |
| `--osrs-red-700` | `tokens/colors.css` | `rgb(200,30,30)` | `--color-osrs-red-700` | color |
| `--osrs-red-tint` | `tokens/colors.css` | `rgba(200,30,30,0.1)` | `--color-osrs-red-tint` | color |
| `--osrs-stone-600` | `tokens/colors.css` | `rgb(107,106,102)` | `--color-osrs-stone-600` | color |
| `--osrs-stone-900` | `tokens/colors.css` | `rgb(26,25,25)` | `--color-osrs-stone-900` | color |
| `--osrs-surface-subtle` | `tokens/colors.css` | `rgb(246,247,249)` | `--color-osrs-surface-subtle` | color |
| `--osrs-surface-table-header` | `tokens/colors.css` | `rgb(240,242,245)` | `--color-osrs-surface-table-header` | color |
| `--osrs-template-ink` | `tokens/colors.css` | `rgb(73,76,80)` | `--color-osrs-template-ink` | color |
| `--osrs-template-muted` | `tokens/colors.css` | `rgb(111,121,133)` | `--color-osrs-template-muted` | color |
| `--osrs-template-purple` | `tokens/colors.css` | `rgb(105,77,117)` | `--color-osrs-template-purple` | color |
| `--osrs-template-surface` | `tokens/colors.css` | `rgb(250,252,254)` | `--color-osrs-template-surface` | color |
| `--osrs-white` | `tokens/colors.css` | `rgb(255,255,255)` | `--color-osrs-white` | color |
| `--red-error` | `tokens/fig-tokens.css` | `rgb(198,40,40)` | `--color-red-error` | color |
| `--ring-brand` | `tokens/elevation.css` | `inset 0 0 0 1px var(--osrs-red-600)` | `ring-brand (utility)` | color |
| `--ring-default` | `tokens/elevation.css` | `inset 0 0 0 1px var(--osrs-border)` | `ring-default (utility)` | color |
| `--ring-ink` | `tokens/elevation.css` | `inset 0 0 0 1px var(--osrs-black)` | `ring-ink (utility)` | color |
| `--status-available-bg` | `tokens/colors.css` | `var(--osrs-green-tint)` | `--color-status-available-bg` | color |
| `--status-available-fg` | `tokens/colors.css` | `var(--osrs-green-600)` | `--color-status-available-fg` | color |
| `--status-info-bg` | `tokens/colors.css` | `var(--osrs-blue-tint)` | `--color-status-info-bg` | color |
| `--status-info-fg` | `tokens/colors.css` | `var(--osrs-blue-600)` | `--color-status-info-fg` | color |
| `--status-pending-bg` | `tokens/colors.css` | `var(--osrs-amber-50)` | `--color-status-pending-bg` | color |
| `--status-pending-fg` | `tokens/colors.css` | `var(--osrs-amber-700)` | `--color-status-pending-fg` | color |
| `--status-ready-bg` | `tokens/colors.css` | `var(--osrs-green-50)` | `--color-status-ready-bg` | color |
| `--status-ready-fg` | `tokens/colors.css` | `var(--osrs-green-700)` | `--color-status-ready-fg` | color |
| `--status-rejected-bg` | `tokens/colors.css` | `var(--osrs-red-50)` | `--color-status-rejected-bg` | color |
| `--status-rejected-fg` | `tokens/colors.css` | `var(--osrs-red-600)` | `--color-status-rejected-fg` | color |
| `--status-unavailable-bg` | `tokens/colors.css` | `var(--osrs-red-tint)` | `--color-status-unavailable-bg` | color |
| `--status-unavailable-fg` | `tokens/colors.css` | `var(--osrs-red-700)` | `--color-status-unavailable-fg` | color |
| `--surface-bar` | `tokens/colors.css` | `var(--osrs-white)` | `--color-surface-bar` | color |
| `--surface-card` | `tokens/colors.css` | `var(--osrs-white)` | `--color-surface-card` | color |
| `--surface-page` | `tokens/colors.css` | `var(--osrs-canvas)` | `--color-surface-page` | color |
| `--surface-stepper` | `tokens/colors.css` | `var(--osrs-canvas)` | `--color-surface-stepper` | color |
| `--surface-table-header` | `tokens/colors.css` | `var(--osrs-surface-table-header)` | `--color-surface-table-header` | color |
| `--font-display` | `tokens/typography.css` | `"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif` | `--font-display` | font |
| `--font-google` | `tokens/typography.css` | `Roboto,-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif` | `--font-google` | font |
| `--font-noto` | `tokens/typography.css` | `"Noto Sans",-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif` | `--font-noto` | font |
| `--font-sans` | `tokens/typography.css` | `Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif` | `--font-sans` | font |
| `--leading-body` | `tokens/typography.css` | `1.5` | `--leading-body` | font |
| `--leading-display` | `tokens/typography.css` | `1.3` | `--leading-display` | font |
| `--leading-tight` | `tokens/typography.css` | `100%` | `--leading-tight` | font |
| `--text-11` | `tokens/typography.css` | `11px` | `--text-11` | font |
| `--text-11-5` | `tokens/typography.css` | `11.5px` | `--text-11-5` | font |
| `--text-12` | `tokens/typography.css` | `12px` | `--text-12` | font |
| `--text-128` | `tokens/typography.css` | `128px` | `--text-128` | font |
| `--text-13` | `tokens/typography.css` | `13px` | `--text-13` | font |
| `--text-14` | `tokens/typography.css` | `14px` | `--text-14` | font |
| `--text-15` | `tokens/typography.css` | `15px` | `--text-15` | font |
| `--text-16` | `tokens/typography.css` | `16px` | `--text-16` | font |
| `--text-17` | `tokens/typography.css` | `17px` | `--text-17` | font |
| `--text-18` | `tokens/typography.css` | `18px` | `--text-18` | font |
| `--text-19` | `tokens/typography.css` | `19px` | `--text-19` | font |
| `--text-20` | `tokens/typography.css` | `20px` | `--text-20` | font |
| `--text-24` | `tokens/typography.css` | `24px` | `--text-24` | font |
| `--text-28` | `tokens/typography.css` | `28px` | `--text-28` | font |
| `--text-32` | `tokens/typography.css` | `32px` | `--text-32` | font |
| `--text-body` | `tokens/colors.css` | `var(--osrs-ink-700)` | `--color-ink-body` | font |
| `--text-heading` | `tokens/colors.css` | `var(--osrs-black)` | `--color-ink-heading` | font |
| `--text-link` | `tokens/colors.css` | `var(--osrs-red-600)` | `--color-ink-link` | font |
| `--text-muted` | `tokens/colors.css` | `var(--osrs-gray-400)` | `--color-ink-muted` | font |
| `--text-primary` | `tokens/colors.css` | `var(--osrs-black)` | `--color-ink-primary` | font |
| `--text-secondary` | `tokens/colors.css` | `var(--osrs-gray-500)` | `--color-ink-secondary` | font |
| `--text-strong` | `tokens/colors.css` | `var(--osrs-ink-900)` | `--color-ink-strong` | font |
| `--type-body` | `tokens/typography.css` | `var(--weight-regular) var(--text-14)/1.5 var(--font-sans)` | `type-body (utility)` | font |
| `--type-caption` | `tokens/typography.css` | `var(--weight-regular) var(--text-11)/100% var(--font-sans)` | `type-caption (utility)` | font |
| `--type-card-title` | `tokens/typography.css` | `var(--weight-bold) var(--text-17)/100% var(--font-sans)` | `type-card-title (utility)` | font |
| `--type-display-hero` | `tokens/typography.css` | `var(--weight-bold) var(--text-128)/1.3 var(--font-display)` | `type-display-hero (utility)` | font |
| `--type-eyebrow` | `tokens/typography.css` | `var(--weight-bold) var(--text-11)/100% var(--font-sans)` | `type-eyebrow (utility)` | font |
| `--type-meta` | `tokens/typography.css` | `var(--weight-regular) var(--text-12)/100% var(--font-sans)` | `type-meta (utility)` | font |
| `--type-metric` | `tokens/typography.css` | `var(--weight-medium) var(--text-28)/1.3 var(--font-display)` | `type-metric (utility)` | font |
| `--type-page-title` | `tokens/typography.css` | `var(--weight-medium) var(--text-32)/1.3 var(--font-display)` | `type-page-title (utility)` | font |
| `--type-pill` | `tokens/typography.css` | `var(--weight-bold) var(--text-12)/100% var(--font-sans)` | `type-pill (utility)` | font |
| `--type-section-title` | `tokens/typography.css` | `var(--weight-medium) var(--text-19)/1.3 var(--font-display)` | `type-section-title (utility)` | font |
| `--type-subhead` | `tokens/typography.css` | `var(--weight-bold) var(--text-15)/100% var(--font-sans)` | `type-subhead (utility)` | font |
| `--type-ui` | `tokens/typography.css` | `var(--weight-regular) var(--text-13)/100% var(--font-sans)` | `type-ui (utility)` | font |
| `--type-ui-bold` | `tokens/typography.css` | `var(--weight-bold) var(--text-13)/100% var(--font-sans)` | `type-ui-bold (utility)` | font |
| `--weight-bold` | `tokens/typography.css` | `700` | `--font-weight-bold` | font |
| `--weight-extrabold` | `tokens/typography.css` | `800` | `--font-weight-extrabold` | font |
| `--weight-medium` | `tokens/typography.css` | `500` | `--font-weight-medium` | font |
| `--weight-regular` | `tokens/typography.css` | `400` | `--font-weight-regular` | font |
| `--weight-semibold` | `tokens/typography.css` | `600` | `--font-weight-semibold` | font |
| `--motion-base` | `tokens/elevation.css` | `180ms` | `--motion-base (plain var)` | other |
| `--motion-ease` | `tokens/elevation.css` | `cubic-bezier(.2,0,.2,1)` | `--ease-osrs` | other |
| `--motion-fast` | `tokens/elevation.css` | `120ms` | `--motion-fast (plain var)` | other |
| `--radius-10` | `tokens/elevation.css` | `10px` | `--radius-10` | radius |
| `--radius-2` | `tokens/elevation.css` | `2px` | `--radius-2` | radius |
| `--radius-24` | `tokens/elevation.css` | `24px` | `--radius-24` | radius |
| `--radius-32` | `tokens/elevation.css` | `32px` | `--radius-32` | radius |
| `--radius-4` | `tokens/elevation.css` | `4px` | `--radius-4` | radius |
| `--radius-6` | `tokens/elevation.css` | `6px` | `--radius-6` | radius |
| `--radius-8` | `tokens/elevation.css` | `8px` | `--radius-8` | radius |
| `--radius-circle` | `tokens/elevation.css` | `200px` | `--radius-circle` | radius |
| `--radius-pill` | `tokens/elevation.css` | `999px` | `--radius-pill` | radius |
| `--shadow-card` | `tokens/elevation.css` | `0px 5px 18px 0px rgba(23,32,51,0.0706)` | `--shadow-card` | shadow |
| `--control-height-lg` | `tokens/spacing.css` | `46px` | `--spacing-control-height-lg` | spacing |
| `--control-height-md` | `tokens/spacing.css` | `42px` | `--spacing-control-height-md` | spacing |
| `--control-height-sm` | `tokens/spacing.css` | `30px` | `--spacing-control-height-sm` | spacing |
| `--layout-content-width` | `tokens/spacing.css` | `1344px` | `--spacing-layout-content-width` | spacing |
| `--layout-gutter` | `tokens/spacing.css` | `32px` | `--spacing-layout-gutter` | spacing |
| `--layout-page-width` | `tokens/spacing.css` | `1440px` | `--spacing-layout-page-width` | spacing |
| `--layout-topbar-height` | `tokens/spacing.css` | `87px` | `--spacing-layout-topbar-height` | spacing |
| `--row-height-inventory` | `tokens/spacing.css` | `68px` | `--spacing-row-height-inventory` | spacing |
| `--row-height-request` | `tokens/spacing.css` | `78px` | `--spacing-row-height-request` | spacing |
| `--space-1` | `tokens/spacing.css` | `1px` | `--spacing-1` | spacing |
| `--space-10` | `tokens/spacing.css` | `10px` | `--spacing-10` | spacing |
| `--space-12` | `tokens/spacing.css` | `12px` | `--spacing-12` | spacing |
| `--space-14` | `tokens/spacing.css` | `14px` | `--spacing-14` | spacing |
| `--space-16` | `tokens/spacing.css` | `16px` | `--spacing-16` | spacing |
| `--space-18` | `tokens/spacing.css` | `18px` | `--spacing-18` | spacing |
| `--space-2` | `tokens/spacing.css` | `2px` | `--spacing-2` | spacing |
| `--space-20` | `tokens/spacing.css` | `20px` | `--spacing-20` | spacing |
| `--space-22` | `tokens/spacing.css` | `22px` | `--spacing-22` | spacing |
| `--space-24` | `tokens/spacing.css` | `24px` | `--spacing-24` | spacing |
| `--space-28` | `tokens/spacing.css` | `28px` | `--spacing-28` | spacing |
| `--space-32` | `tokens/spacing.css` | `32px` | `--spacing-32` | spacing |
| `--space-4` | `tokens/spacing.css` | `4px` | `--spacing-4` | spacing |
| `--space-5` | `tokens/spacing.css` | `5px` | `--spacing-5` | spacing |
| `--space-6` | `tokens/spacing.css` | `6px` | `--spacing-6` | spacing |
| `--space-7` | `tokens/spacing.css` | `7px` | `--spacing-7` | spacing |
| `--space-8` | `tokens/spacing.css` | `8px` | `--spacing-8` | spacing |
| `--space-9` | `tokens/spacing.css` | `9px` | `--spacing-9` | spacing |
