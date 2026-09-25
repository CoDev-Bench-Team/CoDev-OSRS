import { useParams } from 'react-router';
import { Placeholder, RecordUnavailableScreen } from '../shared/ui';
import { useSession } from '../features/auth/session-context';
import { DESTINATIONS, landingPath, type DestinationId } from './destinations';
import { mayViewRequest } from './seeded-request-ids';
import { NavButton } from './NavButton';

/** Every product destination ships as a named placeholder (FR-020).
 *
 *  This feature delivers the frame and the empty rooms: the address, the
 *  chrome, the navigation and the guard are real; the contents belong to the
 *  destination's own feature. A page PR later swaps one line here for the real
 *  screen. */
function screen(id: DestinationId) {
  const { title, purpose } = DESTINATIONS[id];
  return <Placeholder name={title} purpose={purpose} />;
}

export const HistoryPlaceholder = () => screen('history');

/** `/requests/:id` — the one address that identifies a record, for the Admin
 *  only. An Employee's request detail is a panel on My Requests (spec 003,
 *  2026-09-23), and BEN-47 replaces this address with the Admin's own panel.
 *
 *  It must not reveal whether that record exists (FR-012a), so a request the
 *  signed-in Employee does not own and a request that does not exist render the
 *  same screen, with the same words, and never echo the identifier back. An
 *  unmatched PATH still produces a distinguishable not-found (FR-012), because
 *  a mistyped address has to stay diagnosable. */
export function RequestDetailPlaceholder() {
  const { id = '' } = useParams();
  const { session } = useSession();
  const { title, purpose } = DESTINATIONS.requestDetail;

  if (!session || !mayViewRequest(session.user, id)) {
    return (
      <RecordUnavailableScreen
        action={<NavButton to={session ? landingPath(session.role) : '/'}>Go Back</NavButton>}
      />
    );
  }

  return <Placeholder name={title} purpose={purpose} />;
}
