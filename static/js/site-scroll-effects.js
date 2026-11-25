// Hiệu ứng theo cuộn trang: hiện dần nội dung, thu gọn header, thanh tiến độ đọc bài.
(function () {
  'use strict';

  // Các khối được hiện dần khi cuộn tới; phần tử cùng nhóm hiện so le nhau.
  // Dải số liệu (.fact) không nằm ở đây: nó chạy hiệu ứng bằng CSS ngay khi vào trang (site-effects.css).
  const REVEAL_SELECTORS = [
    '.section-head', '.section-head-center', '.journey-intro', '.journey-step', '.journey-services .service-grid > li',
    '.season', '.etiquette li', '.arrival', '.post-card',
    '.photo-strip a', '.gallery-invite', '.gallery-grid figure', '.cta-inner',
    '.prose > :is(h2, h3, h4, p, ul, ol, img, figure, blockquote, table, pre, .post-tags)',
    '.section-title', '.village-text', '.village-highlight',
    '.visit-etiquette > :is(.eyebrow, h2, p)', '.contact-card', '.contact-story', '.contact-service-grid > li',
    '.service-intro', '.service-actions', '.service-section', '.service-story-text:not(.dining-menu-text)', '.service-story-photos > a', '.service-room',
    '.dining-menu-text > h2', '.dining-menu-text > p', '.dining-menu-list > li',
    '.service-dishes-title', '.service-dish', '.service-reasons > h2', '.service-reasons-intro',
    '.service-reason', '.service-info > :is(h2, dl)', '.service-note',
  ];
  const STAGGER_SECONDS = 0.08;

  function setupReveal() {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const selector = REVEAL_SELECTORS.join(',');
    const liveResults = document.querySelector('[data-infinite-items]');
    // Hiện một khối; xong thì gỡ thuộc tính để hiệu ứng rê chuột (transform) của thẻ hoạt động lại.
    const reveal = (el) => {
      el.classList.add('is-revealed');
      el.addEventListener('transitionend', () => {
        el.removeAttribute('data-reveal');
        el.classList.remove('is-revealed');
        el.style.removeProperty('--reveal-delay');
      }, { once: true });
    };

    const observer = new IntersectionObserver((entries) => {
      const grids = new Map();
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;
        if (!parent || !el.isConnected) return;
        if (!grids.has(parent)) {
          const style = window.getComputedStyle(parent);
          const columns = style.display === 'grid' ? style.gridTemplateColumns.trim().split(/\s+/).length : 1;
          grids.set(parent, { columns, items: columns > 1 ? Array.from(parent.children) : [] });
        }
        const { columns, items } = grids.get(parent);
        const column = columns > 1 ? items.indexOf(el) % columns : 0;
        if (column > 0) el.style.setProperty('--reveal-delay', `${column * STAGGER_SECONDS}s`);
        observer.unobserve(el);
        reveal(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    function observeTargets(targets) {
      const viewportHeight = window.innerHeight;
      // Leave content already in view visible when the deferred script starts.
      const belowViewport = Array.from(targets).filter((el) => el.getBoundingClientRect().top >= viewportHeight);
      for (const el of belowViewport) {
        if (el.closest('[data-reveal]')) continue; // tránh quan sát hai lần hoặc lồng hiệu ứng
        el.setAttribute('data-reveal', '');
        observer.observe(el);
      }
    }

    observeTargets(document.querySelectorAll(selector));

    if (!liveResults || !window.MutationObserver) return;
    // Bộ lọc thay lưới hiện tại, còn cuộn vô tận thêm thẻ vào lưới.
    const targetsIn = (node, match) => {
      if (node.nodeType !== Node.ELEMENT_NODE) return [];
      const descendants = node.querySelectorAll(match);
      return node.matches(match) ? [node, ...descendants] : descendants;
    };
    new MutationObserver((changes) => {
      const added = [];
      for (const { addedNodes, removedNodes } of changes) {
        for (const node of removedNodes) {
          for (const el of targetsIn(node, '[data-reveal]')) observer.unobserve(el);
        }
        for (const node of addedNodes) {
          if (liveResults.contains(node)) added.push(...targetsIn(node, selector));
        }
      }
      observeTargets(added);
    }).observe(liveResults, { childList: true, subtree: true });
  }

  function setupScrollState() {
    const header = document.querySelector('.site-header');
    const progress = document.querySelector('[data-reading-progress]');
    const article = document.querySelector('[data-reading-article]');
    let ticking = false;

    const update = () => {
      ticking = false;
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);
      if (progress && article) {
        const rect = article.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const ratio = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
        progress.style.transform = `scaleX(${ratio})`;
      }
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  setupReveal();
  setupScrollState();
}());
