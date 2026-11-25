// Trang Về làng: hàng chuyên mục không vừa một dòng (điện thoại, nhiều chuyên mục / chữ dài) thì gắn .is-overflowing cho thanh
// -> CSS ẩn hàng nút, hiện ô chọn xổ xuống như trang dịch vụ. Vừa thì giữ hàng nút. Không JS: vẫn là hàng nút vuốt ngang.
// Đo lại khi đổi bề ngang (xoay máy, đổi cỡ cửa sổ) và khi phông chữ tải xong (chữ đổi rộng). Ô đang mở: chạm ngoài / Esc thì đóng.
(function () {
  'use strict';

  const bar = document.querySelector('[data-category-overflow]');
  const tabs = bar && bar.querySelector('.category-tabs');
  if (!tabs) return;
  const picker = bar.querySelector('[data-category-picker]');

  // Bỏ lớp để đo đúng hàng nút (đang ẩn thì không đo được), rồi gắn lại nếu tràn — cùng một lượt vẽ nên không nháy.
  function update() {
    bar.classList.remove('is-overflowing');
    bar.classList.toggle('is-overflowing', tabs.scrollWidth > tabs.clientWidth + 1);
  }

  update();
  let lastWidth = bar.getBoundingClientRect().width;
  const onResize = () => {
    const width = bar.getBoundingClientRect().width;
    if (width === lastWidth) return; // chỉ đo lại khi bề ngang đổi (đổi lớp làm thanh cao/thấp, không cần đo lại)
    lastWidth = width;
    update();
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(onResize).observe(bar);
  else window.addEventListener('resize', onResize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);

  if (picker) {
    document.addEventListener('click', (e) => { if (picker.open && !picker.contains(e.target)) picker.open = false; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && picker.open) picker.open = false; });
    document.addEventListener('scroll', (e) => {
      if (picker.open && !(e.target?.nodeType && picker.contains(e.target))) picker.open = false;
    }, { capture: true, passive: true });
  }
}());
