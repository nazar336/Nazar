import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { VirtualScroll } from '../../js/virtual-scroll.js';

describe('VirtualScroll', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('constructor creates viewport and content elements', () => {
    const renderItem = vi.fn(() => '<div></div>');
    const vs = new VirtualScroll(container, {
      itemHeight: 50,
      totalItems: 10,
      renderItem,
    });

    expect(vs.viewport).toBeDefined();
    expect(vs.content).toBeDefined();
    expect(vs.spacer).toBeDefined();
    expect(container.contains(vs.viewport)).toBe(true);
    expect(vs.viewport.contains(vs.content)).toBe(true);
    expect(vs.viewport.contains(vs.spacer)).toBe(true);
    expect(container.style.position).toBe('relative');
  });

  it('refresh() updates totalItems', () => {
    const renderItem = vi.fn(() => '<div></div>');
    const vs = new VirtualScroll(container, {
      itemHeight: 50,
      totalItems: 0,
      renderItem,
    });

    expect(vs.totalItems).toBe(0);

    vs.refresh(25);

    expect(vs.totalItems).toBe(25);
  });

  it('_render() only renders visible items', () => {
    const renderItem = vi.fn((i) => `<div>${i}</div>`);
    const vs = new VirtualScroll(container, {
      itemHeight: 50,
      buffer: 2,
      totalItems: 100,
      renderItem,
    });

    // After initial render, should not have called renderItem 100 times
    expect(renderItem.mock.calls.length).toBeLessThan(100);
  });

  it('renderItem callback is called for visible range', () => {
    const renderItem = vi.fn((i) => `<div class="item">${i}</div>`);
    const vs = new VirtualScroll(container, {
      itemHeight: 50,
      buffer: 0,
      totalItems: 20,
      renderItem,
    });

    // renderItem should have been called at least once
    expect(renderItem).toHaveBeenCalled();

    // All indices passed should be within [0, totalItems)
    for (const call of renderItem.mock.calls) {
      const idx = call[0];
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(20);
    }

    // The content element should contain the rendered HTML
    expect(vs.content.innerHTML.length).toBeGreaterThan(0);
  });
});
