import { isRecord, listUsers, optStr, readId, readStr } from '../../shared/api';
import type { DirectoryUser, UserDirectory } from './user-directory';

/** Assignees from `GET /users` (spec 017 FR-048). The list is returned to the
 *  panel that asked and kept in its state only; nothing here caches it or
 *  writes it to browser storage. Users carry no department (G6). */
export const apiUserDirectory: UserDirectory = {
  async list(): Promise<DirectoryUser[]> {
    const body = await listUsers();
    const rows = Array.isArray(body) ? body : isRecord(body) && Array.isArray(body.data) ? body.data : null;
    if (!rows) throw new Error('users: not a list');
    return rows.map((row) => {
      if (!isRecord(row)) throw new Error('user: not an object');
      const name = [optStr(row, 'firstName'), optStr(row, 'lastName')].filter(Boolean).join(' ');
      const email = readStr(row, 'email', 'user');
      return { id: readId(row, 'id', 'user'), name: name || email, email };
    });
  },
};
