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
let closeTimer;
let imageObserver;

function loadImage(image) {
  if (!image?.dataset.src) return;
  image.src = image.dataset.src;
  delete image.dataset.src;
}

function getSlides() {
  return [...carousel.children];
}

function updatePreviewControls(slideCount) {
  counter.textContent = `${activeIndex + 1} / ${slideCount}`;
  previousButton.disabled = activeIndex === 0;
  nextButton.disabled = activeIndex === slideCount - 1;
  [...dots.children].forEach((dot, index) => {
    dot.classList.toggle('active', index === activeIndex);
  });
}

function warmNearby(index) {
  const slides = getSlides();
  [index - 1, index, index + 1].forEach((slideIndex) => {
    loadImage(slides[slideIndex]?.querySelector('img'));
  });
}

function setActive(index, smooth = true) {
  const slides = getSlides();
  if (!slides.length) return;

  activeIndex = Math.max(0, Math.min(index, slides.length - 1));
  warmNearby(activeIndex);
  updatePreviewControls(slides.length);

  const slide = slides[activeIndex];
  const left = slide.offsetLeft - (carousel.clientWidth - slide.offsetWidth) / 2;
  carousel.scrollTo({
    left,
    behavior: smooth ? 'smooth' : 'auto'
  });
}

function createPreviewSlide(theme, source, index) {
  const slide = document.createElement('figure');
  const image = document.createElement('img');
  const dot = document.createElement('button');

  slide.className = 'preview-slide';
  image.alt = `${theme.name} · ảnh ${index + 1}`;
  image.decoding = 'async';
  image.loading = 'lazy';
  image.dataset.src = source;
  image.addEventListener('load', () => slide.classList.add('is-loaded'), { once: true });
  image.addEventListener('error', () => slide.classList.add('is-error'), { once: true });
  slide.append(image);

  dot.type = 'button';
  dot.className = 'preview-dot';
  dot.setAttribute('aria-label', `Xem ảnh ${index + 1}`);
  dot.addEventListener('click', () => setActive(index));
  dots.append(dot);

  if (imageObserver) imageObserver.observe(image);
  return slide;
}

function openPreview(theme) {
  if (!theme?.previewImages?.length) return;

  clearTimeout(closeTimer);
  lastFocus = document.activeElement;
  carousel.replaceChildren();
  dots.replaceChildren();
  imageObserver?.disconnect();

  imageObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadImage(entry.target);
          imageObserver.unobserve(entry.target);
        });
      }, { root: carousel, rootMargin: '0px 75%' })
    : null;

  previewTitle.textContent = theme.name;
  previewMeta.textContent = `${theme.previewImages.length} ảnh · Vuốt ngang để xem`;

  const slides = theme.previewImages.map((source, index) => {
    return createPreviewSlide(theme, source, index);
  });
  carousel.append(...slides);

  if (!imageObserver) {
    carousel.querySelectorAll('img').forEach(loadImage);
  }

  warmNearby(0);
  previewModal.hidden = false;
  document.body.classList.add('preview-open');
  requestAnimationFrame(() => {
    previewModal.classList.add('is-open');
    setActive(0, false);
  });
  closeButton.focus();
}

function closePreview() {
  previewModal.classList.remove('is-open');
  document.body.classList.remove('preview-open');
  imageObserver?.disconnect();
  imageObserver = null;

  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    previewModal.hidden = true;
    carousel.replaceChildren();
    lastFocus?.focus?.();
  }, 180);
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-preview-theme]');
  if (!button) return;

  event.preventDefault();
  const themeIndex = Number(button.dataset.previewTheme);
  openPreview(window.WEB_CONTENT.themes[themeIndex]);
});

previewModal.querySelectorAll('[data-preview-close]').forEach((element) => {
  element.addEventListener('click', closePreview);
});

previousButton.addEventListener('click', () => setActive(activeIndex - 1));
nextButton.addEventListener('click', () => setActive(activeIndex + 1));

carousel.addEventListener('scroll', () => {
  if (scrollFrame) return;

  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = 0;
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
    warmNearby(activeIndex);
    updatePreviewControls(slides.length);
  });
}, { passive: true });

document.addEventListener('keydown', (event) => {
  if (previewModal.hidden) return;
  if (event.key === 'Escape') closePreview();
  if (event.key === 'ArrowLeft') setActive(activeIndex - 1);
  if (event.key === 'ArrowRight') setActive(activeIndex + 1);
});
