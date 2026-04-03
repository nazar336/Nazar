'use strict';

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function trapFocus(container) {
  const focusable = [...container.querySelectorAll(FOCUSABLE)];
  if (!focusable.length) return () => {};

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  function handler(e) {
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  container.addEventListener('keydown', handler);
  first.focus();

  // Return cleanup function
  return () => container.removeEventListener('keydown', handler);
}

export function onEscape(callback) {
  function handler(e) {
    if (e.key === 'Escape') callback();
  }
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}
