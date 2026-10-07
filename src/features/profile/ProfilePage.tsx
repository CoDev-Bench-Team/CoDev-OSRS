import { PageHeader, Skeleton, SkeletonRegion } from '../../shared/ui';
import { DESTINATIONS } from '../../app/destinations';
import { useSession } from '../auth/session-context';
import { AssignedSection } from './AssignedSection';
import { IdentityBlock } from './IdentityBlock';

/** `/profile` — the signed-in user's own details (spec 006).
 *
 *  One page for every role. The design draws only the Employee's; reusing it
 *  unchanged for the Admin is our invention (D2), so nothing here branches on
 *  role. Read-only: no inputs or edit controls (FR-013). */
export function ProfilePage() {
  const { session } = useSession();
  // The route guard renders this for a signed-in session, or while the
  // session resolves, when who is signed in is drawn as skeletons.
  const user = session?.user;

  return (
    // The section's wrapper carries the 48px gap and hides itself when empty,
    // so state (c) leaves no gap behind.
    <div className="flex w-full min-w-0 flex-col py-32">
      <div className="flex flex-col gap-24">
        <PageHeader title={DESTINATIONS.profile.title} subtitle={DESTINATIONS.profile.purpose} />
        {user ? (
          <IdentityBlock user={user} />
        ) : (
          // `IdentityBlock`'s 56px avatar beside the name over the email line.
          <SkeletonRegion label="Loading your details" className="flex items-center gap-8">
            <Skeleton className="size-[56px] rounded-circle" />
            <span aria-hidden="true" className="flex flex-col gap-8">
              <Skeleton className="h-24 w-[200px]" />
              <Skeleton className="h-14 w-[260px]" />
            </span>
          </SkeletonRegion>
        )}
      </div>
      <div className="mt-[48px] empty:hidden">
        {/* Keyed by user: a different person always starts from a fresh load
            and never shows the previous rows (FR-006). */}
        <AssignedSection key={user?.id ?? ''} userId={user?.id ?? null} />
      </div>
    </div>
  );
}
