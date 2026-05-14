// Simple in-memory pub/sub for SSE.
// Each topic is a string like "session:<id>" or "actions".
// Subscribers receive payloads pushed by API mutations.

type Listener = (payload: unknown) => void;

const channels = new Map<string, Set<Listener>>();

export function subscribe(topic: string, listener: Listener): () => void {
  let set = channels.get(topic);
  if (!set) {
    set = new Set();
    channels.set(topic, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
    if (set && set.size === 0) channels.delete(topic);
  };
}

export function publish(topic: string, payload: unknown) {
  const set = channels.get(topic);
  if (!set) return;
  for (const listener of set) {
    try {
      listener(payload);
    } catch {
      // ignore listener errors
    }
  }
}
