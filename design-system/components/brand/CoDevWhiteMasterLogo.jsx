import React from 'react';

// figma node: 14:307 CoDev - white - master logo
const dsAssetBase = (() => { if (typeof document === 'undefined') return ''; const s = document.querySelector('script[src$="_ds_bundle.js"]'); return s ? s.getAttribute('src').replace(/_ds_bundle\.js$/, '') : ''; })();

export function CoDevWhiteMasterLogo({ height = 39, src, className, style, ...rest }) {
  return (
    <img
      className={className}
      src={src ?? dsAssetBase + 'assets/logo-codev-white.png'}
      alt="codev"
      style={{ height, width: 'auto', display: 'block', ...style }}
      {...rest}
    />
  );
}
