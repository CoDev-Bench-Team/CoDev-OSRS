/** The button's classes, apart from the component, so a router link that must
 *  *look* like a button reuses them rather than restating them: a hand-copied
 *  class list drifts the moment a token, radius or height changes.
 *
 *  Reach for `<Button>` itself whenever the control is a button. Use these only
 *  when the element must be an `<a>` so copy-link and middle-click keep
 *  working. They live in their own module because a component file that also
 *  exports constants loses Fast Refresh. */
export type ButtonVariant = 'primary' | 'accent' | 'ghost';

export const BUTTON_SHAPE =
  'inline-flex h-control-height-md min-w-touch-target cursor-pointer items-center justify-center rounded-10 border-none px-18 type-ui-bold whitespace-nowrap transition-osrs';

/** `primary` carries a same-colour ring so it keeps its silhouette on white —
 *  the one place the design system allows a shadow-bearing shape and a ring on
 *  the same element. `accent` is not a mistake: the source uses a second red
 *  (`--osrs-red-500`) on "+ Add Catalog Item" and the catalog card's add
 *  button. Both reds are deliberate and both are tokenised. */
export const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-brand-primary ring-brand text-brand-on-primary hover:bg-osrs-red-550',
  accent: 'bg-brand-primary-alt text-brand-on-primary hover:bg-osrs-red-550',
  ghost: 'bg-surface-card ring-default text-ink-strong hover:text-ink-secondary',
};
