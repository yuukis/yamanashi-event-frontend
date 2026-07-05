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
    tick();
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

function handleVisibilityChange() {
  if (!document.hidden && intervalId !== undefined) {
    tick();
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);

    if (intervalId !== undefined) {
      window.clearInterval(intervalId);
      intervalId = undefined;
    }
  });
}

export function getNow(): Date {
  return now;
}
