import content from './content.js?v=__BUILD__';
const previewModal = document.createElement('div');

previewModal.className = 'preview-modal';
previewModal.hidden = true;
previewModal.innerHTML = `
  <div class="preview-backdrop" data-preview-close></div>
  <section class="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="previewTitle">
    <header class="preview-header">
      <div class="preview-heading">
        <strong id="previewTitle"></strong>
        <small id="previewMeta">Vuốt ngang để xem</small>
      </div>
      <button class="preview-close" type="button" data-preview-close aria-label="Đóng">×</button>
    </header>
    <div class="preview-carousel" tabindex="0"></div>
    <footer class="preview-controls">
      <button class="preview-nav preview-prev" type="button" aria-label="Ảnh trước">‹</button>
      <div class="preview-dots"></div>
      <span class="preview-counter"></span>
      <button class="preview-nav preview-next" type="button" aria-label="Ảnh tiếp theo">›</button>
    </footer>
  </section>
`;

document.body.append(previewModal);

const carousel = previewModal.querySelector('.preview-carousel');
const dots = previewModal.querySelector('.preview-dots');
const counter = previewModal.querySelector('.preview-counter');
const previousButton = previewModal.querySelector('.preview-prev');
const nextButton = previewModal.querySelector('.preview-next');
const closeButton = previewModal.querySelector('.preview-close');
const previewTitle = previewModal.querySelector('#previewTitle');
const previewMeta = previewModal.querySelector('#previewMeta');

let activeIndex = 0;
let lastFocus;
let scrollFrame;
let layoutFrame;
let aligning = false;

function getSlides() {
  return [...carousel.children];
}

function updatePreviewGutters() {
  const slide = carousel.firstElementChild;
  if (!slide) return;
  const padding = Math.max(16, (carousel.clientWidth - slide.offsetWidth) / 2);
  carousel.style.paddingInline = `${padding}px`;
}

function updatePreviewControls(slideCount) {
  counter.textContent = `${activeIndex + 1} / ${slideCount}`;
  previousButton.disabled = activeIndex === 0;
  nextButton.disabled = activeIndex === slideCount - 1;
  [...dots.children].forEach((dot, index) => {
    dot.classList.toggle('active', index === activeIndex);
  });
}

function setActive(index, smooth = true) {
  const slides = getSlides();
  if (!slides.length) return;

  activeIndex = Math.max(0, Math.min(index, slides.length - 1));
  updatePreviewControls(slides.length);

  const slide = slides[activeIndex];
  const left = slide.offsetLeft - (carousel.clientWidth - slide.offsetWidth) / 2;
  carousel.scrollTo({
    left,
    behavior: smooth ? 'smooth' : 'instant'
  });
}

function createPreviewSlide(theme, source, index) {
  const slide = document.createElement('figure');
  const image = document.createElement('img');
  const dot = document.createElement('button');

  slide.className = 'preview-slide';
  image.alt = `${theme.name} · ảnh ${index + 1}`;
  image.decoding = 'async';
  image.loading = 'eager';
  image.src = source;
  slide.append(image);

  dot.type = 'button';
  dot.className = 'preview-dot';
  dot.setAttribute('aria-label', `Xem ảnh ${index + 1}`);
  dot.addEventListener('click', () => setActive(index));
  dots.append(dot);

  return slide;
}

function openPreview(theme) {
  const images = theme?.previewImages?.filter(Boolean) || [];
  if (!images.length) return;

  lastFocus = document.activeElement;
  carousel.replaceChildren();
  dots.replaceChildren();

  previewTitle.textContent = theme.name;
  previewMeta.textContent = `${images.length} ảnh · Vuốt ngang để xem`;

  const slides = images.map((source, index) => {
    return createPreviewSlide(theme, source, index);
  });
  carousel.append(...slides);
  previewModal.hidden = false;
  document.body.classList.add('preview-open');
  previewModal.classList.add('is-open');
  updatePreviewGutters();
  setActive(0, false);
  closeButton.focus();
}

function closePreview() {
  cancelAnimationFrame(scrollFrame);
  cancelAnimationFrame(layoutFrame);
  scrollFrame = 0;
  layoutFrame = 0;
  aligning = false;
  previewModal.classList.remove('is-open');
  document.body.classList.remove('preview-open');
  previewModal.hidden = true;
  carousel.replaceChildren();
  lastFocus?.focus?.();
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-preview-theme]');
  if (!button) return;

  event.preventDefault();
  const themeIndex = Number(button.dataset.previewTheme);
  openPreview(content.themes[themeIndex]);
});

previewModal.querySelectorAll('[data-preview-close]').forEach((element) => {
  element.addEventListener('click', closePreview);
});

previousButton.addEventListener('click', () => setActive(activeIndex - 1));
nextButton.addEventListener('click', () => setActive(activeIndex + 1));

carousel.addEventListener('scroll', () => {
  if (previewModal.hidden || aligning || scrollFrame) return;

  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
    if (previewModal.hidden || aligning) return;
    const slides = getSlides();
    const center = carousel.scrollLeft + carousel.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance >= nearestDistance) return;
      nearestDistance = distance;
      nearestIndex = index;
    });

    if (nearestIndex === activeIndex) return;
    activeIndex = nearestIndex;
    updatePreviewControls(slides.length);
  });
}, { passive: true });

// Giữ ảnh đang chọn khi xoay máy hoặc kích thước cửa sổ thay đổi.
function alignPreview() {
  if (previewModal.hidden) return;
  aligning = true;
  cancelAnimationFrame(layoutFrame);
  layoutFrame = requestAnimationFrame(() => {
    updatePreviewGutters();
    setActive(activeIndex, false);
    layoutFrame = requestAnimationFrame(() => {
      aligning = false;
      layoutFrame = 0;
    });
  });
}
const layoutObserver = new ResizeObserver(alignPreview);
layoutObserver.observe(carousel, { box: 'border-box' });
window.addEventListener('resize', alignPreview);

document.addEventListener('keydown', (event) => {
  if (previewModal.hidden) return;
  if (event.key === 'Escape') closePreview();
  if (event.key === 'ArrowLeft') setActive(activeIndex - 1);
  if (event.key === 'ArrowRight') setActive(activeIndex + 1);
});
