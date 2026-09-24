import { Button, SidePanel } from '../../shared/ui';
import { CATEGORY_FIELDS, SPEC_LABEL } from './category-fields';
import type { Asset } from './types';

/** View Asset — `03.2- View Asset` (spec 008 Story 3).
 *
 *  Reads back Item Name, Model and the category's specification rows, then any
 *  custom specs, then Description, with **Update Asset** at the foot. A row the
 *  category does not draw is not shown; a drawn row with no value reads `—`
 *  rather than disappearing, so the Admin can see what is missing. */
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
    ['Item Name', asset.name],
    ['Category', asset.category],
    ...(rule.model !== 'absent' ? [['Model', asset.model] as [string, string | undefined]] : []),
    ...rule.specs.map((key) => [SPEC_LABEL[key], asset.specs[key]] as [string, string | undefined]),
    ...asset.customSpecs.map((s) => [s.key, s.value] as [string, string | undefined]),
    ['Description', asset.description],
  ];

  return (
    <SidePanel
      title={`View Asset — ${asset.name}`}
      onClose={onClose}
      header={<h2 className="font-display text-[22px] font-medium leading-display text-ink-primary">View Asset</h2>}
      footer={
        <div className="flex justify-center border-t border-line-default pt-16">
          <Button onClick={onUpdate}>Update Asset</Button>
        </div>
      }
    >
      {asset.image ? (
        <img src={asset.image} alt="" className="aspect-[4/3] w-full rounded-10 object-cover" />
      ) : null}
      <dl className="flex flex-col">
        {rows.map(([label, value], i) => (
          <div key={`${label}-${i}`} className="flex flex-col gap-6 border-b border-line-default py-12 last:border-b-0">
            <dt className="type-meta text-ink-secondary">{label}</dt>
            <dd className={`m-0 font-sans text-14 leading-body ${value ? 'text-ink-strong' : 'text-ink-muted'}`}>
              {value || '—'}
            </dd>
          </div>
        ))}
      </dl>
    </SidePanel>
  );
}
