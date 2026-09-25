import { useEffect, type ReactNode } from 'react';
import { dismissPopovers } from './popover-layer';
import { useScrollLock } from './scroll-lock';

/** The modal scrim — 50% black, the only transparency in the file besides the
 *  card shadow and the four status tints. No blur: the source never uses
 *  backdrop-filter.
 *
 *  Sits on the backdrop layer, with its children on the dialog layer above it.
 *  Dismisses any open popover on mount, so a dropdown left open elsewhere does
 *  not hover over the tint. */
export function Backdrop({ children, className }: { children?: ReactNode; className?: string }) {
  useScrollLock();
  useEffect(() => {
    dismissPopovers();
  }, []);

  return (
    <div
      className={`fixed inset-0 z-backdrop flex items-center justify-center overflow-hidden bg-backdrop ${className ?? ''}`}
    >
      <div className="relative z-dialog flex max-h-full max-w-full items-center justify-center">{children}</div>
    </div>
  );
}
