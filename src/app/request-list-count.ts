import { createContext, use } from 'react';

/** The count on the Employee's request-list marker (FR-015, Story 5 AC3).
 *
 *  The shell owns no request model. The count lives in context, defaults to 0,
 *  and the badge re-renders when it changes — no reload. Its one writer is the
 *  Request List (spec 008's `RequestListProvider`, FR-005, D2), so the badge
 *  and the list cannot disagree. */
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
