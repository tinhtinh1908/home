const previewCache = new Map();
let previewItems = [];
let previewIndex = 0;
let previewRequestId = 0;
let closeTimer = null;
let scrollFrame = null;
let lastFocusedElement = null;

const previewModal = document.createElement("div");
previewModal.className = "preview-modal";
previewModal.hidden = true;
previewModal.innerHTML = `
  <div class="preview-backdrop" data-preview-close></div>
  <section
    class="preview-dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="previewTitle"
  >
    <header class="preview-header">
      <div class="preview-heading">
        <strong id="previewTitle">Ảnh xem trước</strong>
        <small id="previewMeta">Vuốt ngang để xem</small>
      </div>
      <button
        class="preview-close"
        type="button"
        data-preview-close
        aria-label="Đóng ảnh xem trước"
      >×</button>
    </header>

    <div
      class="preview-carousel"
      id="previewCarousel"
      tabindex="0"
      aria-label="Danh sách ảnh xem trước"
    ></div>

    <div class="preview-empty" id="previewEmpty" hidden>
      <span class="preview-loader" aria-hidden="true"></span>
      <p>Đang tải ảnh...</p>
    </div>

    <footer class="preview-controls">
      <button
        class="preview-nav"
        id="previewPrevious"
        type="button"
        aria-label="Ảnh trước"
      >‹</button>

      <div class="preview-dots" id="previewDots" aria-label="Chọn ảnh"></div>
      <span class="preview-counter" id="previewCounter"></span>

      <button
        class="preview-nav"
        id="previewNext"
        type="button"
        aria-label="Ảnh tiếp theo"
      >›</button>
    </footer>
  </section>
`;
document.body.append(previewModal);

const previewCarousel = previewModal.querySelector("#previewCarousel");
const previewEmpty = previewModal.querySelector("#previewEmpty");
const previewTitle = previewModal.querySelector("#previewTitle");
const previewMeta = previewModal.querySelector("#previewMeta");
const previewDots = previewModal.querySelector("#previewDots");
const previewCounter = previewModal.querySelector("#previewCounter");
const previousButton = previewModal.querySelector("#previewPrevious");
const nextButton = previewModal.querySelector("#previewNext");
const closeButton = previewModal.querySelector(".preview-close");

const cleanFolderName = (folder) =>
  String(folder || "").replace(/^\/+|\/+$/g, "");

async function loadPreviewImages(folder) {
  const cleanFolder = cleanFolderName(folder);

  if (!cleanFolder) return [];
  if (previewCache.has(cleanFolder)) {
    return previewCache.get(cleanFolder);
  }

  try {
    const response = await fetch(`${cleanFolder}/images.json`, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`Không đọc được ${cleanFolder}/images.json`);
    }

    const fileNames = await response.json();
    const images = (Array.isArray(fileNames) ? fileNames : [])
      .filter(
        (fileName) =>
          typeof fileName === "string" &&
          /\.(avif|gif|jpe?g|png|webp)$/i.test(fileName)
      )
      .map((fileName) => `${cleanFolder}/${fileName}`);

    previewCache.set(cleanFolder, images);
    return images;
  } catch (error) {
    console.warn(error.message);
    return [];
  }
}

function updatePreviewState(index) {
  if (!previewItems.length) return;

  previewIndex = Math.max(0, Math.min(index, previewItems.length - 1));
  previewCounter.textContent = `${previewIndex + 1} / ${previewItems.length}`;
  previousButton.disabled = previewIndex === 0;
  nextButton.disabled = previewIndex === previewItems.length - 1;

  previewDots.querySelectorAll(".preview-dot").forEach((dot, dotIndex) => {
    const active = dotIndex === previewIndex;
    dot.classList.toggle("active", active);
    dot.setAttribute("aria-current", active ? "true" : "false");
  });
}

function goToPreview(index, smooth = true) {
  const slides = previewCarousel.querySelectorAll(".preview-slide");
  const slide = slides[index];

  if (!slide) return;

  updatePreviewState(index);
  const left =
    slide.offsetLeft -
    (previewCarousel.clientWidth - slide.offsetWidth) / 2;

  previewCarousel.scrollTo({
    left: Math.max(0, left),
    behavior: smooth ? "smooth" : "auto",
  });
}

