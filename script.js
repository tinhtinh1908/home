const profile = window.PROFILE;

const iconLabels = {
  facebook: "icon/fb.png",
  tiktok: "icon/tiktok.png",
  telegram: "icon/tele.png",
  portfolio: "",
  theme: "icon/theme.png",
  github: "icon/github.png",
  zalo: "icon/zalo.png",
  lich: "icon/lich.png",
  email: "@",
  download: "↓",
  mtz: "icon/mtz.png",
};

const escapeText = (value) => String(value ?? "");
const releaseNumberFormatter = new Intl.NumberFormat("vi-VN");
const releaseRequestCache = new Map();
const RELEASE_CACHE_TIME = 5 * 60 * 1000;
const THEME_STORAGE_KEY = "dtinh-theme";

function setIcon(element, iconName) {
  const value = iconLabels[iconName] || "X";

  if (!/\.(png|jpe?g|svg|webp)$/i.test(value)) {
    element.textContent = value;
    return;
  }

  const image = document.createElement("img");
  image.src = value;
  image.alt = "";
  image.className = "custom-icon";
  image.draggable = false;

  image.addEventListener("error", () => {
    element.classList.remove("has-custom-icon");
    element.textContent = "X";
  });

  element.classList.add("has-custom-icon");
  element.append(image);
}

function parseGitHubReleaseUrl(value) {
  try {
    const url = new URL(value);

    if (url.hostname !== "github.com") {
      return null;
    }

    const taggedRelease = url.pathname.match(
      /^\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.+)$/
    );

    if (taggedRelease) {
      return {
        owner: decodeURIComponent(taggedRelease[1]),
        repo: decodeURIComponent(taggedRelease[2]),
        tag: decodeURIComponent(taggedRelease[3]),
        assetName: decodeURIComponent(taggedRelease[4]),
        latest: false
      };
    }

    const latestRelease = url.pathname.match(
      /^\/([^/]+)\/([^/]+)\/releases\/latest\/download\/(.+)$/
    );

    if (!latestRelease) {
      return null;
    }

    return {
      owner: decodeURIComponent(latestRelease[1]),
      repo: decodeURIComponent(latestRelease[2]),
      assetName: decodeURIComponent(latestRelease[3]),
      latest: true
    };
  } catch (error) {
    return null;
  }
}

function getStoredRelease(key) {
  try {
    const cached = JSON.parse(localStorage.getItem(key));

    if (
      !cached ||
      Date.now() - cached.savedAt > RELEASE_CACHE_TIME
    ) {
      return null;
    }

    return cached.data;
  } catch (error) {
    return null;
  }
}

function storeRelease(key, data) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data
      })
    );
  } catch (error) {
    // Web vẫn chạy nếu trình duyệt chặn localStorage.
  }
}

async function getReleaseData(release) {
  const endpoint = release.latest
    ? `https://api.github.com/repos/${encodeURIComponent(
        release.owner
      )}/${encodeURIComponent(
        release.repo
      )}/releases/latest`
    : `https://api.github.com/repos/${encodeURIComponent(
        release.owner
      )}/${encodeURIComponent(
        release.repo
      )}/releases/tags/${encodeURIComponent(release.tag)}`;

  const storageKey = `github-release:${endpoint}`;
  const stored = getStoredRelease(storageKey);

  if (stored) {
    return stored;
  }

  if (releaseRequestCache.has(endpoint)) {
    return releaseRequestCache.get(endpoint);
  }

  const request = fetch(endpoint)
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `GitHub API trả về ${response.status}`
        );
      }

      return response.json();
    })
    .then((data) => {
      storeRelease(storageKey, data);
      return data;
    });

  releaseRequestCache.set(endpoint, request);

  try {
    return await request;
  } catch (error) {
    releaseRequestCache.delete(endpoint);
    throw error;
  }
}

async function loadDownloadCount(item, counter) {
  const release = parseGitHubReleaseUrl(item.url);

  if (!release) {
    counter.hidden = true;
    return;
  }

  try {
    const data = await getReleaseData(release);

    const asset = (data.assets || []).find(
      (entry) => entry.name === release.assetName
    );

    if (!asset) {
      throw new Error(
        "Không tìm thấy file trong Release"
      );
    }

    const number = releaseNumberFormatter.format(
      asset.download_count || 0
    );

    counter.textContent = `${number} lượt tải`;
    counter.dataset.state = "ready";
  } catch (error) {
    counter.textContent = "— lượt tải";
    counter.dataset.state = "error";
    console.warn(error.message);
  }
}

function renderAvatar() {
  const avatarWrap =
    document.querySelector("#avatarWrap");

  if (profile.avatar) {
    const image = document.createElement("img");

    image.className = "avatar";
    image.src = profile.avatar;
    image.alt =
      profile.name || "Ảnh đại diện";

    avatarWrap.append(image);
  } else {
    const placeholder =
      document.createElement("div");

    placeholder.className =
      "avatar avatar-placeholder";

    placeholder.textContent =
      profile.initials || "";

    avatarWrap.append(placeholder);
  }

  const statusDot =
    document.createElement("span");

  statusDot.className = "status-dot";
  statusDot.title = "Đang hoạt động";

  avatarWrap.append(statusDot);
}

function renderSocials() {
  const socialRow =
    document.querySelector("#socialRow");

  (profile.socials || []).forEach((item, index) => {
    const link = document.createElement("a");

    link.className = "social-chip";
    link.style.setProperty("--social-delay", `${index * 55}ms`);
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noreferrer";

    link.setAttribute(
      "aria-label",
      item.label || "Liên kết"
    );

    setIcon(link, item.icon);
    socialRow.append(link);
  });
}

