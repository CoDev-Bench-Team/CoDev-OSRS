import React from 'react';
import { ArrowCircleDownFill } from '../icons/ArrowCircleDownFill.jsx';
import { CheckCircleFill } from '../icons/CheckCircleFill.jsx';

// figma node: 30:3088 button template (2 variants: state default | saved)
export function ButtonTemplate({ state = 'default', label, icon, className, style, ...rest }) {
  const saved = state === 'saved';
  return (
    <button
      type="button"
      className={className}
      style={{
        width: 'fit-content', height: saved ? undefined : 46, overflow: 'hidden',
        borderRadius: 8, border: 'none',
        opacity: saved ? 0.4 : 1,
        backgroundColor: saved ? 'var(--osrs-template-surface)' : 'var(--osrs-white)',
        boxShadow: 'inset 0 0 0 1px var(--osrs-template-purple)',
        display: 'flex', flexDirection: 'row', gap: 8, padding: '12px 24px',
        justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box',
        position: 'relative', cursor: saved ? 'default' : 'pointer',
        ...style,
      }}
      {...rest}
    >
      <span style={{ width: 22, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {icon ?? (saved
          ? <CheckCircleFill size={22} color="var(--osrs-template-purple)" />
          : <ArrowCircleDownFill size={22} color="var(--osrs-template-purple)" />)}
      </span>
      <span style={{ fontFamily: 'var(--font-noto)', fontWeight: 700, fontSize: 16, lineHeight: '100%', whiteSpace: 'nowrap', textTransform: 'uppercase', color: 'var(--osrs-template-purple)' }}>
        {label ?? (saved ? 'Template saved' : 'Save as template')}
      </span>
    </button>
  );
}
