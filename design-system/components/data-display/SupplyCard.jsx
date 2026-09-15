import React from 'react';
import { StatusPills } from './StatusPills.jsx';

// figma node: 18:68 Supply card
const dsAssetBase = (() => { if (typeof document === 'undefined') return ''; const s = document.querySelector('script[src$="_ds_bundle.js"]'); return s ? s.getAttribute('src').replace(/_ds_bundle\.js$/, '') : ''; })();

export function SupplyCard({
  category = 'Devices',
  name = 'Business Laptop',
  availability = 'available',
  availabilityLabel,
  modelLabel = 'Model',
  model = 'Dell Latitude',
  quantity = 1,
  onQuantityChange,
  actionLabel = 'Add to Request List',
  onAction,
  image,
  className,
  style,
  ...rest
}) {
  const step = (d) => onQuantityChange && onQuantityChange(Math.max(1, quantity + d));
  const stepBtn = { borderRadius: 4, border: 'none', background: 'transparent', padding: '4px 8px', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, lineHeight: '100%', color: 'var(--osrs-stone-600)', cursor: 'pointer' };
  return (
    <div
      className={className}
      style={{ width: 436, overflow: 'hidden', borderRadius: 10, backgroundColor: 'var(--surface-card)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', position: 'relative', ...style }}
      {...rest}
    >
      <div style={{ height: 180, alignSelf: 'stretch', flexShrink: 0, background: `url(${image ?? dsAssetBase + 'assets/item-laptop.jpg'}) center / cover no-repeat` }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 18, alignItems: 'flex-start', boxSizing: 'border-box', alignSelf: 'stretch' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 11, lineHeight: '100%', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{category}</span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 17, lineHeight: '100%', color: 'var(--text-primary)' }}>{name}</span>
          <StatusPills availability={availability} label={availabilityLabel} />
        </div>
        <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 11.5, lineHeight: 1.3, color: 'var(--text-primary)' }}>{modelLabel}</span>
        <div style={{ height: 46, overflow: 'hidden', borderRadius: 10, backgroundColor: 'var(--surface-card)', boxShadow: 'var(--ring-default)', display: 'flex', flexDirection: 'row', padding: '0 16px', justifyContent: 'space-between', alignItems: 'center', boxSizing: 'border-box', alignSelf: 'stretch' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 14, lineHeight: '100%', color: 'var(--text-primary)' }}>{model}</span>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 12, lineHeight: '100%', color: 'var(--text-secondary)' }}>⌄</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch' }}>
          <div style={{ borderRadius: 4, backgroundColor: 'var(--surface-stepper)', display: 'flex', flexDirection: 'row', gap: 8, padding: 2, alignItems: 'center', boxSizing: 'border-box' }}>
            <button type="button" style={stepBtn} onClick={() => step(-1)}>-</button>
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, lineHeight: '100%', color: 'var(--osrs-stone-900)' }}>{quantity}</span>
            <button type="button" style={stepBtn} onClick={() => step(1)}>+</button>
          </div>
          <button
            type="button"
            onClick={onAction}
            style={{ width: 304, height: 42, overflow: 'hidden', borderRadius: 10, border: 'none', backgroundColor: 'var(--brand-primary)', boxShadow: 'var(--ring-brand)', display: 'flex', flexDirection: 'row', padding: '0 18px', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box', cursor: 'pointer' }}
          >
            <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13, lineHeight: '100%', whiteSpace: 'nowrap', color: 'var(--brand-on-primary)' }}>{actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
