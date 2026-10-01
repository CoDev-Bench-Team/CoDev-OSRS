import { Button, SidePanel, StatusPill } from '../../shared/ui';
import { CATEGORY_FIELDS, SPEC_LABEL } from './category-fields';
import { assetInventoryStatus } from './stock';
import type { Asset } from './types';

/** View Asset — `03.2- View Asset` (spec 014 Story 3).
 *
 *  The image, then Item Name with the asset's `Inventory Status` pill, Model
 *  and the category's specification rows, Description, and Low Stock
 *  Threshold, with **Update Asset** at the foot. Category is not read back; the
 *  frame draws no row for it. A row the category does not draw is not shown; a
 *  drawn row with no value reads `—` rather than disappearing, so the Admin can
 *  see what is missing.
 *
 *  Each row is a 14px bold muted label over a 14px bold value, 6px apart, rows
 *  8px apart with no rule between them, as the frame draws them. A row is at
 *  least 58px, the frame's fixed field height, so a one-line pair carries
 *  about the same space under it as the Item Name row its 32px pill makes. */
const ROW = 'flex min-h-[58px] flex-col gap-6';
const LABEL = 'font-sans text-14 font-bold leading-body text-ink-muted';
const VALUE = 'font-sans text-14 font-bold leading-body';

export function ViewAssetPanel({
  asset,
  onClose,
  onUpdate,
}: {
  asset: Asset;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const rule = CATEGORY_FIELDS[asset.category];
  const rows: [label: string, value: string | undefined][] = [
    ...(rule.model !== 'absent' ? [['Model', asset.model] as [string, string | undefined]] : []),
    ...rule.specs.map((key) => [SPEC_LABEL[key], asset.specs[key]] as [string, string | undefined]),
    ['Description', asset.description],
    ['Low Stock Threshold', String(asset.lowStockThreshold)],
  ];

  return (
    <SidePanel
      title={`View Asset — ${asset.name}`}
      onClose={onClose}
      header={<h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">View Asset</h2>}
      bodyClassName="gap-14 px-16 pt-20 pb-24"
      footerClassName="border-t border-osrs-border-warm px-16 pt-9 pb-8"
      footer={
        <div className="flex justify-center">
          <Button onClick={onUpdate}>Update Asset</Button>
        </div>
      }
    >
      {asset.image ? (
        <img
          src={asset.image}
          alt=""
          className="h-[158px] w-full rounded-8 border border-osrs-border-strong object-cover"
        />
      ) : null}
      <dl className="m-0 flex flex-col gap-8">
        <div className={ROW}>
          <dt className={LABEL}>Item Name</dt>
          <dd className={`m-0 flex flex-wrap items-center gap-6 ${VALUE} text-osrs-ink-800`}>
            {asset.name}
            <StatusPill inventory={assetInventoryStatus(asset)} />
          </dd>
        </div>
        {rows.map(([label, value], i) => (
          <div key={`${label}-${i}`} className={ROW}>
            <dt className={LABEL}>{label}</dt>
            <dd className={`m-0 whitespace-pre-line ${VALUE} ${value ? 'text-osrs-ink-800' : 'text-ink-muted'}`}>
              {value || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </SidePanel>
  );
}
