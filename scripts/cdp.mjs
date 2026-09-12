/** Minimal Chrome DevTools Protocol client.
 *  Uses Node's built-in WebSocket, so the fidelity and accessibility checks need
 *  no browser-automation dependency (constitution VIII). */
export async function connect(port = 9222) {
  const targets = await (await fetch(`http://localhost:${port}/json/list`)).json();
  let page = targets.find((t) => t.type === 'page');
  if (!page) {
    await fetch(`http://localhost:${port}/json/new?about:blank`, { method: 'PUT' });
    page = (await (await fetch(`http://localhost:${port}/json/list`)).json()).find((t) => t.type === 'page');
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
    close: () => ws.close(),
    async goto(url) {
      await send('Page.enable');
      await send('Page.navigate', { url });
      for (let i = 0; i < 100; i++) {
        await new Promise((r) => setTimeout(r, 100));
        const { result } = await send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true });
        if (result.value === 'complete') break;
      }
      await new Promise((r) => setTimeout(r, 600)); // let React mount + fonts settle
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
