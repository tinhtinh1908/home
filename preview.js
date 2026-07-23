const previewCache = new Map();
let previewImages = [];
let previewIndex = 0;
let lastFocusedElement = null;
let closeTimer = null;
let previewRequestId = 0;

const previewModal = document.createElement("div");
previewModal.className = "preview-modal";
previewModal.hidden = true;
previewModal.innerHTML = `
  <div class="preview-backdrop" data-preview-close></div>
  <section class="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="previewTitle">
    <header class="preview-header">
      <div>
        <strong id="previewTitle">Xem trước</strong>
        <small id="previewCounter"></small>
      </div>
      <button class="preview-close" type="button" data-preview-close aria-label="Đóng">×</button>
    </header>
    <div class="preview-stage">
      <img id="previewImage" alt="Ảnh xem trước" draggable="false" />
      <p id="previewEmpty" hidden>Chưa có ảnh xem trước.</p>
    </div>
    <div class="preview-thumbnails" id="previewThumbnails"></div>
  </section>
`;
document.body.append(previewModal);

const previewImage = previewModal.querySelector("#previewImage");
const previewEmpty = previewModal.querySelector("#previewEmpty");
const previewTitle = previewModal.querySelector("#previewTitle");
const previewCounter = previewModal.querySelector("#previewCounter");
const previewThumbnails = previewModal.querySelector("#previewThumbnails");
const previewStage = previewModal.querySelector(".preview-stage");

const cleanFolderName = (folder) => String(folder || "").replace(/^\/+|\/+$/g, "");

async function loadPreviewImages(folder) {
  const cleanFolder = cleanFolderName(folder);
  if (!cleanFolder) return [];
  if (previewCache.has(cleanFolder)) return previewCache.get(cleanFolder);

  try {
    const response = await fetch(`${cleanFolder}/images.json`, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Không đọc được ${cleanFolder}/images.json`);
    const fileNames = await response.json();
    const images = (Array.isArray(fileNames) ? fileNames : [])
      .filter((fileName) => typeof fileName === "string" && /\.(avif|gif|jpe?g|png|webp)$/i.test(fileName))
      .map((fileName) => `${cleanFolder}/${fileName}`);
    previewCache.set(cleanFolder, images);
    return images;
  } catch (error) {
    console.warn(error.message);
    previewCache.set(cleanFolder, []);
    return [];
  }
}

function renderPreview() {
  const hasImages = previewImages.length > 0;
  previewImage.hidden = !hasImages;
  previewEmpty.hidden = hasImages;
  previewCounter.textContent = hasImages ? `${previewIndex + 1} / ${previewImages.length}` : "";

  if (hasImages) {
    previewImage.style.animation = "none";
    previewImage.src = previewImages[previewIndex];
    requestAnimationFrame(() => {
      previewImage.style.animation = "";
    });
  } else {
    previewImage.removeAttribute("src");
  }

  previewThumbnails.replaceChildren();
  previewImages.forEach((source, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preview-thumb";
    button.classList.toggle("active", index === previewIndex);
    button.setAttribute("aria-label", `Xem ảnh ${index + 1}`);

    const image = document.createElement("img");
    image.src = source;
    image.alt = "";
    button.append(image);
    button.addEventListener("click", () => {
      previewIndex = index;
      renderPreview();
    });
    previewThumbnails.append(button);
  });
}

async function openPreview(item) {
  const requestId = ++previewRequestId;
  clearTimeout(closeTimer);
  lastFocusedElement = document.activeElement;
  previewTitle.textContent = item.title || "Xem trước";
  previewModal.hidden = false;
  document.body.classList.add("preview-open");
  requestAnimationFrame(() => {
    previewModal.classList.add("is-open");
  });
  previewEmpty.hidden = false;
  previewEmpty.textContent = "Đang tải ảnh...";
  previewImage.hidden = true;
  previewThumbnails.replaceChildren();

  previewImages = await loadPreviewImages(item.previewFolder);
  if (requestId !== previewRequestId || previewModal.hidden) return;
  previewIndex = 0;
  previewEmpty.textContent = "Chưa có ảnh xem trước.";
  renderPreview();
  previewModal.querySelector(".preview-close").focus();
}

function closePreview() {
  previewRequestId += 1;
  previewModal.classList.remove("is-open");
  document.body.classList.remove("preview-open");
  closeTimer = setTimeout(() => {
    previewModal.hidden = true;
    lastFocusedElement?.focus?.();
  }, 220);
}

function changePreview(step) {
  if (previewImages.length < 2) return;
  previewIndex = (previewIndex + step + previewImages.length) % previewImages.length;
  renderPreview();
}

profile.links.forEach((item, index) => {
  if (!item.previewFolder) return;
  const card = document.querySelector(`[data-link-index="${index}"]`);
  if (!card) return;

  const previewButton = card.querySelector(".preview-hint");
  if (!previewButton) return;

  previewButton.addEventListener("click", (event) => {
    event.stopPropagation();
    openPreview(item);
  });
});

previewModal.querySelectorAll("[data-preview-close]").forEach((element) => {
  element.addEventListener("click", closePreview);
});

let swipeStartX = null;
let swipeStartY = null;

previewStage.addEventListener("pointerdown", (event) => {
  swipeStartX = event.clientX;
  swipeStartY = event.clientY;
  previewStage.setPointerCapture?.(event.pointerId);
});

previewStage.addEventListener("pointerup", (event) => {
  if (swipeStartX === null || swipeStartY === null) return;
  const distanceX = event.clientX - swipeStartX;
  const distanceY = event.clientY - swipeStartY;
  swipeStartX = null;
  swipeStartY = null;

  if (Math.abs(distanceX) < 45 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
  changePreview(distanceX < 0 ? 1 : -1);
});

previewStage.addEventListener("pointercancel", () => {
  swipeStartX = null;
  swipeStartY = null;
});

document.addEventListener("keydown", (event) => {
  if (previewModal.hidden) return;
  if (event.key === "Escape") closePreview();
  if (event.key === "ArrowLeft") changePreview(-1);
  if (event.key === "ArrowRight") changePreview(1);
});
