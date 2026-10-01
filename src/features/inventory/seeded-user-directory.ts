import type { DirectoryUser, UserDirectory } from './user-directory';

/** Seeded users — non-production placeholders under constitution IX, listed in
 *  `specs/001-office-supplies-mvp/quickstart.md`. The two sign-in users keep
 *  their sign-in ids; the rest exist only to be assigned units. */
export const SEEDED_USERS: readonly DirectoryUser[] = [
  { id: 'maya.santos', name: 'Maya Santos', email: 'mayas@codev.com', department: 'Engineering' },
  { id: 'ethan.cruz', name: 'Ethan Cruz', email: 'ethanc@codev.com', department: 'IT Operations' },
  { id: 'samantha.reyes', name: 'Samantha Reyes', email: 'samanthar@codev.com', department: 'Design' },
  { id: 'paolo.garcia', name: 'Paolo Garcia', email: 'paolog@codev.com', department: 'Engineering' },
  { id: 'lea.villanueva', name: 'Lea Villanueva', email: 'leav@codev.com', department: 'Finance' },
  { id: 'marco.dizon', name: 'Marco Dizon', email: 'marcod@codev.com', department: 'Quality Assurance' },
  { id: 'nina.bautista', name: 'Nina Bautista', email: 'ninab@codev.com', department: 'People Operations' },
  { id: 'carlo.mendoza', name: 'Carlo Mendoza', email: 'carlom@codev.com' },
];

export const seededUserDirectory: UserDirectory = {
  list: () => new Promise((resolve) => setTimeout(() => resolve(SEEDED_USERS.map((u) => ({ ...u }))), 150)),
};