function buildPreviewCarousel(images) {
  previewCarousel.replaceChildren();
  previewDots.replaceChildren();
  previewItems = images;
  previewIndex = 0;

  images.forEach((source, index) => {
    const slide = document.createElement("figure");
    slide.className = "preview-slide";
    slide.dataset.previewIndex = index;

    const image = document.createElement("img");
    image.src = source;
    image.alt = `Ảnh xem trước ${index + 1}`;
    image.width = 858;
    image.height = 1908;
    image.draggable = false;
    image.decoding = "async";
    image.loading = index < 2 ? "eager" : "lazy";

    if (index === 0) {
      image.fetchPriority = "high";
    }

    image.addEventListener(
      "load",
      () => slide.classList.add("is-loaded"),
      { once: true }
    );

    image.addEventListener(
      "error",
      () => {
        slide.classList.add("is-error");
        slide.setAttribute("aria-label", "Không tải được ảnh");
      },
      { once: true }
    );

    slide.append(image);
    previewCarousel.append(slide);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "preview-dot";
    dot.setAttribute("aria-label", `Xem ảnh ${index + 1}`);
    dot.addEventListener("click", () => goToPreview(index));
    previewDots.append(dot);
  });

  updatePreviewState(0);
  requestAnimationFrame(() => goToPreview(0, false));
}

async function openPreview(item) {
  const requestId = ++previewRequestId;

  clearTimeout(closeTimer);
  lastFocusedElement = document.activeElement;
  previewTitle.textContent = item.title || "Ảnh xem trước";
  previewMeta.textContent = "Vuốt ngang để xem";
  previewCounter.textContent = "";
  previewCarousel.replaceChildren();
  previewDots.replaceChildren();
  previewCarousel.hidden = true;
  previewEmpty.hidden = false;
  previewEmpty.querySelector("p").textContent = "Đang tải ảnh...";
  previewModal.hidden = false;
  document.body.classList.add("preview-open");

  requestAnimationFrame(() => {
    previewModal.classList.add("is-open");
  });

  const images = await loadPreviewImages(item.previewFolder);

  if (requestId !== previewRequestId || previewModal.hidden) return;

  if (!images.length) {
    previewEmpty.querySelector("p").textContent = "Chưa có ảnh xem trước.";
    previewEmpty.classList.add("is-empty");
    previousButton.hidden = true;
    nextButton.hidden = true;
    previewMeta.textContent = "Không tìm thấy ảnh";
  } else {
    previewEmpty.hidden = true;
    previewEmpty.classList.remove("is-empty");
    previewCarousel.hidden = false;
    previousButton.hidden = images.length < 2;
    nextButton.hidden = images.length < 2;
    previewMeta.textContent = `${images.length} ảnh · Vuốt ngang để xem`;
    buildPreviewCarousel(images);
  }

  closeButton.focus();
}

function closePreview() {
  previewRequestId += 1;
  previewModal.classList.remove("is-open");
  document.body.classList.remove("preview-open");

  closeTimer = setTimeout(() => {
    previewModal.hidden = true;
    lastFocusedElement?.focus?.();
  }, 180);
}

profile.links.forEach((item, index) => {
  if (!item.previewFolder) return;

  const card = document.querySelector(`[data-link-index="${index}"]`);
  const previewButton = card?.querySelector(".preview-hint");

  if (!previewButton) return;

  previewButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openPreview(item);
  });
});

previewCarousel.addEventListener(
  "scroll",
  () => {
    if (scrollFrame || !previewItems.length) return;

    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      const viewportCenter =
        previewCarousel.scrollLeft + previewCarousel.clientWidth / 2;

      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      previewCarousel
        .querySelectorAll(".preview-slide")
        .forEach((slide, index) => {
          const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
          const distance = Math.abs(slideCenter - viewportCenter);

          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

      if (closestIndex !== previewIndex) {
        updatePreviewState(closestIndex);
      }
    });
  },
  { passive: true }
);

previousButton.addEventListener("click", () => {
  goToPreview(previewIndex - 1);
});

nextButton.addEventListener("click", () => {
  goToPreview(previewIndex + 1);
});

previewModal.querySelectorAll("[data-preview-close]").forEach((element) => {
  element.addEventListener("click", closePreview);
});

document.addEventListener("keydown", (event) => {
  if (previewModal.hidden) return;

  if (event.key === "Escape") closePreview();
  if (event.key === "ArrowLeft") goToPreview(previewIndex - 1);
  if (event.key === "ArrowRight") goToPreview(previewIndex + 1);
});
