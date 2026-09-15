import { createContext, use } from 'react';

/** The count on the Employee's request-list marker (FR-015, Story 5 AC3).
 *
 *  The request list itself is spec 001's T010 and has not shipped, so the shell
 *  must NOT invent one. What it can do is wire the badge to a value that any
 *  later feature can set: the count lives in context, defaults to 0, and the
 *  badge re-renders when it changes — no reload, and no request model in the
 *  shell. */
export type RequestListCount = {
  count: number;
  setCount: (count: number) => void;
  /** The notification marker's count, on the same terms: no notification
   *  feature exists yet, so the badge is wired and defaults to none. */
  notificationCount: number;
  setNotificationCount: (count: number) => void;
};

export const RequestListCountContext = createContext<RequestListCount>({
  count: 0,
  setCount: () => {},
  notificationCount: 0,
  setNotificationCount: () => {},
});

export function useRequestListCount(): RequestListCount {
  return use(RequestListCountContext);
}
