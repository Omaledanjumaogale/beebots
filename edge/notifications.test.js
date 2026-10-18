import { afterEach, describe, expect, it, vi } from 'vitest';
import runtime, { HiveControl } from './worker.js';

function fixture() {
  const objects = new Map(), writes = [], stores = new Map(), controls = new Map();
  const env = {
    EDGE_SERVICE_SECRET: 'test-service-secret',
    ARTIFACTS: {
      get: async key => objects.has(key) ? {
        json: async () => JSON.parse(objects.get(key).body),
        text: async () => objects.get(key).body,
        customMetadata: objects.get(key).options?.customMetadata,
      } : null,
      put: async (key, body, options) => { writes.push(key); objects.set(key, { body, options }); },
    },
    CONTROL: {
      idFromName: name => name,
      get: name => {
        if (!controls.has(name)) {
          const db = new Map(); stores.set(name, db);
          const state = {
            blockConcurrencyWhile: action => action(),
            storage: {
              get: async key => db.get(key),
              put: async (key, value) => {
                if (typeof key === 'object') for (const [k, v] of Object.entries(key)) db.set(k, structuredClone(v));
                else db.set(key, structuredClone(value));
              },
            },
          };
          controls.set(name, new HiveControl(state, env));
        }
        return { fetch: (url, options) => controls.get(name).fetch(new Request(url, options)) };
      },
    },
  };
  const call = (owner, operation, subscription) => runtime.fetch(new Request('https://runtime/notifications', {
    method: 'POST', headers: { Authorization: `Bearer ${env.EDGE_SERVICE_SECRET}` },
    body: JSON.stringify({ owner, operation, subscription }),
  }), env);
  return { env, objects, writes, stores, call };
}
const device = number => ({
  endpoint: `https://fcm.googleapis.com/fcm/send/private-device-${number}`,
  keys: { p256dh: `private-public-key-${number}`, auth: `private-auth-secret-${number}` },
});
afterEach(() => vi.useRealTimers());

describe('owner-scoped private notification registry', () => {
  it('isolates subscriptions and deletion between verified owners', async () => {
    const f = fixture(), aliceDevice = device(1), bobDevice = device(2);
    expect((await f.call('alice', 'subscribe', aliceDevice)).status).toBe(200);
    expect((await f.call('bob', 'subscribe', bobDevice)).status).toBe(200);
    expect(await (await f.call('alice', 'read')).json()).toEqual([aliceDevice]);
    expect(await (await f.call('bob', 'read')).json()).toEqual([bobDevice]);
    await f.call('bob', 'unsubscribe', aliceDevice);
    expect(await (await f.call('alice', 'read')).json()).toEqual([aliceDevice]);
    expect(await (await f.call('bob', 'read')).json()).toEqual([bobDevice]);
  });

  it('caps each owner at three devices while permitting replacement and enrollment after removal', async () => {
    const f = fixture();
    for (let n = 1; n <= 3; n++) expect((await f.call('alice', 'subscribe', device(n))).status).toBe(200);
    const before = f.writes.length;
    expect((await f.call('alice', 'subscribe', device(4))).status).toBe(409);
    expect(f.writes).toHaveLength(before);
    const renewed = { ...device(2), keys: { p256dh: 'rotated-key', auth: 'rotated-auth' } };
    expect((await f.call('alice', 'subscribe', renewed)).status).toBe(200);
    expect(await (await f.call('alice', 'read')).json()).toEqual([device(1), device(3), renewed]);
    await f.call('alice', 'unsubscribe', device(1));
    expect((await f.call('alice', 'subscribe', device(4))).status).toBe(200);
    expect((await f.call('bob', 'subscribe', device(5))).status).toBe(200);
  });

  it('reserves at most five delivery reads per owner per UTC day and resets the next day', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-17T23:59:00Z'));
    const f = fixture(); await f.call('alice', 'subscribe', device(1));
    for (let n = 0; n < 5; n++) expect((await f.call('alice', 'read')).status).toBe(200);
    const denied = await f.call('alice', 'read');
    expect(denied.status).toBe(429);
    expect(await denied.json()).toEqual({ error: 'Daily notification limit reached' });
    expect((await f.call('bob', 'read')).status).toBe(200);
    expect((await f.call('alice', 'unsubscribe', device(1))).status).toBe(200);
    vi.setSystemTime(new Date('2026-10-18T00:00:00Z'));
    expect(await (await f.call('alice', 'read')).json()).toEqual([]);
  });

  it('stores device secrets only under hashed private R2 keys and never exposes them in runtime status', async () => {
    const f = fixture(), subscription = device(1);
    await f.call('alice@example.test', 'subscribe', subscription);
    expect([...f.objects.keys()]).toHaveLength(1);
    expect([...f.objects.keys()][0]).toMatch(/^private\/notifications\/[a-f0-9]{64}\.json$/);
    expect([...f.objects.keys()][0]).not.toContain('alice');
    expect([...f.objects.values()][0].body).toContain(subscription.keys.auth);
    const response = await f.env.CONTROL.get('notification-registry').fetch('https://control/', {
      method: 'POST', body: JSON.stringify({ action: 'status' }),
    });
    const status = JSON.stringify(await response.json());
    expect(status).not.toContain(subscription.endpoint);
    expect(status).not.toContain(subscription.keys.auth);
    for (const db of f.stores.values()) expect(JSON.stringify([...db.values()])).not.toContain(subscription.keys.auth);
  });

  it('requires the internal service authorization before reading or mutating subscriptions', async () => {
    const f = fixture();
    const response = await runtime.fetch(new Request('https://runtime/notifications', {
      method: 'POST', body: JSON.stringify({ owner: 'alice', operation: 'subscribe', subscription: device(1) }),
    }), f.env);
    expect(response.status).toBe(401);
    expect(f.writes).toHaveLength(0);
    expect((await f.call('alice', 'unsupported', device(1))).status).toBe(400);
    expect((await f.call('alice', 'subscribe', {})).status).toBe(400);
  });
});
