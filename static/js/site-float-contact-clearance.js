// Nhường chỗ cho các liên kết/nút liên hệ trong trang, giữ nguyên vị trí cụm nút nổi.
(function () {
  'use strict';
  const box = document.querySelector('[data-float-contacts]');
  if (!box) return;
  const controls = [...box.querySelectorAll('.float-toggle, .float-call')];
  const targets = [...document.querySelectorAll('.contact-card, .service-actions, .cta-actions, .contact-service-grid, .footer-social, .footer-map-link')];
  if (!controls.length || !targets.length) return;
  const toggle = box.querySelector('[data-float-toggle]');
  let frame = null;

  function update() {
    frame = null;
    // Không làm mất focus khi người dùng đang thao tác bằng bàn phím.
    const focused = box.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
    const buttons = controls.map((el) => el.getBoundingClientRect());
    const obscured = !focused && targets.some((el) => {
      const area = el.getBoundingClientRect();
      return area.width > 0 && area.height > 0 && buttons.some((button) =>
        button.width > 0 && button.height > 0 && button.left < area.right + 8 &&
        button.right > area.left - 8 && button.top < area.bottom + 8 && button.bottom > area.top - 8);
    });
    box.classList.toggle('is-obscuring-contact', obscured);
    if (obscured) {
      box.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
      if (toggle) toggle.setAttribute('aria-label', toggle.getAttribute('data-label-open'));
    }
  }
  function schedule() {
    if (frame === null) frame = requestAnimationFrame(update);
  }
  document.addEventListener('scroll', schedule, { capture: true, passive: true });
  document.addEventListener('focusout', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', schedule, { passive: true });
  document.fonts?.ready.then(schedule);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(schedule);
    targets.forEach((target) => observer.observe(target));
  }
  schedule();
}());
