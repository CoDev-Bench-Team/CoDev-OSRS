import { apiRequest } from './client';

/** `GET /users`, Admin only: the Inventory assignee picker and nothing else.
 *  The list is held in memory for that action and never written to browser
 *  storage (BEN-157 FR-023). No user create, update or delete is defined
 *  here. Added by BEN-162. */
export function listUsers(): Promise<unknown> {
  return apiRequest('/users');
}
