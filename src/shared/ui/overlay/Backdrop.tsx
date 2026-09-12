import type { ReactNode } from 'react';

/** The modal scrim — 50% black, the only transparency in the file besides the
 *  card shadow and the four status tints. No blur: the source never uses
 *  backdrop-filter. */
export function Backdrop({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={`fixed inset-0 flex items-center justify-center overflow-hidden bg-backdrop ${className ?? ''}`}>
      {children}
    </div>
  );
}
