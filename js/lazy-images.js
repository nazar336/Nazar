'use strict';

export function initLazyImages(root = document) {
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        img.classList.add('lazy-loaded');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px' });
  root.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}
