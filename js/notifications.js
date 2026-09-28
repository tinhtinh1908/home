
const toast = document.querySelector('.toast');
let toastTimer;

document.body.append(toast);

export function showToast(message, duration = 1800) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

window.addEventListener('hyperos-native-message', (event) => {
  showToast(event.detail?.message || 'Không thể thực hiện thao tác', 2400);
});

