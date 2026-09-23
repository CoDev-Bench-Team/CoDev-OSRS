import { useEffect } from 'react';

/** Stops the page behind a modal from scrolling while the modal is open.
 *
 *  Counted, so a dialog opened over a side panel does not unlock the page when
 *  it closes first. The scrollbar's width is added back as padding, so hiding
 *  it does not shift the layout sideways. */
let locks = 0;
let saved: { overflow: string; paddingRight: string } | null = null;

function lock() {
  if (locks++ > 0) return;
  const root = document.documentElement;
  const body = document.body;
  const scrollbar = window.innerWidth - root.clientWidth;
  saved = { overflow: root.style.overflow, paddingRight: body.style.paddingRight };
  root.style.overflow = 'hidden';
  if (scrollbar > 0) {
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${padding + scrollbar}px`;
  }
}

function unlock() {
  if (--locks > 0 || !saved) return;
  document.documentElement.style.overflow = saved.overflow;
  document.body.style.paddingRight = saved.paddingRight;
  saved = null;
}

export function useScrollLock() {
  useEffect(() => {
    lock();
    return unlock;
  }, []);
}
