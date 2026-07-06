/**
 * Persisted developer/demo feature flags (localStorage `eg_dev_flags`).
 * Components subscribe to changes via the `eg-dev-flags-changed` window event
 * so a toggle in Settings takes effect immediately app-wide.
 */

export interface DevFlags {
  /** Anti-cheat demo: blur the app when the tab/window loses focus */
  focusGuard: boolean;
}

const STORAGE_KEY = 'eg_dev_flags';
const DEFAULTS: DevFlags = { focusGuard: false };
export const DEV_FLAGS_EVENT = 'eg-dev-flags-changed';

export const getDevFlags = (): DevFlags => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<DevFlags>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
};

export const setDevFlag = <K extends keyof DevFlags>(key: K, value: DevFlags[K]): DevFlags => {
  const next = { ...getDevFlags(), [key]: value };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage blocked — flag lives only for this render */
  }
  window.dispatchEvent(new CustomEvent(DEV_FLAGS_EVENT, { detail: next }));
  return next;
};
