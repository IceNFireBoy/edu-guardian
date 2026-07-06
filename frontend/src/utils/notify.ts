import toast from 'react-hot-toast';

/**
 * Notify the user about an event. If the tab is hidden and the browser
 * Notification permission is granted, a system notification is shown (so chat
 * messages / badge earns reach students who tabbed away); otherwise an in-app
 * toast. Permission is only requested from an explicit user action.
 */

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
};

export const notify = (title: string, body?: string): void => {
  const hidden = typeof document !== 'undefined' && document.hidden;
  if (hidden && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/favicon.ico', tag: `${title}-${body ?? ''}` });
      return;
    } catch {
      /* fall through to toast */
    }
  }
  toast(body ? `${title} — ${body}` : title, { id: `${title}-${body ?? ''}` });
};
