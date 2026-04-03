'use strict';

export class VirtualScroll {
  constructor(container, { itemHeight = 200, buffer = 5, renderItem, totalItems = 0 }) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.buffer = buffer;
    this.renderItem = renderItem;
    this.totalItems = totalItems;
    this._setup();
  }
  _setup() {
    this.container.style.position = 'relative';
    this.viewport = document.createElement('div');
    this.viewport.style.cssText = 'overflow-y:auto;height:100%;';
    this.spacer = document.createElement('div');
    this.content = document.createElement('div');
    this.content.style.cssText = 'position:relative;';
    this.viewport.appendChild(this.spacer);
    this.viewport.appendChild(this.content);
    this.container.appendChild(this.viewport);
    this.viewport.addEventListener('scroll', () => this._render(), { passive: true });
    this._render();
  }
  refresh(totalItems) {
    this.totalItems = totalItems;
    this._render();
  }
  _render() {
    const scrollTop = this.viewport.scrollTop;
    const viewportHeight = this.viewport.clientHeight;
    this.spacer.style.height = (this.totalItems * this.itemHeight) + 'px';
    const startIdx = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.buffer);
    const endIdx = Math.min(this.totalItems, Math.ceil((scrollTop + viewportHeight) / this.itemHeight) + this.buffer);
    this.content.style.transform = `translateY(${startIdx * this.itemHeight}px)`;
    let html = '';
    for (let i = startIdx; i < endIdx; i++) {
      html += this.renderItem(i);
    }
    this.content.innerHTML = html;
  }
}
