import React from 'react';
import { CoDevRedMasterLogo } from './CoDevRedMasterLogo.jsx';

// figma node: 14:311 CoDev - Supply Requests - Logo
export function CoDevSupplyRequestsLogo({ productName = 'SUPPLY REQUESTS', markHeight = 36, className, style, ...rest }) {
  return (
    <div
      className={className}
      style={{ width: 'fit-content', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start', position: 'relative', ...style }}
      {...rest}
    >
      <CoDevRedMasterLogo height={markHeight} />
      <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, lineHeight: 1.5, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{productName}</span>
    </div>
  );
}
