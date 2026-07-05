const TICK_INTERVAL_MS = 60000;

type Listener = () => void;

let now = new Date();
let intervalId: number | undefined;
const listeners = new Set<Listener>();

function tick() {
  now = new Date();
  listeners.forEach((listener) => listener());
}

export function subscribeNow(listener: Listener): () => void {
  listeners.add(listener);

  if (intervalId === undefined) {
    intervalId = window.setInterval(tick, TICK_INTERVAL_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  };
}

export function getNow(): Date {
  return now;
}
