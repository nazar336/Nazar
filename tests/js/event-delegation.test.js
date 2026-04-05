import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { delegate } from '../../js/event-delegation.js';

describe('delegate', () => {
  let parent;

  beforeEach(() => {
    parent = document.createElement('div');
    document.body.appendChild(parent);
  });

  afterEach(() => {
    parent.remove();
  });

  it('handler is called when matching element is clicked', () => {
    const handler = vi.fn();
    parent.innerHTML = '<button class="btn">Click</button>';
    delegate(parent, 'click', '.btn', handler);

    parent.querySelector('.btn').click();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('handler is NOT called when non-matching element is clicked', () => {
    const handler = vi.fn();
    parent.innerHTML = '<button class="btn">Click</button><span class="other">X</span>';
    delegate(parent, 'click', '.btn', handler);

    parent.querySelector('.other').click();

    expect(handler).not.toHaveBeenCalled();
  });

  it('handler receives correct event and target element', () => {
    const handler = vi.fn();
    parent.innerHTML = '<button class="btn">Click</button>';
    delegate(parent, 'click', '.btn', handler);

    parent.querySelector('.btn').click();

    expect(handler).toHaveBeenCalledTimes(1);
    const [event, target] = handler.mock.calls[0];
    expect(event).toBeInstanceOf(Event);
    expect(target).toBe(parent.querySelector('.btn'));
  });

  it('works with nested elements (closest matching)', () => {
    const handler = vi.fn();
    parent.innerHTML = '<button class="btn"><span class="icon">★</span></button>';
    delegate(parent, 'click', '.btn', handler);

    parent.querySelector('.icon').click();

    expect(handler).toHaveBeenCalledTimes(1);
    const [, target] = handler.mock.calls[0];
    expect(target).toBe(parent.querySelector('.btn'));
  });

  it('does not fire when target is outside parent', () => {
    const handler = vi.fn();
    const outsideBtn = document.createElement('button');
    outsideBtn.className = 'btn';
    document.body.appendChild(outsideBtn);

    delegate(parent, 'click', '.btn', handler);

    outsideBtn.click();

    expect(handler).not.toHaveBeenCalled();
    outsideBtn.remove();
  });
});
