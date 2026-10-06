import { createContext, use } from 'react';

/** The count on the Employee's request-list marker (FR-015, Story 5 AC3).
 *
 *  The shell owns no request model. The count lives in context, defaults to 0,
 *  and the badge re-renders when it changes — no reload. Its one writer is the
 *  Request List (spec 011's `RequestListProvider`, FR-005, D2), so the badge
 *  and the list cannot disagree. */
export type RequestListCount = {
  count: number;
  setCount: (count: number) => void;
};

export const RequestListCountContext = createContext<RequestListCount>({
  count: 0,
  setCount: () => {},
});

export function useRequestListCount(): RequestListCount {
  return use(RequestListCountContext);
}
