// Hiện đủ các mục dịch vụ khi vừa một hàng; chỉ dùng dropdown khi hàng nút thực sự tràn.
(function () {
  'use strict';

  const picker = document.querySelector('[data-service-picker]');
  if (!picker) return;
  const bar = document.querySelector('.service-switcher');
  const tabs = bar && bar.querySelector('.service-tabs');
  if (tabs) {
    const update = () => {
      bar.classList.remove('is-overflowing');
      const overflow = tabs.scrollWidth > tabs.clientWidth + 1;
      bar.classList.toggle('is-overflowing', overflow);
      if (!overflow) picker.open = false;
    };
    update();
    let lastWidth = bar.getBoundingClientRect().width;
    const onResize = () => {
      const width = bar.getBoundingClientRect().width;
      if (width === lastWidth) return;
      lastWidth = width;
      update();
    };
    if (typeof ResizeObserver === 'function') new ResizeObserver(onResize).observe(bar);
    else window.addEventListener('resize', onResize);
    if (document.fonts?.ready) document.fonts.ready.then(update);
  }
  document.addEventListener('click', (e) => { if (picker.open && !picker.contains(e.target)) picker.open = false; });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && picker.open) picker.open = false; });
  document.addEventListener('scroll', (e) => {
    if (picker.open && !(e.target?.nodeType && picker.contains(e.target))) picker.open = false;
  }, { capture: true, passive: true });
}());
