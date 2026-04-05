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
    // Use buffer > 0 since jsdom has clientHeight=0 (no layout engine)
    const vs = new VirtualScroll(container, {
      itemHeight: 50,
      buffer: 5,
      totalItems: 20,
      renderItem,
    });

    // With buffer=5 and scrollTop=0, startIdx=0, endIdx=min(20, ceil(0/50)+5)=5
    // So renderItem should be called for indices 0-4
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
