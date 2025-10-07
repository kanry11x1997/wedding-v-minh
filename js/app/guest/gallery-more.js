export const galleryMore = (() => {
  /** @type {{images:string[], inserted:number, ready:boolean}} */
  const state = { images: [], inserted: 0, ready: false };

  /** @type {{grid:HTMLElement|null, btn:HTMLButtonElement|null, hint:HTMLElement|null}} */
  const dom = { grid: null, btn: null, hint: null };

  // Tùy chọn mặc định
  const defaults = {
    gridSelector: '.gallery-grid',
    buttonSelector: '#btn-more-photos',
    hintSelector: '#more-hint',
    manifestUrl: './assets/images/data_Images/gallery.json',
    batchSize: 10,
    placeholder: './assets/images/placeholder.webp'
  };

  let opt = { ...defaults };

  // --- Lazy loader ---
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            const img = /** @type {HTMLImageElement} */(e.target);
            const ds = img.getAttribute('data-src');
            if (ds) { img.src = ds; img.removeAttribute('data-src'); }
            io.unobserve(img);
          }
        });
      }, { rootMargin: '200px' })
    : null;

  /** @param {string} src @param {string} alt */
  const createCard = (src, alt) => {
    const col = document.createElement('div');
    col.className = 'col';
    const fig = document.createElement('figure');
    fig.className = 'gallery-card';

    const img = document.createElement('img');
    img.className = 'w-100 h-100 rounded-4 shadow-sm gallery-img cursor-pointer';
    img.loading = 'lazy';
    img.src = opt.placeholder;
    img.setAttribute('data-src', src);
    img.alt = alt || 'Ảnh cưới';
    img.onclick = function () {
      // dùng modal sẵn có
      if (window.undangan?.guest?.modal) window.undangan.guest.modal(this);
    };

    fig.appendChild(img);
    col.appendChild(fig);

    if (io) io.observe(img);
    else { const ds = img.getAttribute('data-src'); if (ds) { img.src = ds; img.removeAttribute('data-src'); } }

    return col;
  };

  const setHint = (msg) => { if (dom.hint) dom.hint.textContent = msg; };

  const ensureManifest = async () => {
    if (state.ready) return;
    try {
      const res = await fetch(opt.manifestUrl, { cache: 'no-cache' });
      const data = await res.json();
      state.images = Array.isArray(data.images) ? data.images : [];
      state.ready = true;
    } catch (e) {
      console.error('[gallery-more] manifest error', e);
      state.ready = true;
      state.images = [];
      setHint('Không tải được danh sách ảnh.');
    }
  };

  const clickMore = async () => {
    if (!dom.grid || !dom.btn) return;

    dom.btn.disabled = true;
    const sp = dom.btn.querySelector('.spinner-border');
    if (sp) sp.classList.remove('d-none');

    await ensureManifest();

    const start = state.inserted;
    const end   = Math.min(start + opt.batchSize, state.images.length);
    const batch = state.images.slice(start, end);

    if (batch.length === 0) {
      if (sp) sp.classList.add('d-none');
      dom.btn.classList.add('disabled');
      dom.btn.textContent = 'Xem tiếp ở phía dưới!';
      return;
    }

    const frag = document.createDocumentFragment();
    batch.forEach((src, i) => frag.appendChild(createCard(src, `Ảnh cưới ${start + i + 7}`)));
    dom.grid.appendChild(frag);

    state.inserted += batch.length;

    if (sp) sp.classList.add('d-none');
    dom.btn.disabled = false;

    if (state.inserted >= state.images.length) {
      dom.btn.classList.add('disabled');
      dom.btn.textContent = 'Xem tiếp ở phía dưới!';
    }
  };

  const bind = () => {
    dom.btn?.addEventListener('click', clickMore, { passive: true });
    // preload manifest nhẹ sau khi mở thiệp (đúng flow app)
    document.addEventListener('undangan.open', () => ensureManifest(), { once: true });
  };

  const init = (options = {}) => {
    opt = { ...defaults, ...options };
    dom.grid = document.querySelector(opt.gridSelector);
    dom.btn  = document.querySelector(opt.buttonSelector);
    dom.hint = document.querySelector(opt.hintSelector);

    if (!dom.grid || !dom.btn) {
      console.warn('[gallery-more] Không tìm thấy grid hoặc nút.');
      return { loadMore: () => {}, reload: () => {} };
    }

    bind();
    return {
      loadMore: clickMore,
      reload: () => { state.images = []; state.inserted = 0; state.ready = false; ensureManifest(); }
    };
  };

  return { init };
})();