function createCardContent(item) {
  const icon = document.createElement("span");

  icon.className =
    `link-icon link-icon-${item.icon || "default"}`;

  setIcon(icon, item.icon);

  const copy = document.createElement("span");
  copy.className = "link-copy";

  const title = document.createElement("strong");
  title.textContent = escapeText(item.title);

  const subtitle = document.createElement("small");
  subtitle.className = "link-subtitle";
  subtitle.textContent = escapeText(item.subtitle);

  copy.append(title, subtitle);

  if (item.previewFolder) {
    const previewHint = document.createElement("button");
    previewHint.type = "button";
    previewHint.className = "preview-hint";
    previewHint.textContent = "Nhấn để xem ảnh preview";
    previewHint.setAttribute("aria-label", `Xem ảnh preview ${item.title}`);
    copy.append(previewHint);
  }

  return {
    icon,
    copy
  };
}

function renderLinks() {
  const linkList =
    document.querySelector("#linkList");

  (profile.links || []).forEach(
    (item, index) => {
      /*
       * Chỉ download: true mới có nút tải.
       *
       * download: false hoặc không khai báo:
       * không mở URL, chỉ preview nếu có.
       *
       * Muốn card liên kết bình thường:
       * khai báo link: true.
       */
      const downloadEnabled =
        item.download === true;

      const normalLink =
        !downloadEnabled &&
        item.link === true;

      const card = document.createElement(
        normalLink ? "a" : "div"
      );

      if (downloadEnabled) {
        card.className =
          "link-card has-download";
      } else if (normalLink) {
        card.className = "link-card";
      } else {
        card.className =
          "link-card download-disabled";
      }

      card.style.setProperty(
        "--delay",
        `${index * 60}ms`
      );

      card.dataset.linkIndex = index;

      if (normalLink) {
        card.href = item.url;

        if (
          !String(item.url || "").startsWith(
            "mailto:"
          )
        ) {
          card.target = "_blank";
          card.rel = "noreferrer";
        }
      }

      const {
        icon,
        copy
      } = createCardContent(item);

      if (downloadEnabled) {
        const downloadCount =
          document.createElement("small");

        downloadCount.className =
          "download-count";

        downloadCount.textContent =
          "Đang lấy lượt tải...";

        downloadCount.dataset.state =
          "loading";

        copy.append(downloadCount);

        const downloadButton =
          document.createElement("a");

        downloadButton.className =
          "download-button";

        downloadButton.href = item.url;
        downloadButton.textContent = "Tải về";

        downloadButton.setAttribute(
          "aria-label",
          `Tải xuống ${item.title}`
        );

        if (
          /^https?:\/\//i.test(item.url || "")
        ) {
          downloadButton.target = "_blank";
          downloadButton.rel = "noreferrer";
        }

        downloadButton.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();
          }
        );

        card.append(
          icon,
          copy,
          downloadButton
        );

        loadDownloadCount(
          item,
          downloadCount
        );
      } else if (normalLink) {
        const arrow =
          document.createElement("span");

        arrow.className = "arrow";
        arrow.textContent = "X";

        card.append(icon, copy, arrow);
      } else {
        /*
         * download false hoặc không khai báo:
         * không gắn href và không mở link.
         *
         * preview.js vẫn xử lý khi item có:
         * previewFolder: "foldertest1"
         */
        card.append(icon, copy);
      }

      linkList.append(card);
    }
  );
}

function renderProfile() {
  document.title =
    profile.name || "Trang cá nhân";

  document.querySelector(
    "#profileName"
  ).textContent = escapeText(profile.name);

  document.querySelector(
    "#profileHandle"
  ).textContent = escapeText(profile.handle);

  document.querySelector(
    "#profileBio"
  ).textContent = escapeText(profile.bio);

  document.querySelector(
    "#footerText"
  ).textContent = escapeText(profile.footer);

  renderAvatar();
  renderSocials();
  renderLinks();
}

function setupTheme() {
  const themeButton = document.querySelector("#themeButton");
  const themeColor = document.querySelector('meta[name="theme-color"]');

  if (!themeButton) return;

  const updateThemeButton = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    const nextTheme = dark ? "sáng" : "tối";

    themeButton.setAttribute("aria-label", `Chuyển sang chế độ ${nextTheme}`);
    themeButton.title = `Chế độ ${nextTheme}`;
    themeButton.dataset.mode = dark ? "dark" : "light";

    if (themeColor) {
      themeColor.content = dark ? "#080b11" : "#eef6ff";
    }
  };

  themeButton.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const next = current === "dark" ? "light" : "dark";

    document.documentElement.classList.add("theme-changing");
    document.documentElement.dataset.theme = next;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Giao diện vẫn đổi nếu trình duyệt chặn localStorage.
    }

    updateThemeButton();
    setTimeout(() => {
      document.documentElement.classList.remove("theme-changing");
    }, 420);
  });

  updateThemeButton();
}

document
  .querySelector("#shareButton")
  .addEventListener(
    "click",
    async (event) => {
      const label =
        event.currentTarget.querySelector(
          "span"
        );

      try {
        if (navigator.share) {
          await navigator.share({
            title: document.title,
            url: location.href
          });

          return;
        }

        await navigator.clipboard.writeText(
          location.href
        );

        label.textContent = "✓";

        setTimeout(() => {
          label.textContent = "•••";
        }, 1600);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
        }
      }
    }
  );

setupTheme();
renderProfile();
