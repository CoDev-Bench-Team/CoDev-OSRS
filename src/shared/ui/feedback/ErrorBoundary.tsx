import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../actions/Button';
import { PageAlertOutline } from '../icons/PageAlertOutline';

/** FR-019: a failure inside a destination must not destroy the shell.
 *
 *  Wrapped around the outlet only, so the top bar, the role navigation and the
 *  account cluster survive a screen that throws and the user always has a way
 *  out. A class component because React exposes error boundaries no other way.
 *
 *  It holds the error until it is remounted. The shell gives it the current
 *  address as a `key`, so navigating away from a screen that threw clears the
 *  failure and the shell is not stuck on the fallback for the rest of the
 *  session.
 *
 *  The fallback is drawn as `NotFoundScreen` is — an icon over one line,
 *  centred both ways in the page — with a quieter second line and the two ways
 *  out beneath. A page with an exclamation mark, not a question mark, so a
 *  failure still reads differently from a mistyped address. */
type Props = { children: ReactNode; action?: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // The shell has no logging service and inventing one is out of scope, so
    // the console is where a developer finds this.
    console.error('A screen inside the shell failed to render.', error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-12 px-20 py-32 text-center">
        <span className="flex text-ink-muted" aria-hidden="true">
          <PageAlertOutline size={48} />
        </span>
        <div className="flex flex-col items-center gap-6">
          <h1 className="m-0 type-body text-ink-secondary">This screen could not be shown</h1>
          <p className="m-0 type-meta text-ink-muted">Something went wrong inside this screen. The rest of the application is unaffected.</p>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-12">
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
          {this.props.action}
        </div>
      </div>
    );
  }
}
