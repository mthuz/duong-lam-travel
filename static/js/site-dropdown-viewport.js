// Dropdown chọn trang/dịch vụ: mở về phía có chỗ, không bị mép màn hình hoặc header che.
(function () {
  'use strict';
  const pickers = document.querySelectorAll('[data-service-picker], [data-category-picker], [data-sort-dropdown]');
  pickers.forEach((picker) => {
    const details = picker.tagName === 'DETAILS';
    const trigger = picker.querySelector('summary, .sort-dropdown-toggle');
    const menu = picker.querySelector('.service-picker-list, .sort-menu');
    if (!trigger || !menu) return;
    let scheduled = false;
    const isOpen = () => details ? picker.open : !picker.classList.contains('is-suppressed') &&
      (picker.classList.contains('is-open') || picker.matches(':hover, :focus-within'));
    function reset() {
      picker.classList.remove('opens-up');
      menu.style.removeProperty('max-height');
    }
    function fit() {
      scheduled = false;
      if (!isOpen()) { reset(); return; }
      const viewport = window.visualViewport;
      const top = viewport?.offsetTop || 0;
      const bottom = top + (viewport?.height || window.innerHeight);
      const header = document.querySelector('.site-header')?.getBoundingClientRect().bottom || top;
      const anchor = trigger.getBoundingClientRect();
      const below = Math.max(0, bottom - anchor.bottom - 8);
      const above = Math.max(0, anchor.top - Math.max(top, header) - 8);
      const up = below < Math.min(260, menu.scrollHeight + 2) && above > below;
      picker.classList.toggle('opens-up', up);
      menu.style.setProperty('max-height', `${Math.max(1, Math.min(260, up ? above : below))}px`);
    }
    function schedule() {
      if (!scheduled) { scheduled = true; requestAnimationFrame(fit); }
    }
    function close(focus = false) {
      if (!isOpen()) return;
      if (details) picker.open = false;
      else {
        picker.classList.remove('is-open');
        picker.classList.add('is-suppressed');
        trigger.setAttribute('aria-expanded', 'false');
      }
      reset();
      if (focus) trigger.focus({ preventScroll: true });
    }
    picker.addEventListener('toggle', schedule);
    picker.addEventListener('click', schedule);
    picker.addEventListener('mouseenter', schedule);
    picker.addEventListener('focusin', schedule);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && isOpen()) {
        event.preventDefault(); event.stopPropagation(); close(true);
      }
    }, true);
    document.addEventListener('scroll', (event) => {
      if (event.target?.nodeType && picker.contains(event.target)) return;
      close();
    }, { capture: true, passive: true });
    window.addEventListener('resize', () => close(), { passive: true });
    window.visualViewport?.addEventListener('resize', () => close(), { passive: true });
    schedule();
  });
}());
