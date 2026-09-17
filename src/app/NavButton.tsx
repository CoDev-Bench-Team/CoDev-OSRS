import { useNavigate } from 'react-router';
import { Button, type ButtonVariant } from '../shared/ui';

/** The design system's Button, wired to a destination.
 *
 *  Every notice in the shell owes the user a route back (FR-011, FR-012,
 *  FR-019), and the route back has to look like every other action in the
 *  product. Rather than restyle a link, the drawn button navigates. */
export function NavButton({
  to,
  children,
  variant = 'primary',
  replace = false,
}: {
  to: string;
  children: string;
  variant?: ButtonVariant;
  replace?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <Button variant={variant} onClick={() => void navigate(to, { replace })}>
      {children}
    </Button>
  );
}
