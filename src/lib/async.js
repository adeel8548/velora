/** Resolve a promise or return fallback after timeout (never hangs forever) */
export function withTimeout(promise, ms = 8000, fallback = null) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}
