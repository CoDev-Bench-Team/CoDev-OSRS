import { Avatar } from '../../shared/ui';
import type { User } from '../auth/types';
import { identityLine } from './format';

/** Who the signed-in person is, entirely from the session (FR-004, FR-005).
 *
 *  The avatar is initials on a flat colour and nothing else. No photograph is
 *  passed even if the session or `Avatar` later carries one (FR-003).
 *
 *  Sizes follow the rendered `05 - Profile` frame, not the UI kit's JSX, whose
 *  cached 13px / 11px values drift §9 records as wrong. */
export function IdentityBlock({ user }: { user: User }) {
  return (
    <div className="flex items-center gap-8">
      <Avatar initials={user.initials} color={user.avatarColor} size={56} />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="break-words font-sans text-24 font-medium leading-body text-ink-primary">{user.name}</p>
        <p className="break-words type-body text-ink-secondary">{identityLine(user.email, user.office)}</p>
      </div>
    </div>
  );
}
