import type { CSSProperties } from 'react';

/** A column width in pixels. Callers that only set CSS `width` would accept any
 *  length, but a caller that also has to *add the columns up* cannot: parsing
 *  `12rem` yields 12 and silently produces a wrong total. Narrowing the unit
 *  here makes that a compile error instead of a wrong number.
 *
 *  The type cannot express "positive integer", so `tableMinWidth` checks that
 *  at the one place where the value is arithmetic rather than CSS. */
export type ColumnWidth = `${number}px`;

/** The horizontal gutter shared by every OSRS table header and row, as the
 *  Tailwind class that renders it and as the total it adds to a row's width.
 *  The number is parsed back out of the class, so a change to the gutter cannot
 *  update the padding and leave a width calculation behind.
 *
 *  The annotation is what keeps that parse total. `px-touch-target` is a real
 *  utility in this system, and as a bare literal it would compile, render 44px
 *  and hand `NaN` to the width calculation — which React drops silently, taking
 *  the table's minimum width with it. Typed, it is a compile error. */
export const TABLE_ROW_PADDING_CLASS: `px-${number}` = 'px-20';

const rowPadding = Number.parseInt(TABLE_ROW_PADDING_CLASS.slice('px-'.length), 10);
if (!Number.isFinite(rowPadding) || rowPadding < 0) {
  throw new Error(`TABLE_ROW_PADDING_CLASS must be px-<non-negative number>; got "${TABLE_ROW_PADDING_CLASS}"`);
}

export const TABLE_ROW_PADDING_X = rowPadding * 2;

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

/** The width below which a table scrolls instead of compressing: every fixed
 *  column at full width, the shared row gutter, and a floor for the fluid
 *  column. Derived from the column set so widening a column widens the table
 *  rather than silently squeezing the fluid one.
 *
 *  The guard covers what `ColumnWidth` cannot say — the template literal admits
 *  `-5px` and `1e3px`. A bad width here would quietly shrink the minimum, so it
 *  throws rather than laying out wrongly. */
export function tableMinWidth(columns: readonly (ColumnWidth | undefined)[], fluidFloor: number): number {
  const fixed = columns.reduce<number>((total, width) => {
    if (!width) return total;
    const px = Number.parseInt(width, 10);
    if (!Number.isFinite(px) || px < 0) {
      throw new Error(`Table column width must be a non-negative pixel length; got "${width}"`);
    }
    return total + px;
  }, 0);

  if (!Number.isFinite(fluidFloor) || fluidFloor < 0) {
    throw new Error(`Table fluid-column floor must be a non-negative number; got ${fluidFloor}`);
  }

  return fixed + TABLE_ROW_PADDING_X + fluidFloor;
}
