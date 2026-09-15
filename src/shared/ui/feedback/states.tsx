import type { ReactNode } from 'react';
import { PageHeader } from '../layout/headings';

/** The four states the design file does not draw (spec 003 FR-011, FR-012,
 *  FR-018, FR-020). Every one of them is an addition, logged in
 *  docs/design-system/additions.md: the source has no loading, empty, error,
 *  not-found or forbidden frame anywhere.
 *
 *  They introduce no colour, type size, radius or shadow of their own — that
 *  is spec 003 SC-008, and with Tailwind's namespaces cleared it is a build
 *  guarantee rather than a promise. Navigation is a prop, not an import: this
 *  layer stays ignorant of the router.
 *
 *  `action` carries the route back that FR-011 requires. */

/** Shown while session status is still `unknown`. Deliberately plain: the
 *  foundation has no spinner, and inventing one here would be a new visual
 *  vocabulary for a state the designer has not seen. */
export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-32" role="status" aria-live="polite">
      <span className="type-body text-ink-secondary">{label}</span>
    </div>
  );
}

/** A destination whose own feature has not shipped (FR-020). It must not read
 *  as a not-found, an error, or an empty result — hence the explicit sentence
 *  about the feature rather than a bare "nothing here". */
export function Placeholder({ name, note }: { name: string; note?: string }) {
  return (
    <section className="flex flex-col gap-16">
      <PageHeader title={name} subtitle="This screen has not shipped yet" />
      <p className="type-body max-w-[629px] text-ink-body">
        {note ?? `${name} is part of the Office Supplies Request System, and its own feature has not been built yet.`}{' '}
        The address is real, so a link to it keeps working once the screen lands.
      </p>
    </section>
  );
}

/** An address that matches no destination (FR-012). Distinguishable from a
 *  refusal on purpose, so a mistyped address stays diagnosable. */
export function NotFoundScreen({ action }: { action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-16">
      <PageHeader title="Page not found" subtitle="That address does not match any screen in Supply Requests" />
      <p className="type-body max-w-[629px] text-ink-body">Check the address for a typo, or head back to your work.</p>
      {action}
    </section>
  );
}

/** A destination the signed-in role may not reach (FR-011). Each role has its
 *  own screens; this says so plainly and offers the way back. */
export function ForbiddenScreen({ action }: { action?: ReactNode }) {
  return (
    <section className="flex flex-col gap-16">
      <PageHeader title="You cannot open that screen" subtitle="Each role in Supply Requests has its own screens" />
      <p className="type-body max-w-[629px] text-ink-body">
        Your role does not include this one. If you need it, ask an administrator to change your role — a person holds
        exactly one.
      </p>
      {action}
    </section>
  );
}
