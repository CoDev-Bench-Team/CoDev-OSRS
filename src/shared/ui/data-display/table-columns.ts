import type { CSSProperties } from 'react';

/** A column width in pixels. Callers that only set CSS `width` would accept any
 *  length, but a caller that also has to *add the columns up* cannot: parsing
 *  `12rem` yields 12 and silently produces a wrong total. Narrowing the unit
 *  here makes that a compile error instead of a wrong number. */
export type ColumnWidth = `${number}px`;

/** The horizontal gutter shared by every OSRS table header and row, as the
 *  Tailwind class that renders it and as the total it adds to a row's width.
 *  The number is parsed back out of the class, so a change to the gutter cannot
 *  update the padding and leave a width calculation behind. */
export const TABLE_ROW_PADDING_CLASS = 'px-20';
export const TABLE_ROW_PADDING_X = Number.parseInt(TABLE_ROW_PADDING_CLASS.slice('px-'.length), 10) * 2;

/** The one column-sizing rule for OSRS tables. `TableHead` and the row cells
 *  beneath it both call this, so a header and its column cannot be sized by
 *  two hand-copied expressions that drift apart.
 *
 *  A fixed column keeps its width and never shrinks. The fluid column takes
 *  the remaining space and may shrink below its content so `truncate` can take
 *  effect on long cells. Lives apart from `cards.tsx` because a component file
 *  that also exports a helper loses Fast Refresh. */
export function tableColumnStyle(width?: ColumnWidth): CSSProperties {
  return width ? { width, flexShrink: 0 } : { flex: 1, minWidth: 0 };
}
