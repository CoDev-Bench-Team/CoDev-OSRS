import type { CSSProperties } from 'react';

/** The one column-sizing rule for OSRS tables. `TableHead` and the row cells
 *  beneath it both call this, so a header and its column cannot be sized by
 *  two hand-copied expressions that drift apart.
 *
 *  A fixed column keeps its width and never shrinks. The fluid column takes
 *  the remaining space and may shrink below its content so `truncate` can take
 *  effect on long cells. Lives apart from `cards.tsx` because a component file
 *  that also exports a helper loses Fast Refresh. */
export function tableColumnStyle(width?: string): CSSProperties {
  return width ? { width, flexShrink: 0 } : { flex: 1, minWidth: 0 };
}
