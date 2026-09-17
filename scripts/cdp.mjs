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

/** Each connection takes a tab of ITS OWN by default: reusing whatever page
 *  happened to be first is how two concurrent runs end up driving each other.
 *  Pass `newTab: false` only to attach to an existing tab deliberately. */
export async function connect(port = DEFAULT_PORT, { newTab = true } = {}) {
  await ensureChrome(port);
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
    /** Closes the tab as well as the socket, so runs do not leave tabs behind. */
    close: () => {
      ws.close();
      void fetch(`http://localhost:${port}/json/close/${page.id}`).catch(() => {});
    },
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
