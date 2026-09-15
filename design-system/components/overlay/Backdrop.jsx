import React from 'react';

// figma node: 22:856 Backdrop
export function Backdrop({ children, className, style, ...rest }) {
  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', backgroundColor: 'var(--backdrop-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}
      {...rest}
    >{children}</div>
  );
}
