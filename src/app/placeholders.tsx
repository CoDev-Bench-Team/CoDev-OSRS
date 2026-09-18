import { useParams } from 'react-router';
import { Button, Placeholder, RecordUnavailableScreen } from '../shared/ui';
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

export function CatalogPlaceholder() {
  const { session } = useSession();
  const { title, purpose } = DESTINATIONS.catalog;
  // Story 2 AC5: every role sees stock, but only an Employee is offered the
  // action that starts a request. The action is disabled because starting a
  // request is spec 001's own feature — the shell shows who is offered it, not
  // what it does.
  const employee = session?.role === 'employee';
  return (
    <Placeholder
      name={title}
      purpose={purpose}
      action={
        employee ? (
          <>
            <Button disabled>Add to Request List</Button>
            <span className="type-body text-ink-secondary">Requesting ships with the catalog feature</span>
          </>
        ) : undefined
      }
    />
  );
}

export const RequestsPlaceholder = () => screen('requests');
export const ApprovalsPlaceholder = () => screen('approvals');
export const FulfillmentPlaceholder = () => screen('fulfillment');
export const InventoryPlaceholder = () => screen('inventory');
export const HistoryPlaceholder = () => screen('history');
export const ProfilePlaceholder = () => screen('profile');

/** `/requests/:id` — the one address that identifies a record.
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
