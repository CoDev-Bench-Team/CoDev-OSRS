import type { ReactNode } from 'react';
import { Notice } from './Notice';

/** FR-011: a destination the signed-in role may not reach.
 *
 *  An explanation and a route back — never a blank page and never a silent
 *  redirect. The user is told which role they hold, because the fix for a
 *  wrong-role screen is to sign in as the right one (D5: there is no switcher).
 *
 *  This is a user-experience boundary, not a security one. The API enforces the
 *  same matrix independently; see plan 003 §Guards. */
export function ForbiddenScreen({ roleLabel, action }: { roleLabel: string; action?: ReactNode }) {
  return (
    <Notice
      eyebrow="No access"
      tone="stopped"
      title="This screen belongs to another role"
      body={`You are signed in as ${roleLabel}. To use a screen for a different role, sign out and sign in with that account.`}
      actions={action}
    />
  );
}
