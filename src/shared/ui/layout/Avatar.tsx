/** Flat colour with white initials — never a photograph. 34px in the top bar,
 *  56px on the profile screen, where the initials go to 700 weight at 20px. */
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
      <span className={`font-sans leading-body ${large ? 'text-20 font-bold' : 'text-14'}`}>{initials}</span>
    </span>
  );
}
