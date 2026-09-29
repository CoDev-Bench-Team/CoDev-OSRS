/** Behaviour shared by the modal `<dialog>`s in this folder — `SidePanel` and
 *  `ConfirmDialog` — so a fix to one is a fix to both. */

/** Calls `onScrim` for a click on the dialog's `::backdrop`. The content fills
 *  the dialog box, so a click whose target is the dialog itself landed on the
 *  scrim. A click goes to the nearest common ancestor of where the pointer went
 *  down and where it came up, so a drag between the content and the scrim, in
 *  either direction, also "clicks" the dialog: both ends must land on the
 *  scrim. Returns the cleanup. */
export function listenForScrimClick(dialog: HTMLDialogElement, onScrim: () => void): () => void {
  let pressed = false;
  let released = false;
  const onPress = (e: PointerEvent) => {
    pressed = e.target === dialog;
  };
  const onRelease = (e: PointerEvent) => {
    released = e.target === dialog;
  };
  const onClick = (e: MouseEvent) => {
    const scrim = e.target === dialog && pressed && released;
    pressed = false;
    released = false;
    if (scrim) onScrim();
  };
  dialog.addEventListener('pointerdown', onPress);
  dialog.addEventListener('pointerup', onRelease);
  dialog.addEventListener('click', onClick);
  return () => {
    dialog.removeEventListener('pointerdown', onPress);
    dialog.removeEventListener('pointerup', onRelease);
    dialog.removeEventListener('click', onClick);
  };
}

/** Keeps a Tab keydown inside `dialog`, cycling through the elements that
 *  match `focusable`. The page behind a modal is inert, but Tab can still leave
 *  the document for the browser's own chrome. */
export function wrapTab(e: Pick<KeyboardEvent, 'shiftKey' | 'preventDefault'>, dialog: HTMLElement, focusable: string): void {
  const stops = [...dialog.querySelectorAll<HTMLElement>(focusable)];
  const first = stops[0];
  const last = stops[stops.length - 1];
  // Nothing enabled — every control disabled while work is in flight: hold
  // focus on the dialog itself rather than let Tab reach the page behind.
  if (!first || !last) {
    e.preventDefault();
    dialog.focus();
    return;
  }
  // A focused control that unmounts drops focus to <body>. Treat anywhere
  // outside the dialog like the dialog itself, so the next Tab comes back in.
  const active = document.activeElement;
  const outside = active === dialog || !dialog.contains(active);
  if (e.shiftKey && (active === first || outside)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || outside)) {
    e.preventDefault();
    first.focus();
  }
}
