/** FR-018: shown while session status is `unknown`.
 *
 *  Not an ad-hoc spinner (Story 7 AC3). Three brand dots on the page surface,
 *  sized from the spacing scale and coloured with the one accent the system
 *  has, fading with Tailwind's pulse. Motion is suppressed for anyone who asks
 *  for reduced motion, and the label — not the dots — is what a screen reader
 *  announces. */
export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-16 py-32" role="status">
      <span className="flex items-center gap-8" aria-hidden="true">
        <span className="h-8 w-8 animate-pulse rounded-circle bg-brand-primary motion-reduce:animate-none" />
        <span className="h-8 w-8 animate-pulse rounded-circle bg-brand-primary motion-reduce:animate-none" />
        <span className="h-8 w-8 animate-pulse rounded-circle bg-brand-primary motion-reduce:animate-none" />
      </span>
      <span className="type-body text-ink-secondary">{label}</span>
    </div>
  );
}
