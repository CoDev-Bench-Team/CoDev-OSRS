/** Flat colour with white initials — never a photograph. 34px in the top bar,
 *  56px on the profile screen, where the initials go to 20px.
 *
 *  The initials are bold at both sizes: the UI kit's own `Avatar` frame set 400
 *  below 40px, but the `Top Navigation` component (figma 88:22829) draws them
 *  bold, and that component is the one every signed-in screen renders. */
export function Avatar({
  initials,
  color = 'var(--color-osrs-avatar-orange)',
  size = 34,
  className,
}: {
  initials: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  const large = size > 40;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-circle text-white ${className ?? ''}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden="true"
    >
      <span className={`font-sans font-bold leading-body ${large ? 'text-20' : 'text-14'}`}>{initials}</span>
    </span>
  );
}
