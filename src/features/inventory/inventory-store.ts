import { usePanelTask } from '../../shared/ui';
import { fieldErrors, isValidationProblem } from '../../shared/validation';
import { isUnitProblem, type UnitProblem } from './inventory-source';

/** What a panel shows for a refused save: field errors, with the first one it
 *  has no field for (`shown` is false) also above the form; or the 404/409
 *  problem, which each panel places itself. */
export function refusal(error: unknown, what: string, shown: (key: string) => boolean): { problem: UnitProblem } | { errors: Record<string, string> } {
  if (isValidationProblem(error)) {
    const mapped = fieldErrors(error);
    const unshown = Object.keys(mapped).find((key) => !shown(key));
    return { errors: unshown === undefined ? mapped : { ...mapped, '': `${what}: ${mapped[unshown]}` } };
  }
  if (isUnitProblem(error)) return { problem: error };
  return { errors: { '': `${what}. Try again` } };
}

/** What a panel's save says: its button and toast while it runs, and how it
 *  ended. `failed` also heads the panel's own refusal message. */
export type AttemptCopy = { loading: string; done: string; failed: string };

/** A refusal in one line, for the toast that reports a save whose panel was
 *  closed: the field message, or the problem's detail. */
function refusalLine(error: unknown): string {
  if (isValidationProblem(error)) {
    const first = Object.values(fieldErrors(error))[0];
    return `${first ?? 'A field was refused.'} Open the unit to correct it.`;
  }
  if (isUnitProblem(error)) return error.detail;
  return 'Nothing was changed. Try again.';
}

/** A panel's save (`usePanelTask`): `saving` while it is in flight,
 *  `onDone` once it lands, `onRefused` with the error otherwise. If the panel
 *  is closed first, a toast reports the save instead and neither fires. */
export function useAttempt(onDone: () => void, onRefused: (error: unknown, what: string) => void) {
  const task = usePanelTask();
  async function attempt(run: () => Promise<unknown>, copy: AttemptCopy) {
    if (task.inFlight()) return; // a second press, dropped
    const result = await task.run(
      'save',
      {
        loading: copy.loading,
        success: () => ({ title: copy.done }),
        failure: (error) => ({ title: copy.failed, body: refusalLine(error) }),
      },
      run,
    );
    if (result.detached) return;
    if (result.ok) onDone();
    else onRefused(result.error, copy.failed);
  }
  return { saving: task.busy, attempt, handOff: () => task.handOff() };
}
