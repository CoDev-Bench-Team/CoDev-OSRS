import { useNavigate } from 'react-router';
import { Button } from '../../shared/ui';

/** The route back that a refusal and a not-found both have to offer
 *  (spec 003 FR-011, FR-012). Button voice: an imperative naming the object,
 *  never "OK" or "Go back". */
export function BackToWork({ to, label = 'Open My Screens' }: { to: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <Button variant="ghost" className="w-fit" onClick={() => void navigate(to, { replace: true })}>
      {label}
    </Button>
  );
}
