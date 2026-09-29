/** Minimal Chrome DevTools Protocol client.
 *  Uses Node's built-in WebSocket, so the fidelity and accessibility checks need
 *  no browser-automation dependency (constitution VIII). */
import { spawn } from 'node:child_process';

const CHROME =
  process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** One browser per port, one profile per browser. Several worktrees run these
 *  checks at once, and a shared browser means a shared tab: two runs then
 *  navigate each other's page and both report nonsense. Set OSRS_CDP_PORT to
 *  give a run a browser of its own. */
const DEFAULT_PORT = Number(process.env.OSRS_CDP_PORT ?? 9222);

async function up(port) {
  try {
    await fetch(`http://localhost:${port}/json/version`);
    return true;
  } catch {
    return false;
  }
}

/** Launch headless Chrome if it is not already listening. It exits on its own
 *  between runs often enough that requiring a manually-started browser made
 *  every check flaky. */
async function ensureChrome(port) {
  if (await up(port)) return;
  spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${port}`,
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=/tmp/osrs-cdp-profile-${port}`,
      'about:blank',
    ],
    { detached: true, stdio: 'ignore' },
  ).unref();
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (await up(port)) return;
  }
  throw new Error(`could not start Chrome on :${port} (set CHROME_PATH if it lives elsewhere)`);
}

/** Close tabs that earlier runs left behind.
 *
 *  The browser is kept between runs on purpose (see `ensureChrome`), but each
 *  run's tab must not be. A run that crashed before `close()`, or that exited
 *  before its close request was sent, leaves its tab open, and every open tab
 *  is a live renderer process. They piled up to hundreds of processes and
 *  slowed later runs until checks timed out at random.
 *
 *  A leaked tab is one no client is attached to (`Target.getTargets`) and
 *  that has navigated away from `about:blank`. Attached tabs belong to live
 *  runs, including runs from other worktrees on the same port, and are never
 *  touched. A blank tab may be one another run has just created and is about
 *  to attach to, so blank tabs are left alone too. */
async function sweepLeakedTabs(port) {
  let ws;
  try {
    const { webSocketDebuggerUrl } = await (await fetch(`http://localhost:${port}/json/version`)).json();
    ws = new WebSocket(webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });
    const { targetInfos } = await new Promise((resolve) => {
      ws.addEventListener('message', (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === 1) resolve(msg.result);
      });
      ws.send(JSON.stringify({ id: 1, method: 'Target.getTargets' }));
    });
    const leaked = targetInfos.filter((t) => t.type === 'page' && !t.attached && t.url !== 'about:blank');
    await Promise.all(
      leaked.map((t) => fetch(`http://localhost:${port}/json/close/${t.targetId}`).catch(() => {})),
    );
  } catch {
    // Housekeeping only: a failed sweep must never fail the check itself.
  } finally {
    ws?.close();
  }
}

/** Each connection takes a tab of ITS OWN by default: reusing whatever page
 *  happened to be first is how two concurrent runs end up driving each other.
 *  Pass `newTab: false` only to attach to an existing tab deliberately. */
export async function connect(port = DEFAULT_PORT, { newTab = true } = {}) {
  await ensureChrome(port);
  await sweepLeakedTabs(port);
  let page;
  if (newTab) {
    page = await (await fetch(`http://localhost:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  } else {
    const targets = await (await fetch(`http://localhost:${port}/json/list`)).json();
    page = targets.find((t) => t.type === 'page');
    if (!page) {
      await fetch(`http://localhost:${port}/json/new?about:blank`, { method: 'PUT' });
      page = (await (await fetch(`http://localhost:${port}/json/list`)).json()).find((t) => t.type === 'page');
    }
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.addEventListener('open', res, { once: true });
    ws.addEventListener('error', rej, { once: true });
  });
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) events.push(msg);
  });
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  return {
    send,
    events,
    targetId: page.id,
    /** Closes the tab as well as the socket, and resolves once Chrome has
     *  closed it. AWAIT it: every check calls `process.exit()` next, and an
     *  un-awaited close was killed before its request went out, leaving the
     *  tab open. That was the leak `sweepLeakedTabs` now cleans up after. */
    close: async () => {
      ws.close();
      await fetch(`http://localhost:${port}/json/close/${page.id}`).catch(() => {});
    },
    /** The same as `close`, kept for existing callers. */
    closeTab: async () => {
      ws.close();
      await fetch(`http://localhost:${port}/json/close/${page.id}`).catch(() => {});
    },
    /** Navigate and wait until the page is genuinely ready.
     *
     *  readyState 'complete' only means the document loaded — React may not
     *  have mounted, and Vite may still be hot-reloading after an edit. Checks
     *  that run against a half-mounted page fail for no real reason, which is
     *  worse than not running them.
     *
     *  Pass `ready` for pages whose content arrives later than the first mount.
     *  The compare harness is lazy-loaded behind a null Suspense fallback, so
     *  #root is legitimately empty for a while and a generic mount check is the
     *  wrong question to ask. */
    async goto(url, { ready, timeout = 20000 } = {}) {
      await send('Page.enable');
      await send('Page.navigate', { url });
      await this.waitFor(() => document.readyState === 'complete', timeout, 'the document to load');
      await this.waitFor(
        ready ?? (() => !!document.querySelector('#root')?.firstElementChild),
        timeout,
        'the page to render',
      );
      await new Promise((r) => setTimeout(r, 250)); // let fonts and layout settle
    },
    /** Poll a predicate in the page until it is true, or throw. */
    async waitFor(predicate, timeout = 10000, label = 'condition') {
      const started = Date.now();
      for (;;) {
        const expression = `(${predicate.toString()})()`;
        const { result } = await send('Runtime.evaluate', { expression, returnByValue: true });
        if (result.value) return;
        if (Date.now() - started > timeout) throw new Error(`timed out waiting for ${label}`);
        await new Promise((r) => setTimeout(r, 100));
      }
    },
    async evaluate(fn, ...args) {
      const expression = `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`;
      const { result, exceptionDetails } = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'eval failed');
      return result.value;
    },
    setViewport: (width, height) =>
      send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }),
  };
}
