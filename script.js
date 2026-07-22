const profile = window.PROFILE;

const iconLabels = {
  facebook: "f",
  tiktok: "♪",
  telegram: "➤",
  portfolio: "↗",
  email: "@",
  download: "↓"
};

const escapeText = (value) => String(value ?? "");

document.title = profile.name || "Trang cá nhân";
document.querySelector("#profileName").textContent = escapeText(profile.name);
document.querySelector("#profileHandle").textContent = escapeText(profile.handle);
document.querySelector("#profileBio").textContent = escapeText(profile.bio);
document.querySelector("#footerText").textContent = escapeText(profile.footer);

const avatarWrap = document.querySelector("#avatarWrap");
if (profile.avatar) {
  const image = document.createElement("img");
  image.className = "avatar";
  image.src = profile.avatar;
  image.alt = profile.name;
  avatarWrap.append(image);
} else {
  const placeholder = document.createElement("div");
  placeholder.className = "avatar avatar-placeholder";
  placeholder.textContent = profile.initials;
  avatarWrap.append(placeholder);
}

const statusDot = document.createElement("span");
statusDot.className = "status-dot";
statusDot.title = "Đang hoạt động";
avatarWrap.append(statusDot);

const socialRow = document.querySelector("#socialRow");
profile.socials.forEach((item) => {
  const link = document.createElement("a");
  link.className = "social-chip";
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.ariaLabel = item.label;
  link.textContent = iconLabels[item.icon] || "↗";
  socialRow.append(link);
});

const linkList = document.querySelector("#linkList");
profile.links.forEach((item, index) => {
  const link = document.createElement("a");
  link.className = "link-card";
link.href = item.url;

if (item.download) {
  link.download = item.fileName || "";
} else {
  link.target = "_blank";
  link.rel = "noreferrer";
}
  link.style.setProperty("--delay", `${index * 60}ms`);

  const icon = document.createElement("span");
  icon.className = `link-icon link-icon-${item.icon}`;
  icon.textContent = iconLabels[item.icon] || "↗";

  const copy = document.createElement("span");
  copy.className = "link-copy";
  const title = document.createElement("strong");
  title.textContent = item.title;
  const subtitle = document.createElement("small");
  subtitle.textContent = item.subtitle;
  copy.append(title, subtitle);

  const arrow = document.createElement("span");
  arrow.className = "arrow";
  arrow.textContent = item.download ? "↓" : "↗";

  link.append(icon, copy, arrow);
  linkList.append(link);
});

document.querySelector("#shareButton").addEventListener("click", async (event) => {
  const label = event.currentTarget.querySelector("span");
  try {
    if (navigator.share) {
      await navigator.share({ title: document.title, url: location.href });
      return;
    }
    await navigator.clipboard.writeText(location.href);
    label.textContent = "✓";
    setTimeout(() => { label.textContent = "•••"; }, 1600);
  } catch (error) {
    if (error.name !== "AbortError") console.error(error);
  }
});
