import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { trapFocus, onEscape } from '../../js/focus-trap.js';

describe('trapFocus', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('returns a cleanup function', () => {
    container.innerHTML = '<button>A</button><button>B</button>';
    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('focuses the first focusable element', () => {
    container.innerHTML = '<button id="first">A</button><button>B</button>';
    trapFocus(container);
    expect(document.activeElement).toBe(container.querySelector('#first'));
  });

  it('returns noop when no focusable elements', () => {
    container.innerHTML = '<div>No focusable elements</div>';
    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe('function');
    // Should not throw
    cleanup();
  });

  it('cleanup removes event listener', () => {
    container.innerHTML = '<button>A</button><button>B</button>';
    const spy = vi.spyOn(container, 'removeEventListener');
    const cleanup = trapFocus(container);

    cleanup();

    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
    spy.mockRestore();
  });
});

describe('onEscape', () => {
  it('calls callback when Escape is pressed', () => {
    const cb = vi.fn();
    const cleanup = onEscape(cb);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(cb).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it('does not call callback for other keys', () => {
    const cb = vi.fn();
    const cleanup = onEscape(cb);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    expect(cb).not.toHaveBeenCalled();
    cleanup();
  });

  it('cleanup removes event listener', () => {
    const cb = vi.fn();
    const cleanup = onEscape(cb);

    cleanup();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cb).not.toHaveBeenCalled();
  });
});
