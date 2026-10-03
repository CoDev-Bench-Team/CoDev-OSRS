import type { CSSProperties, ReactNode } from 'react';
import { tableColumnStyle, TABLE_ROW_PADDING_CLASS, type ColumnWidth } from '../data-display/table-columns';

/** Skeleton placeholders: the shape of what is loading, drawn in the neutral
 *  fill and pulsing, in place of a spinner. Not drawn in
 *  the design file; recorded in docs/design-system/additions.md.
 *
 *  Every block is `aria-hidden`. A region that is loading wraps its blocks in
 *  `SkeletonRegion`, which carries the one thing a screen reader is told. */

const BLOCK = 'block shrink-0 animate-pulse bg-osrs-neutral-200 motion-reduce:animate-none';

/** One grey block. Size and radius come from `className`; `rounded-4` unless
 *  it says otherwise. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  const rounded = className && /\brounded-/.test(className) ? '' : 'rounded-4';
  return <span aria-hidden="true" className={`${BLOCK} ${rounded} ${className ?? ''}`} style={style} />;
}

/** A loading region: `role="status"` with its label for assistive tech, the
 *  skeleton for everyone else. */
export function SkeletonRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** What a table cell holds, so its placeholder takes that element's height
 *  and shape. Text lines are their type style's height (every table style is
 *  set at line-height 100%), so a skeleton row is exactly as tall as the row
 *  it stands for:
 *
 *  - `id`: a request id, `type-ui-bold` (13px)
 *  - `bold`: a name, `type-ui-bold` (13px)
 *  - `text`: a `type-ui` value (13px)
 *  - `number`: a short count, `type-ui` (13px)
 *  - `date`: a formatted date, `type-ui` (13px)
 *  - `stack`: a `type-ui` name over a `type-meta` line (13 + 4 + 12px)
 *  - `caption`: an 11px label (`Unassigned`)
 *  - `request-pill`: a request `StatusPill`, 32px, pill radius
 *  - `unit-pill`: a unit `StatusPill`, 32px, r8
 *  - `office`: the `Site Office Label`, 32px, r8
 *  - `button`: a table `Button`, 42px, r10
 *  - `link`: the 12px `View details` action */
export type SkeletonCell =
  | 'id'
  | 'bold'
  | 'text'
  | 'number'
  | 'date'
  | 'stack'
  | 'caption'
  | 'request-pill'
  | 'unit-pill'
  | 'office'
  | 'button'
  | 'link';

const CELL: Record<SkeletonCell, ReactNode> = {
  id: <Skeleton className="h-[13px] w-[104px]" />,
  bold: <Skeleton className="h-[13px] w-3/5 max-w-[180px]" />,
  text: <Skeleton className="h-[13px] w-3/5 max-w-[160px]" />,
  number: <Skeleton className="h-[13px] w-[24px]" />,
  date: <Skeleton className="h-[13px] w-[84px]" />,
  stack: (
    <span className="flex w-full flex-col gap-4">
      <Skeleton className="h-[13px] w-3/5 max-w-[120px]" />
      <Skeleton className="h-[12px] w-4/5 max-w-[150px]" />
    </span>
  ),
  caption: <Skeleton className="h-[11px] w-[64px]" />,
  'request-pill': <Skeleton className="h-32 w-[112px] rounded-pill" />,
  'unit-pill': <Skeleton className="h-32 w-[76px] rounded-8" />,
  office: <Skeleton className="h-32 w-[64px] rounded-8" />,
  button: <Skeleton className="h-control-height-md w-[82px] rounded-10" />,
  link: <Skeleton className="h-12 w-[88px]" />,
};

/** Rows of a table while it loads, cell for cell under the table's own
 *  headings: same widths, same gutter, same row height. */
export function SkeletonRows({
  columns,
  rows = 5,
  rowClassName,
}: {
  columns: readonly (readonly [width: ColumnWidth | undefined, cell: SkeletonCell])[];
  rows?: number;
  /** The real row's height and border classes. */
  rowClassName: string;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} aria-hidden="true" className={`flex w-full items-center ${TABLE_ROW_PADDING_CLASS} ${rowClassName}`}>
          {columns.map(([width, cell], i) => (
            <span key={i} className="flex items-center pr-16" style={tableColumnStyle(width)}>
              {CELL[cell]}
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

/** `SupplyCard`'s silhouette: the 180px image, category, name and pill,
 *  the specs link, then the stepper and action. */
export function SupplyCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full max-w-[436px] flex-col items-start overflow-hidden rounded-10 bg-surface-card shadow-card"
    >
      <Skeleton className="h-[180px] w-full rounded-none" />
      <div className="flex w-full flex-col items-start gap-12 p-18">
        <Skeleton className="h-10 w-[72px]" />
        <div className="flex w-full items-center gap-12">
          <Skeleton className="h-20 w-1/2" />
          <Skeleton className="h-32 w-[88px] rounded-pill" />
        </div>
        <Skeleton className="h-12 w-[84px]" />
        <div className="flex w-full items-center justify-between gap-12">
          <Skeleton className="h-[26px] w-[96px]" />
          <Skeleton className="h-control-height-md w-[180px] rounded-10" />
        </div>
      </div>
    </div>
  );
}

/** A form field: its label over the 46px control. */
export function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div aria-hidden="true" className="flex w-full flex-col gap-8">
      <Skeleton className="h-12 w-[96px]" />
      <Skeleton className={`w-full rounded-10 ${tall ? 'h-[96px]' : 'h-[46px]'}`} />
    </div>
  );
}
