import { useEffect, useState, type RefObject } from 'react';

/** Subpixel rounding under zoom can leave `scrollTop` a pixel or so short of
 *  its maximum, so "at the end" allows this much slack. */
const END_TOLERANCE_PX = 2;

/** Whether the box has been scrolled to its end, **once** — the gate on the
 *  Accountability Form's agreement (spec 012 FR-005a, D8a).
 *
 *  Starts `false` on every mount and turns `true` the first time the end is in
 *  view, then never goes back, even if the reader scrolls up again. It checks:
 *
 *  - on the box's `scroll` event, which fires for wheel, touch, drag and
 *    keyboard scrolling alike;
 *  - on mount, and whenever the box resizes, so text that already fits — or
 *    comes to fit after a zoom or a resize — opens the gate at once.
 *
 *  It proves the text was reached, not read (plan Known Risks 6). */
export function useReadToEnd(box: RefObject<HTMLElement | null>): boolean {
  const [read, setRead] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el || read) return;
    const check = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - END_TOLERANCE_PX) setRead(true);
    };
    check();
    el.addEventListener('scroll', check, { passive: true });
    const resize = new ResizeObserver(check);
    resize.observe(el);
    return () => {
      el.removeEventListener('scroll', check);
      resize.disconnect();
    };
  }, [box, read]);

  return read;
}
