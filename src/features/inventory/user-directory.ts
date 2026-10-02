import { seededUserDirectory } from './seeded-user-directory';

/** Who a unit can be assigned to: every user, Employee or Admin, at any office
 *  (spec 015 FR-008, plan P16).
 *
 *  A contract-backed directory reads the published `GET /users`, which
 *  carries no department, so `department` stays unset there (contracts
 *  conflict 11, G6). */
export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  department?: string;
};

export interface UserDirectory {
  list(): Promise<DirectoryUser[]>;
}

/** Which directory the panels read: the seeded one until `GET /users` is
 *  wired, which replaces this one line (plan P2, P16). */
export function userDirectory(): UserDirectory {
  return seededUserDirectory;
}
