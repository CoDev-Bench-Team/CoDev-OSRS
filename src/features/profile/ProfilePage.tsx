import { useLocation } from 'react-router';
import { PageHeader } from '../../shared/ui';
import { useSession } from '../auth/session-context';
import { AssignedSection } from './AssignedSection';
import { IdentityBlock } from './IdentityBlock';

/** `/profile` — the signed-in user's own details (spec 006).
 *
 *  One page for every role. The design draws only the Employee's; reusing it
 *  unchanged for Approver and Supply Admin is our invention (D2), so nothing
 *  here branches on role. Read-only: no inputs or edit controls (FR-013). */
export function ProfilePage() {
  const { session } = useSession();
  const { search } = useLocation();
  // The route guard renders this only for a signed-in session.
  if (!session) return null;

  return (
    // The section's wrapper carries the 48px gap and hides itself when empty,
    // so state (c) leaves no gap behind.
    <div className="flex w-full min-w-0 flex-col py-32">
      <div className="flex flex-col gap-24">
        <PageHeader title="Profile" subtitle="Your details and currently assigned supplies" />
        <IdentityBlock user={session.user} />
      </div>
      <div className="mt-[48px] empty:hidden">
        {/* Keyed by user and query: a different person, or a different dev stub
            mode, always starts from a fresh load and never shows the previous
            rows (FR-006). */}
        <AssignedSection key={`${session.user.id}|${search}`} search={search} />
      </div>
    </div>
  );
}
