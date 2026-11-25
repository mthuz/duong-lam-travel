// Trang Ảnh: popup gửi ảnh, tim ảnh không tải lại trang. Trang bài viết: sao chép link.
(function () {
  'use strict';

  // Popup <dialog>: nút data-open-dialog="<id>" mở, data-close-dialog hoặc bấm ra ngoài thì đóng.
  // Popup mở thì khoá cuộn trang phía sau (lớp has-open-dialog trên <html>, CSS ở site-photo-submission.css).
  // Mở: khoá cuộn trước rồi mới mở popup ở khung hình kế tiếp, để việc tính lại trang không trùng lúc hiệu ứng chạy.
  // Đóng: chạy hiệu ứng đóng (lớp is-closing) xong mới đóng thật; người dùng chọn giảm chuyển động thì đóng ngay.
  function setupDialogs() {
    const page = document.documentElement;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const open = (dialog) => {
      page.classList.add('has-open-dialog');
      requestAnimationFrame(() => dialog.showModal());
    };
    const close = (dialog) => {
      if (!dialog.open || dialog.classList.contains('is-closing')) return;
      if (reduceMotion.matches) { dialog.close(); return; }
      dialog.classList.add('is-closing');
      let timer;
      const finish = (e) => {
        if (e && (e.target !== dialog || e.pseudoElement)) return; // bỏ qua hiệu ứng của nền tối / phần tử con
        dialog.removeEventListener('animationend', finish);
        clearTimeout(timer);
        dialog.classList.remove('is-closing');
        dialog.close();
      };
      dialog.addEventListener('animationend', finish);
      timer = setTimeout(finish, 400); // dự phòng nếu hiệu ứng không chạy
    };
    document.querySelectorAll('[data-open-dialog]').forEach((button) => {
      const dialog = document.getElementById(button.getAttribute('data-open-dialog'));
      if (!dialog || typeof dialog.showModal !== 'function') return;
      button.addEventListener('click', () => open(dialog));
    });
    document.querySelectorAll('dialog').forEach((dialog) => {
      dialog.querySelectorAll('[data-close-dialog]').forEach((b) => b.addEventListener('click', () => close(dialog)));
      dialog.addEventListener('click', (e) => {
        if (e.target !== dialog) return;
        // Native dialog nhận cả click backdrop lẫn padding; chỉ đóng khi tọa độ ở ngoài khung.
        const bounds = dialog.getBoundingClientRect();
        if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) close(dialog);
      });
      // Phím Esc. Bỏ qua "cancel" lan lên từ ô chọn file (khách huỷ / đóng cửa sổ chọn ảnh): popup phải giữ nguyên.
      dialog.addEventListener('cancel', (e) => {
        if (e.target !== dialog) return;
        e.preventDefault();
        close(dialog);
      });
      dialog.addEventListener('close', () => page.classList.remove('has-open-dialog'));
      if (dialog.hasAttribute('data-open-on-load') && typeof dialog.showModal === 'function') open(dialog);
    });
  }

  // Tim ảnh: gửi form bằng fetch, cập nhật số tim tại chỗ. Lỗi mạng thì để form gửi kiểu thường.
  // Lắng nghe ở cấp trang nên ảnh mới thay vào khi lọc (site-gallery-live-filter.js) vẫn tim được.
  function setupPhotoLikes() {
    document.addEventListener('submit', async (e) => {
      const form = e.target.closest('form[data-photo-like]');
      if (!form) return;
      e.preventDefault();
      const button = form.querySelector('button');
      const count = form.querySelector('[data-like-count]');
      button.disabled = true;
      try {
        const res = await fetch(form.action, { method: 'POST', headers: { Accept: 'application/json' }, credentials: 'same-origin' });
        if (res.ok) {
          const { liked, likes } = await res.json();
          button.setAttribute('aria-pressed', String(liked));
          count.textContent = likes;
          button.classList.remove('is-popping');
          if (liked) { void button.offsetWidth; button.classList.add('is-popping'); } // chạy lại hiệu ứng nảy
        }
      } catch (err) {
        form.submit();
      } finally {
        button.disabled = false;
      }
    });
  }

  function setupSharing() {
    document.querySelectorAll('[data-copy-link]').forEach((button) => {
      const note = button.querySelector('.share-copied');
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.copyLink);
        } catch (err) {
          window.prompt('', button.dataset.copyLink); // trình duyệt chặn clipboard (vd. không phải https): cho chép tay
          return;
        }
        note.textContent = button.dataset.copiedLabel;
        button.classList.add('is-copied');
        setTimeout(() => { note.textContent = ''; button.classList.remove('is-copied'); }, 2000);
      });
    });
  }

  // Dropdown sắp xếp trang Ảnh: máy tính mở bằng rê chuột (CSS); điện thoại bấm nút để mở/đóng,
  // bấm ra ngoài hoặc Esc thì đóng.
  function setupSortDropdowns() {
    document.querySelectorAll('[data-sort-dropdown]').forEach((dropdown) => {
      const toggle = dropdown.querySelector('.sort-dropdown-toggle');
      const setOpen = (open) => { if (open) dropdown.classList.remove('is-suppressed'); dropdown.classList.toggle('is-open', open); toggle.setAttribute('aria-expanded', String(open)); };
      toggle.addEventListener('click', () => setOpen(!dropdown.classList.contains('is-open')));
      document.addEventListener('click', (e) => { if (!dropdown.contains(e.target)) setOpen(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setOpen(false); toggle.blur(); } });
      document.addEventListener('scroll', (e) => {
        if (e.target?.nodeType && dropdown.contains(e.target)) return;
        if (!dropdown.classList.contains('is-open') && !dropdown.matches(':hover, :focus-within')) return;
        setOpen(false);
        if (dropdown.contains(document.activeElement)) document.activeElement.blur();
        // CSS còn mở khi hover/focus: tạm chặn đến khi chuột rời hoặc khách bấm mở lại.
        dropdown.classList.add('is-suppressed');
      }, { capture: true, passive: true });
      dropdown.addEventListener('mouseleave', () => dropdown.classList.remove('is-suppressed'));
    });
  }

  setupSortDropdowns();
  setupDialogs();
  setupPhotoLikes();
  setupSharing();
}());
