'use client';

/**
 * Cross-tab live sync (Phase 4) — demo-mode plumbing.
 * ==================================================================
 * The demo runs entirely in the browser, so "real time" means *one tab telling
 * another tab immediately*. Two transports, each with exactly one job:
 *
 *   • `BroadcastChannel` → other tabs. Messages are stamped with the publishing
 *     tab's id, so a tab can ignore its own echo.
 *   • a same-document `CustomEvent` → this tab. Used for the case where two
 *     screens live in the same document (e.g. a student card and the counter
 *     console side by side).
 *
 * A subscriber therefore receives every message **exactly once**: the local
 * listener only accepts messages with `origin === TAB_ID`, the channel listener
 * only accepts messages from other tabs.
 *
 * `subscribeStorage()` is the belt-and-braces fallback for engines without
 * BroadcastChannel (and for the plain localStorage snapshot sync in store.tsx).
 *
 * Swapping this for Supabase Realtime later means re-implementing `publish()` /
 * `subscribe()` — no call site has to change.
 */

const LOCAL_EVENT = 'hostelhub:live';
const CHANNEL_PREFIX = 'hostelhub:';

/** Unique per browser tab so each tab can recognise (and skip) its own echo. */
export const TAB_ID: string = (() => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the random id below */
  }
  return `tab-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
})();

interface Envelope<T> {
  /** Tab that published the message. */
  origin: string;
  payload: T;
}

/** Shared outbound channels, one per name, so `publish()` never leaks instances. */
const outbound = new Map<string, BroadcastChannel>();

function outboundChannel(name: string): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  const key = CHANNEL_PREFIX + name;
  const existing = outbound.get(key);
  if (existing) return existing;
  try {
    const channel = new BroadcastChannel(key);
    outbound.set(key, channel);
    return channel;
  } catch {
    return null;
  }
}

/**
 * Publish a message to every other tab and to this document.
 * A no-op during SSR, and it can never throw at the caller: browsers that block
 * BroadcastChannel (or a closed channel) must not break a meal toggle.
 */
export function publish<T>(name: string, payload: T): void {
  if (typeof window === 'undefined') return;
  const envelope: Envelope<T> = { origin: TAB_ID, payload };
  try {
    outboundChannel(name)?.postMessage(envelope);
  } catch {
    /* channel closed / unsupported — the CustomEvent below still runs */
  }
  try {
    window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: { name, envelope } }));
  } catch {
    /* ignore */
  }
}

export interface SubscribeOptions {
  /**
   * Also act on messages published by *this* tab (default `false` when reading
   * the option, `true` is what the activity feed wants: the operator console
   * must react instantly even when it shares a document with the student card).
   */
  includeSelf?: boolean;
}

/** Listen for messages on a channel. Returns an unsubscribe function. */
export function subscribe<T>(
  name: string,
  handler: (payload: T) => void,
  options: SubscribeOptions = {}
): () => void {
  if (typeof window === 'undefined') return () => {};
  const includeSelf = options.includeSelf ?? true;

  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(CHANNEL_PREFIX + name);
      channel.onmessage = (event: MessageEvent<Envelope<T>>) => {
        const envelope = event.data;
        /* Other tabs only — our own echo is handled by the local event below. */
        if (!envelope || envelope.origin === TAB_ID) return;
        handler(envelope.payload);
      };
    }
  } catch {
    channel = null;
  }

  function onLocal(event: Event) {
    if (!includeSelf) return;
    const detail = (event as CustomEvent<{ name: string; envelope: Envelope<T> }>).detail;
    /* Same document only — cross-tab messages arrive through the channel. */
    if (!detail || detail.name !== name || detail.envelope.origin !== TAB_ID) return;
    handler(detail.envelope.payload);
  }
  window.addEventListener(LOCAL_EVENT, onLocal);

  return () => {
    window.removeEventListener(LOCAL_EVENT, onLocal);
    try {
      channel?.close();
    } catch {
      /* already closed */
    }
  };
}

/**
 * Watch a localStorage key being written by **another** tab. The `storage`
 * event only fires in the tabs that did not write, which is exactly what a
 * snapshot sync needs.
 */
export function subscribeStorage(key: string, handler: (value: string | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  function onStorage(event: StorageEvent) {
    if (event.key === key) handler(event.newValue);
  }
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
