import { useState } from 'react';

/** The signed-in person's photograph when there is one, otherwise flat colour
 *  with white initials. 34px in the top bar, 56px on the profile screen, where
 *  the initials go to 700 weight at 20px.
 *
 *  The design file draws initials only, and spec 003 Story 5 AC4 originally
 *  said "never a photograph". Amended 2026-09-22: BEN-96 requires the avatar
 *  URL the backend returns from Google to be used, so a photograph is shown when
 *  the contract supplies one. Initials remain the design's own rendering and
 *  the fallback for every case where the photograph cannot be shown — no URL,
 *  or one that fails to load. Logged in docs/design-system/additions.md.
 *
 *  `referrerPolicy="no-referrer"` is not decoration. Google's profile-image host
 *  refuses a noticeable share of hotlinked requests that carry a Referer, and a
 *  refusal would otherwise show as a broken-image icon where a face should be.
 *
 *  Decorative in both forms: the name is always rendered beside it, so the
 *  image carries empty alt text and the whole avatar stays `aria-hidden`. */
export function Avatar({
  initials,
  color = 'var(--color-osrs-avatar-orange)',
  src,
  size = 34,
  className,
}: {
  initials: string;
  color?: string;
  /** A photograph URL. Omitted, or failing to load, renders the initials. */
  src?: string;
  size?: number;
  className?: string;
}) {
  // Keyed by URL rather than a boolean, so a new URL after a failed one gets
  // its own attempt instead of inheriting the old failure.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPhoto = Boolean(src) && failedSrc !== src;
  const large = size > 40;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-circle text-white ${className ?? ''}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          referrerPolicy="no-referrer"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        <span className={`font-sans leading-body ${large ? 'text-20 font-bold' : 'text-14'}`}>{initials}</span>
      )}
    </span>
  );
}
