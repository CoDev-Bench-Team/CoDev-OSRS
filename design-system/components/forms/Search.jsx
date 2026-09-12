import React from 'react';

// figma node: 17:38 Search
export function Search({ placeholder = 'Search supplies by name or category', value, onChange, className, style, ...rest }) {
  return (
    <div
      className={className}
      style={{ height: 46, overflow: 'hidden', borderRadius: 10, backgroundColor: 'var(--surface-card)', boxShadow: 'var(--ring-default)', display: 'flex', flexDirection: 'row', gap: 10, padding: '0 16px', alignItems: 'center', boxSizing: 'border-box', position: 'relative', color: 'var(--text-secondary)', ...style }}
      {...rest}
    >
      <span style={{ width: 18, height: 18, position: 'relative', flexShrink: 0 }}>
        <svg viewBox="0 0 13.5 13.5" fill="none" style={{ position: 'absolute', left: 2.25, top: 2.25, width: 13.5, height: 13.5 }}>
          <path d="M 13.147 13.854 C 13.342 14.049 13.658 14.049 13.854 13.854 C 14.049 13.658 14.049 13.342 13.854 13.147 L 13.5 13.5 L 13.147 13.854 Z M 10.599 9.892 C 10.403 9.696 10.087 9.696 9.892 9.892 C 9.696 10.087 9.696 10.403 9.892 10.599 L 10.245 10.245 L 10.599 9.892 Z M 13.5 13.5 L 13.854 13.147 L 10.599 9.892 L 10.245 10.245 L 9.892 10.599 L 13.147 13.854 L 13.5 13.5 Z M 12 6 L 11.5 6 C 11.5 9.038 9.038 11.5 6 11.5 L 6 12 L 6 12.5 C 9.59 12.5 12.5 9.59 12.5 6 L 12 6 Z M 6 12 L 6 11.5 C 2.962 11.5 0.5 9.038 0.5 6 L 0 6 L -0.5 6 C -0.5 9.59 2.41 12.5 6 12.5 L 6 12 Z M 0 6 L 0.5 6 C 0.5 2.962 2.962 0.5 6 0.5 L 6 0 L 6 -0.5 C 2.41 -0.5 -0.5 2.41 -0.5 6 L 0 6 Z M 6 0 L 6 0.5 C 9.038 0.5 11.5 2.962 11.5 6 L 12 6 L 12.5 6 C 12.5 2.41 9.59 -0.5 6 -0.5 L 6 0 Z" fill="currentColor" fillRule="nonzero" />
        </svg>
      </span>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--font-sans)', fontWeight: 400, fontSize: 14, lineHeight: '100%', color: 'var(--text-primary)' }}
      />
    </div>
  );
}
