// Tương tác trang công khai: menu mobile, slideshow hero, lightbox ảnh, nút lên đầu trang.
(function () {
  'use strict';

  function setupNavToggle() {
    const toggle = document.querySelector('[data-nav-toggle]');
    const nav = document.querySelector('[data-nav]');
    if (!toggle || !nav) return;
    // Menu gập (≤ 1100px) mở như popup dưới header, phía dưới là lớp mờ; trang khoá cuộn (lớp nav-locked trên <html>).
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      document.documentElement.classList.toggle('nav-locked', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    // Bấm một mục (kể cả link #neo trên cùng trang) thì đóng; bấm chỗ không phải link (nút, khoảng trống) thì không
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false); }); /* chạm ngoài menu (lớp mờ = ::after của header) thì đóng; trừ nút ☰ */ document.addEventListener('click', (e) => { if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false); });
    // Màn hình rộng ra quá mốc gập (xoay ngang máy tính bảng): menu thành thanh ngang, bỏ khoá cuộn
    const wide = window.matchMedia('(min-width: 1101px)');
    if (wide.addEventListener) wide.addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    const header = document.querySelector('.site-header');
    const inner = document.querySelector('.header-inner');
    const brand = header && header.querySelector('.brand');
    if (header && inner && brand) {
      const fitNav = () => {
        if (window.innerWidth < 700 || window.innerWidth > 1100) {
          header.classList.remove('has-inline-nav');
          return;
        }
        // Đo menu ở dạng ngang; nhãn dài hoặc phông chữ lớn vẫn dùng menu thu gọn.
        header.classList.add('has-inline-nav');
        const style = getComputedStyle(inner);
        const available = inner.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
        const fits = brand.getBoundingClientRect().width + nav.scrollWidth + 16 <= available;
        header.classList.toggle('has-inline-nav', fits);
        if (fits) setOpen(false);
      };
      fitNav();
      window.addEventListener('resize', fitNav, { passive: true });
      if (document.fonts?.ready) document.fonts.ready.then(fitNav);
    }
  }

  function setupHeroSlideshow() {
    const slides = document.querySelectorAll('[data-hero] .hero-slide');
    if (slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = slides[0].parentElement;
    const wide = window.matchMedia('(min-width: 700px)');
    let current = 0;
    let next = 1;
    let loading = false;
    const isVisible = () => !document.hidden && hero.getBoundingClientRect().bottom > 0;
    const show = (index) => {
      slides[current].classList.remove('is-active');
      slides[index].classList.add('is-active');
      current = index;
    };
    setInterval(() => {
      if (loading || !isVisible()) return;
      const index = next;
      next = (next + 1) % slides.length;
      if (index === current) return;
      const slide = slides[index];
      const { slideSm, slideLg } = slide.dataset;
      if (!slideSm || !slideLg || slide.style.getPropertyValue('--slide-sm')) {
        show(index);
        return;
      }
      loading = true;
      const image = new Image();
      image.fetchPriority = 'low';
      image.onload = () => {
        slide.style.setProperty('--slide-sm', `url(${JSON.stringify(slideSm)})`);
        slide.style.setProperty('--slide-lg', `url(${JSON.stringify(slideLg)})`);
        if (isVisible()) show(index);
        else next = index;
        loading = false;
      };
      image.onerror = () => { loading = false; };
      image.src = wide.matches ? slideLg : slideSm;
    }, 6000);
  }

  function setupLightbox() {
    const modal = document.querySelector('[data-lightbox-modal]');
    if (!modal) return;
    const img = modal.querySelector('[data-lightbox-img]');
    const caption = modal.querySelector('[data-lightbox-caption]');
    const prev = modal.querySelector('[data-lightbox-prev]');
    const next = modal.querySelector('[data-lightbox-next]');
    const closeButton = modal.querySelector('[data-lightbox-close]');
    let returnFocus = null;
    // Danh sách ảnh lấy lúc mở (không cố định lúc tải trang) vì trang Ảnh có thể thay lưới ảnh khi lọc.
    let links = [];
    let index = 0;

    let sliding = false; // đang chuyển ảnh có hiệu ứng: bỏ qua lần bấm thêm để không chồng hiệu ứng

    const setPhoto = (link) => {
      img.src = link.href;
      img.alt = link.title || '';
      caption.textContent = link.title || '';
    };
    const show = (i) => {
      index = (i + links.length) % links.length;
      setPhoto(links[index]);
    };
    const canAnimate = () => typeof img.animate === 'function'
      && !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // Chuyển ảnh trước / sau (nút, phím, vuốt) có hiệu ứng trượt, không nháy:
    // 1) tải + giải mã ảnh mới ở chế độ ẩn (màn hình chưa đổi gì) → 2) ảnh cũ trượt ra, giữ ở đó (fill)
    // → 3) đổi ảnh (đã giải mã nên hiện ngay) → 4) ảnh mới trượt vào từ phía đối diện, rồi bỏ trạng thái "đã trượt ra".
    const step = async (delta) => {
      if (sliding) return;
      if (!canAnimate()) { show(index + delta); return; }
      sliding = true;
      const target = (index + delta + links.length) % links.length;
      const link = links[target];
      const dir = delta > 0 ? 1 : -1; // 1: ảnh sau (cũ ra trái, mới vào từ phải)
      try {
        const preload = new Image();
        preload.src = link.href;
        try { await preload.decode(); } catch (e) { /* ảnh lỗi: vẫn chuyển, trình duyệt hiện ảnh hỏng như thường */ }
        if (modal.hidden) return; // đã đóng trong lúc tải
        const out = img.animate(
          [{ transform: 'none', opacity: 1 }, { transform: `translateX(${-dir * 30}%)`, opacity: 0 }],
          { duration: 170, easing: 'ease-in', fill: 'forwards' },
        );
        await out.finished;
        if (modal.hidden) { out.cancel(); return; }
        index = target;
        setPhoto(link);
        const into = img.animate(
          [{ transform: `translateX(${dir * 30}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 260, easing: 'cubic-bezier(.22, .61, .36, 1)' },
        );
        out.cancel();
        await into.finished;
      } finally {
        sliding = false;
      }
    };
    const close = () => {
      modal.hidden = true; img.removeAttribute('src'); document.documentElement.classList.remove('has-open-dialog');
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-lightbox]');
      if (!link) return;
      e.preventDefault();
      returnFocus = link;
      links = Array.from(document.querySelectorAll('a[data-lightbox]'));
      show(links.indexOf(link));
      const single = links.length < 2;
      if (prev) prev.hidden = single;
      if (next) next.hidden = single;
      modal.hidden = false;
      closeButton?.focus({ preventScroll: true });
      document.documentElement.classList.add('has-open-dialog'); // khoá cuộn trang phía sau
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.hasAttribute('data-lightbox-close')) close();
    });
    if (prev) prev.addEventListener('click', () => step(-1));
    if (next) next.addEventListener('click', () => step(1));
    // Vuốt ngang trên điện thoại: sang trái = ảnh sau, sang phải = ảnh trước (≥ 50px).
    // Bỏ qua khi chạm hai ngón hoặc trang đang phóng to — lúc đó người xem đang kéo ảnh, không phải chuyển ảnh.
    let touchStartX = null;
    modal.addEventListener('touchstart', (e) => {
      touchStartX = e.touches.length === 1 ? e.touches[0].clientX : null;
    }, { passive: true });
    modal.addEventListener('touchend', (e) => {
      const startX = touchStartX;
      touchStartX = null;
      const zoomed = window.visualViewport && window.visualViewport.scale > 1;
      if (startX === null || zoomed || links.length < 2) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) >= 50) step(dx < 0 ? 1 : -1);
    });
    document.addEventListener('keydown', (e) => {
      if (modal.hidden) return;
      if (e.key === 'Tab') {
        const buttons = [closeButton, prev, next].filter((button) => button && !button.hidden);
        const index = buttons.indexOf(document.activeElement);
        if (index < 0 || (e.shiftKey ? index === 0 : index === buttons.length - 1)) {
          e.preventDefault(); buttons[e.shiftKey ? buttons.length - 1 : 0]?.focus({ preventScroll: true });
        }
        return;
      }
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  }

  function setupBackToTop() {
    const button = document.querySelector('[data-back-to-top]');
    if (!button) return;
    const update = () => button.classList.toggle('is-visible', window.scrollY > 500);
    window.addEventListener('scroll', update, { passive: true });
    button.addEventListener('click', () => window.scrollTo({ top: 0 }));
    update();
  }

  // Thông báo nổi (vd. "Cảm ơn bạn!" sau khi gửi ảnh, địa chỉ có ?da-gui=1). Không dùng session: gỡ dấu da-gui khỏi
  // thanh địa chỉ để tải lại không hiện lại; tự mờ rồi biến mất sau 5 giây, bấm × đóng ngay. Không JS: vẫn hiện, đứng yên.
  function setupFlash() {
    const toast = document.querySelector('[data-flash]');
    if (!toast) return;
    const url = new URL(window.location.href);
    url.searchParams.delete('da-gui');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      toast.classList.add('is-hiding');
      setTimeout(() => toast.remove(), 400); // chờ hiệu ứng mờ (CSS .4s)
    };
    setTimeout(close, 5000);
    const closeButton = toast.querySelector('[data-flash-close]');
    if (closeButton) closeButton.addEventListener('click', close);
  }

  // Điện thoại: cụm nút liên hệ nổi thu gọn thành một nút; bấm thì bung Zalo, Facebook, Threads, Gọi điện (CSS ≤ 640px).
  // Gập lại khi bấm lần nữa, nhấn Esc, chạm ra ngoài hoặc bấm một nút liên hệ. Máy tính: nút này bị CSS ẩn, không ảnh hưởng.
  function setupFloatContacts() {
    const box = document.querySelector('[data-float-contacts]');
    if (!box) return;
    const toggle = box.querySelector('[data-float-toggle]');
    if (!toggle) return;
    const setOpen = (open) => {
      box.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', toggle.getAttribute(open ? 'data-label-close' : 'data-label-open'));
    };
    toggle.addEventListener('click', () => setOpen(!box.classList.contains('is-open')));
    document.addEventListener('scroll', () => {
      if (box.classList.contains('is-open')) setOpen(false);
    }, { capture: true, passive: true });
    box.addEventListener('click', (e) => { if (e.target.closest('.float-btn')) setOpen(false); });
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // Chân trang: bản đồ Google nhúng chỉ gắn khi màn hình rộng (CSS ẩn khung ở điện thoại) — điện thoại không tải ngầm
  // bản đồ (~1MB), chỉ dùng link Google Maps. Màn hình rộng ra sau đó (xoay ngang) thì gắn lúc đó, chỉ một lần.
  function setupFooterMap() {
    const box = document.querySelector('[data-map-embed]');
    if (!box) return;
    const wide = window.matchMedia('(min-width: 1025px) and (hover: hover) and (pointer: fine)');
    let loaded = false;
    const load = () => {
      if (loaded) return;
      loaded = true;
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', box.getAttribute('data-map-embed'));
      iframe.setAttribute('title', box.getAttribute('data-map-title'));
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      box.appendChild(iframe);
    };
    if (wide.matches) load();
    else if (wide.addEventListener) wide.addEventListener('change', (e) => { if (e.matches) load(); });
  }

  setupNavToggle();
  setupFooterMap();
  setupHeroSlideshow();
  setupLightbox();
  setupBackToTop();
  setupFlash();
  setupFloatContacts();
}());
