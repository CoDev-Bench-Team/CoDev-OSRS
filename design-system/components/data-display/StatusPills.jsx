import React from 'react';

// figma node: 21:147 Status Pills
const AVAILABILITY = {
  available: { bg: 'var(--status-available-bg)', fg: 'var(--status-available-fg)', label: 'Available ' },
  unavailable: { bg: 'var(--status-unavailable-bg)', fg: 'var(--status-unavailable-fg)', label: 'Unavailable' },
};

const REQUEST = {
  'Pending Approval': { bg: 'var(--status-pending-bg)', fg: 'var(--status-pending-fg)' },
  Approved: { bg: 'var(--status-ready-bg)', fg: 'var(--status-ready-fg)' },
  'Ready for Pickup': { bg: 'var(--status-ready-bg)', fg: 'var(--status-ready-fg)' },
  'For Delivery': { bg: 'var(--status-ready-bg)', fg: 'var(--status-ready-fg)' },
  'For Release': { bg: 'var(--status-ready-bg)', fg: 'var(--status-ready-fg)' },
  Released: { bg: 'var(--status-ready-bg)', fg: 'var(--status-ready-fg)' },
  Completed: { bg: 'var(--status-ready-bg)', fg: 'var(--status-ready-fg)' },
  Rejected: { bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)' },
  'In Stock': { bg: 'var(--status-ready-bg)', fg: 'var(--status-ready-fg)' },
  'Low Stock': { bg: 'var(--status-pending-bg)', fg: 'var(--status-pending-fg)' },
  'Out of Stock': { bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)' },
};

export function StatusPills({ shape = 'pill', status = 'Pending Approval', availability, label, className, style, ...rest }) {
  const box = availability
    ? AVAILABILITY[availability] ?? AVAILABILITY.available
    : REQUEST[status] ?? REQUEST['Pending Approval'];
  const rounded = shape === 'rounded' || !!availability;
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: rounded ? 'center' : 'flex-start',
        borderRadius: rounded ? 8 : 999,
        padding: rounded ? '10px' : '6px 10px',
        backgroundColor: box.bg, color: box.fg,
        fontFamily: 'var(--font-sans)', fontWeight: 700,
        fontSize: rounded ? 11.5 : 12,
        lineHeight: rounded ? 1.3 : '100%',
        whiteSpace: 'nowrap', boxSizing: 'border-box', ...style,
      }}
      {...rest}
    >{label ?? (availability ? box.label : status)}</span>
  );
}
