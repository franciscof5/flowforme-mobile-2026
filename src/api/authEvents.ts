type Listener = () => void;

const listeners = new Set<Listener>();

/** Lets the session layer react to an API 401 by signing the user out. */
export function subscribeUnauthorized(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitUnauthorized(): void {
  for (const listener of [...listeners]) listener();
}
