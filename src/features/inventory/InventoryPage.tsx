import { useMemo, useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Button, PageHeader, Search, Select, StatusPill, TableCard } from '../../shared/ui';
import type { StockStatus } from '../../shared/ui';
import { ALL_CATEGORIES, CATEGORIES, INVENTORY_ITEMS, PAGINATION, STOCK_FILTERS } from './inventory-data';
import { Pagination } from './Pagination';

/** Inventory management — figma `03 - Inventory` (113:27060).
 *
 *  This is the Supply Admin's screen: the only role that may encode or edit
 *  stock (`ARCHITECT.md` §7). The drawn frame carries a title block with the
 *  accent "+ Add Catalog Item" button opposite it, a search field beside a
 *  category filter, four stock chips, the six-column table, and the pager.
 *
 *  Column widths are the drawn ones (300 / 180 / 140 / 170 / 190 / fill / 92
 *  inside 20px padding), which is why the table scrolls sideways inside its own
 *  card below about 1100px rather than reflowing: `DESIGN.md` §9 puts designed
 *  geometry ahead of an invented small-screen table.
 *
 *  The chips and the pager show the counts the frame states (238 items, 7 / 7 /
 *  7, "1-50 of 1,250") while the table shows the six rows it draws. That
 *  mismatch is the frame's own — it draws six rows over a footer describing a
 *  catalog of 1,250 — and reproducing it is more honest than inventing numbers
 *  the designer did not write. The real figures arrive with the API.
 */
const COLUMNS: { label: string; width: string; align?: string }[] = [
  { label: 'ITEM NAME', width: 'w-[300px]' },
  { label: 'CATEGORY', width: 'w-[180px]' },
  { label: 'TOTAL STOCK', width: 'w-[140px]' },
  { label: 'AVAILABLE QUANTITY', width: 'w-[170px]' },
  { label: 'RESERVED / PENDING', width: 'w-[190px]' },
  { label: 'STATUS', width: 'flex-1' },
  { label: 'ACTION', width: 'w-[92px]', align: 'text-right' },
];

export function InventoryPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [stock, setStock] = useState<StockStatus | null>(null);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [page, setPage] = useState(PAGINATION.current);
  const [perPage, setPerPage] = useState(PAGINATION.perPage);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INVENTORY_ITEMS.filter(
      (item) =>
        (!needle || item.name.toLowerCase().includes(needle) || item.category.toLowerCase().includes(needle)) &&
        (stock === null || item.stock === stock) &&
        (category === ALL_CATEGORIES || item.category === category),
    );
  }, [query, stock, category]);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-16">
        <PageHeader
          title="Inventory"
          subtitle="Monitor stock levels, manage reservations, and keep office essentials ready."
        />
        <Button variant="accent" onClick={() => void navigate('/inventory/new')}>
          + Add Catalog Item
        </Button>
      </div>

      <div className="mt-18 flex flex-wrap items-center gap-16">
        <Search
          placeholder="Search inventory by item name or code"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-[260px] flex-1"
        />
        {/* `Select` fills its parent, as the catalog's card requires, so the
            drawn 210px width is set on a wrapper rather than fought for with a
            competing width utility. */}
        <div className="w-[210px] shrink-0">
          <Select
            label="Filter by category"
            options={[ALL_CATEGORIES, ...CATEGORIES]}
            value={category}
            onChange={setCategory}
          />
        </div>
      </div>

      <div className="mt-16 flex flex-wrap items-center gap-10">
        {STOCK_FILTERS.map((filter) => {
          const active = stock === filter.match;
          return (
            <button
              key={filter.label}
              type="button"
              aria-pressed={active}
              onClick={() => setStock(filter.match)}
              // 31px tall as drawn: the frame's 8px padding sits inside its
              // 1px stroke, which CSS puts outside the box instead.
              className={`flex h-[31px] cursor-pointer items-center gap-4 rounded-pill px-14 font-sans text-12 transition-osrs ${
                active
                  ? 'border-none bg-brand-primary-alt text-brand-on-primary'
                  : 'border border-line-default bg-surface-card text-ink-strong hover:text-brand-primary'
              }`}
            >
              <span className={active ? 'font-bold' : ''}>{filter.label}</span>
              <span className={active ? '' : 'text-ink-muted'}>({filter.count})</span>
            </button>
          );
        })}
      </div>

      <TableCard className="mt-[34px] min-w-0">
        <div className="w-full min-w-0 overflow-x-auto">
          <div className="min-w-[1112px]">
            {/* The drawn header is 48px on a cool surface — taller than the
                library's `TableHead`, and with a right-aligned final column it
                does not model. Inlined rather than bending that component, the
                way the source's own inventory screen does. */}
            <div className="flex h-[48px] items-center bg-surface-table-header px-20">
              {COLUMNS.map((column) => (
                <span
                  key={column.label}
                  className={`type-eyebrow uppercase text-ink-secondary ${column.width} ${column.align ?? ''}`}
                >
                  {column.label}
                </span>
              ))}
            </div>

            {rows.map((item) => (
              <div
                key={item.id}
                className="flex h-row-height-inventory items-center border-b border-line-default px-20"
              >
                <span className="type-ui-bold w-[300px] text-ink-strong">{item.name}</span>
                <span className="type-ui w-[180px] text-ink-strong">{item.category}</span>
                <span className="w-[140px] font-sans text-14 leading-tight font-bold text-ink-strong">
                  {item.total}
                </span>
                <span
                  className={`w-[170px] font-sans text-14 leading-tight font-bold ${
                    item.available === 0 ? 'text-status-rejected-fg' : 'text-status-ready-fg'
                  }`}
                >
                  {item.available}
                </span>
                <span className="w-[190px] font-sans text-14 leading-tight text-ink-strong">{item.reserved}</span>
                <span className="flex-1">
                  <StatusPill stock={item.stock} />
                </span>
                <span className="flex w-[92px] justify-end">
                  <button
                    type="button"
                    onClick={() => void navigate(`/inventory/${item.id}/stock`)}
                    className="cursor-pointer border-none bg-transparent p-0 font-sans text-12 leading-tight font-bold whitespace-nowrap text-brand-primary transition-osrs hover:text-brand-primary-alt"
                  >
                    Update stock
                  </button>
                </span>
              </div>
            ))}

            {rows.length === 0 ? (
              <p className="flex h-row-height-inventory items-center px-20 type-body text-ink-secondary">
                No item matches that search
              </p>
            ) : null}
          </div>
        </div>
      </TableCard>

      {/* The frame pins the pager near the bottom edge of its 1024 canvas
          rather than to the table, so it is pushed down here too and settles
          at the drawn position at the design size. */}
      <div className="mt-auto pt-32">
        <Pagination
          rangeLabel={PAGINATION.rangeLabel}
          pages={PAGINATION.pages}
          current={page}
          onSelectPage={setPage}
          perPage={perPage}
          onSelectPerPage={setPerPage}
        />
      </div>

      {/* `/inventory/new` and `/inventory/:itemId/stock` render their drawer
          here, over this screen, exactly as both frames draw them. */}
      <Outlet />
    </>
  );
}
