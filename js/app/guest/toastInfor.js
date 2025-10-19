
const ensureContainer = () => {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'toast-container position-fixed top-0 end-0 p-3';
    c.style.zIndex = 1080;
    document.body.appendChild(c);
  }
  return c;
};

const ensureBootstrap = () => {
  // Yêu cầu đã nạp Bootstrap JS bundle (window.bootstrap)
  if (!window.bootstrap || !window.bootstrap.Toast) {
    throw new Error('Bootstrap Toast chưa sẵn sàng. Hãy đảm bảo đã nạp bootstrap.bundle.js trước.');
  }
};

const createToastEl = (message, variant) => {
  const el = document.createElement('div');
  el.className = `toast align-items-center text-bg-${variant} border-0`;
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-live', 'assertive');
  el.setAttribute('aria-atomic', 'true');
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fs-6">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  return el;
};

export const toast = {
  /**
   * Hiển thị toast góc phải trên
   * @param {string} message
   * @param {'success'|'danger'|'warning'|'info'|'primary'|'secondary'|'light'|'dark'} variant
   * @param {number} delay ms
   */
  show(message, variant = 'success', delay = 3500) {
    ensureBootstrap();
    const container = ensureContainer();
    const el = createToastEl(message, variant);
    container.appendChild(el);

    const t = new window.bootstrap.Toast(el, { delay, autohide: true });
    t.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
  },

  // Tuỳ chọn: show nhanh các loại hay dùng
  success(msg, delay = 3500) { this.show(msg, 'success', delay); },
  error(msg, delay = 5000)   { this.show(msg, 'danger', delay); },
  warn(msg, delay = 4000)    { this.show(msg, 'warning', delay); },
  info(msg, delay = 3500)    { this.show(msg, 'info', delay); },
};
export default toast;