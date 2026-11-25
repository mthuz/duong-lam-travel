// Thanh dính dưới header (trang Ảnh: thanh gửi ảnh / tìm kiếm; trang Về làng: menu chuyên mục). Ảnh / thẻ bài cuộn
// chui xuống dưới thanh bị mép thanh cắt thẳng, trông vuông góc. Ở đây gắn ngay dưới mép thanh, tại hai mép mỗi cột lưới,
// một "góc lõm" màu nền (CSS .sticky-bar-corners): phần lộ ra dưới thanh luôn bo tròn như góc ảnh / thẻ; khe giữa các cột
// và hai bên lưới có dải mờ dần che vệt mép thanh cắt ngang bóng đổ. Các góc nằm trong thanh nên cuộn cùng thanh, mượt
// như thanh — JS chỉ đặt vị trí cột khi tải trang, đổi cỡ màn hình, thay lưới; không chạy khi cuộn. Không JS: cắt thẳng.
// Khai báo trên thanh: data-rounded-edge-grid="<lưới>" data-rounded-edge-item="<phần tử bo góc trong lưới>".
(function () {
  'use strict';

  const SHADOW_SPREAD = 32; // bóng đổ loang ra hai bên chừng này
  const px = (x) => Math.round(x * 100) / 100; // giữ lẻ pixel: cột lưới có thể bắt đầu ở x.5
  const span = (className, left, width, height) => {
    const el = document.createElement('span');
    el.className = className;
    Object.assign(el.style, { left: `${px(left)}px`, width: `${px(width)}px` }, height ? { height: `${height}px` } : {});
    return el;
  };

  function setup(bar) {
    const layer = bar.appendChild(document.createElement('div'));
    layer.className = 'sticky-bar-corners';
    layer.setAttribute('aria-hidden', 'true');
    const gridSelector = bar.getAttribute('data-rounded-edge-grid');
    const itemSelector = bar.getAttribute('data-rounded-edge-item');

    // Cột lấy từ khung lưới (grid-template-columns + khoảng cách cột), không từ từng phần tử: phần tử đang chạy hiệu ứng
    // hiện dần hay nổi lên khi rê chuột thì bị dịch, đọc vị trí sẽ sai. Toạ độ tính theo mép trái thanh.
    function place() {
      const grid = document.querySelector(gridSelector);
      const item = grid && grid.querySelector(itemSelector);
      if (!item) { layer.replaceChildren(); return; }
      const style = window.getComputedStyle(grid);
      const r = parseFloat(window.getComputedStyle(item).borderTopLeftRadius) || 0;
      const gap = parseFloat(style.columnGap) || 0;
      let x = grid.getBoundingClientRect().left - bar.getBoundingClientRect().left;
      const parts = [span('is-gap', x - SHADOW_SPREAD, SHADOW_SPREAD)];
      style.gridTemplateColumns.split(' ').map(parseFloat).forEach((w, i, all) => {
        parts.push(span('is-left', x, r, r), span('is-right', x + w - r, r, r));
        parts.push(span('is-gap', x + w, i < all.length - 1 ? gap : SHADOW_SPREAD));
        x += w + gap;
      });
      layer.replaceChildren(...parts);
    }

    window.addEventListener('resize', place);
    window.addEventListener('load', place); // ảnh/phông tải xong có thể làm lưới đổi cột
    document.addEventListener('gallery:updated', place); // trang Ảnh: lọc / sang trang thay lưới
    place();
  }

  document.querySelectorAll('[data-rounded-edge-grid]').forEach(setup);
}());
