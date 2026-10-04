import type { Role, Session } from './types';

/** TEMPORARY, development only. Lets a developer whose Google account the API
 *  signs in as one role view the SPA as the other. Google sign-in is still real;
 *  only the role the shell routes and renders by is replaced.
 *
 *  The API still authorizes by its own role (ADMIN_EMAILS on the backend), so a
 *  write that role may not make is refused — e.g. an Admin account viewing as an
 *  Employee cannot sign the Accountability Form, and My Requests lists every
 *  requestor's requests. Absent from production builds. Remove once a
 *  non-admin company account is available for development. */
export const DEV_ROLE_OVERRIDE_ENABLED = import.meta.env.DEV;

const KEY = 'osrs.dev-role-override';

export function devRoleOverride(): Role | null {
  if (!DEV_ROLE_OVERRIDE_ENABLED) return null;
  try {
    const value = sessionStorage.getItem(KEY);
    return value === 'employee' || value === 'admin' ? value : null;
  } catch {
    return null;
  }
}

export function setDevRoleOverride(role: Role | null): void {
  if (!DEV_ROLE_OVERRIDE_ENABLED) return;
  try {
    if (role) sessionStorage.setItem(KEY, role);
    else sessionStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the API's role stands.
  }
}

export function withDevRoleOverride(session: Session | null): Session | null {
  const role = devRoleOverride();
  if (!session || !role || role === session.role) return session;
  return { role, user: { ...session.user, role } };
}
