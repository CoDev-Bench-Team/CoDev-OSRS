import type { Ref } from 'react';

/** The system's refusal, at the top of a request panel: the `Rejected` pill's
 *  red pair as a note, announced as an alert.
 *
 *  The design draws no refusal state; this treatment was added for the
 *  Employee's cancel in spec 007 and is reused as-is by the Request List's
 *  submit (spec 008 D15), so the two panels cannot drift apart. Each message
 *  is shown as the system worded it. Focusable from script only, so a panel
 *  can move focus here when a refusal lands and nothing else is invalid. */
export function RefusalAlert({ messages, ref }: { messages: readonly string[]; ref?: Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      role="alert"
      tabIndex={-1}
      className="flex flex-col gap-4 rounded-8 bg-status-rejected-bg px-12 py-10 type-body text-status-rejected-fg outline-none"
    >
      {messages.map((m) => (
        <p key={m}>{m}</p>
      ))}
    </div>
  );
}
