import React from 'react';
import { ArrowCounterClockwise } from '../icons/ArrowCounterClockwise.jsx';

// figma node: 30:3071 button with icon (2 variants: Property 1 default | hover)
export function ButtonWithIcon({ property1 = 'default', label = 'Regenerate List of jobs', icon, className, style, ...rest }) {
  const hover = property1 === 'hover';
  const color = hover ? 'var(--osrs-template-muted)' : 'var(--osrs-template-ink)';
  return (
    <button
      type="button"
      className={className}
      style={{ width: 'fit-content', background: 'none', border: 'none', padding: 0, borderRadius: hover ? 10 : undefined, display: 'flex', flexDirection: 'row', gap: 4, alignItems: 'center', position: 'relative', cursor: 'pointer', ...style }}
      {...rest}
    >
      <span style={{ width: 22, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon ?? <ArrowCounterClockwise size={22} color={color} />}
      </span>
      <span style={{ fontFamily: 'var(--font-noto)', fontWeight: 500, fontSize: 16, lineHeight: '100%', whiteSpace: 'nowrap', color }}>{label}</span>
    </button>
  );
}
