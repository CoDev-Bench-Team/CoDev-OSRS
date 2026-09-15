import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../actions/Button';
import { Notice } from './Notice';

/** FR-019: a failure inside a destination must not destroy the shell.
 *
 *  Wrapped around the outlet only, so the top bar, the role navigation and the
 *  account cluster survive a screen that throws and the user always has a way
 *  out. A class component because React exposes error boundaries no other way.
 *
 *  It holds the error until it is remounted. The shell gives it the current
 *  address as a `key`, so navigating away from a screen that threw clears the
 *  failure and the shell is not stuck on the fallback for the rest of the
 *  session. */
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
      <Notice
        eyebrow="Error"
        tone="stopped"
        title="This screen could not be shown"
        body="Something went wrong inside this screen. The rest of the application is unaffected."
        actions={
          <>
            <Button onClick={() => this.setState({ error: null })}>Try again</Button>
            {this.props.action}
          </>
        }
      />
    );
  }
}
