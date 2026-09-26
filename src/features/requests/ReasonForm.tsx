import { useState, type FormEvent } from 'react';
import { Button, TextField } from '../../shared/ui';

/** A required reason with Cancel / Confirm: the drawn pink block that stops a
 *  request (spec 008 plan D6).
 *
 *  It is one shape with several callers: the Employee's cancel (`04.2`), the
 *  Admin's reject (`02.2.2`), and, with BEN-135, the Admin's cancel. It owns the
 *  typed text and the empty check. The caller owns what happens on confirm.
 *
 *  An empty reason, or one that is only spaces, is refused here before anything
 *  is sent. `onConfirm` receives the reason already trimmed, so no source has to
 *  trim it again. Backing out unmounts the form, and with it the typed reason. */
export function ReasonForm({
  label,
  placeholder,
  confirmLabel,
  requiredMessage,
  submitting,
  onBack,
  onConfirm,
}: {
  label: string;
  placeholder: string;
  confirmLabel: string;
  /** Shown under the field when the reason is empty. */
  requiredMessage: string;
  /** Disables both buttons while the caller's request is in flight, so one
   *  click is one request (spec 008 FR-015). */
  submitting: boolean;
  onBack: () => void;
  /** Resolves `'reason-required'` if the source refused the reason anyway,
   *  which puts the field back in its invalid state. */
  onConfirm: (reason: string) => Promise<'reason-required' | void>;
}) {
  const [reason, setReason] = useState('');
  const [invalid, setInvalid] = useState(false);

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      setInvalid(true);
      return;
    }
    if ((await onConfirm(trimmed)) === 'reason-required') setInvalid(true);
  };

  return (
    <form onSubmit={confirm} className="flex flex-col gap-12" noValidate>
      <TextField
        label={label}
        tone="danger"
        required
        autoFocus
        placeholder={placeholder}
        value={reason}
        invalid={invalid}
        message={requiredMessage}
        onChange={(e) => {
          setReason(e.target.value);
          if (invalid && e.target.value.trim()) setInvalid(false);
        }}
      />
      <div className="flex items-center justify-center gap-12">
        <Button variant="ghost" onClick={onBack} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {confirmLabel}
        </Button>
      </div>
    </form>
  );
}
