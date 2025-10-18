export const confirmInfo = {
  init: function() {
    const el = (id)=>document.getElementById(id);
    const btnGroom = el('btn-rsvp-groom');
    const btnBride = el('btn-rsvp-bride');
    const card = el('rsvp-card');
    const sideBadge = el('rsvp-side');
    const inputSide = el('input-side');
    const form = el('rsvp-form');
    const alertBox = el('rsvp-alert');
    const btnClose = el('rsvp-close');

    if(!btnGroom || !btnBride || !card) return;

    const setSide = (side) => {
      inputSide.value = side;               // groom | bride
      sideBadge.textContent = side === 'groom' ? 'Nhà trai' : 'Nhà gái';
      sideBadge.className = 'badge ' + (side==='groom' ? 'text-custom-address-groom' : 'text-custom-address-bride ');
    };

    const openForm = (side) => {
      setSide(side);
      card.style.display = 'block';
      card.scrollIntoView({behavior:'smooth', block:'center'});
    };

    btnGroom.addEventListener('click', ()=>openForm('groom'));
    btnBride.addEventListener('click', ()=>openForm('bride'));
    btnClose.addEventListener('click', ()=>{
      card.style.display = 'none';
      alertBox.classList.add('d-none');
    });
    
    // THAY GAS_URL bằng URL Web App vừa triển khai
    const GAS_URL = {
      groom:
        'https://script.google.com/macros/s/AKfycbwHOfxwEqB3vVIBTT47fsNGyH9Ijl-Tz9xRMY3PjThKx7bwUK0h6ZcwtLhS6aEpec1U/exec',
      bride:
        'https://script.google.com/macros/s/wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww/exec',
    };
    const ENDPOINT2 = 'https://script.google.com/macros/s/AKfycbwHOfxwEqB3vVIBTT47fsNGyH9Ijl-Tz9xRMY3PjThKx7bwUK0h6ZcwtLhS6aEpec1U/exec';
    //bride sẽ thay sau
      form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!form.checkValidity()) {
              form.classList.add('was-validated');
              return;
            }

            const side = inputSide.value; // 'groom' | 'bride'
            const endpoint = GAS_URL[side];
            if (!endpoint) {
              alertBox.textContent = 'Chưa cấu hình URL nhận dữ liệu cho ' + (side === 'groom' ? 'nhà trai' : 'nhà gái') + '.';
              alertBox.classList.remove('d-none');
              return;
            }

          // chuẩn bị body kiểu x-www-form-urlencoded (tránh preflight)
          const params = new URLSearchParams();
          const name   = el('input-name').value.trim();
          const phone  = el('input-phone').value.trim();
          const status = el('input-status').value;

          params.append('side', side);
          params.append('name', name);
          params.append('phone', phone);
          params.append('status', status);

          const submitBtn = form.querySelector('button[type="submit"]');
          const oldText = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang gửi...';

          try {
            const response = await fetch(ENDPOINT2, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
              body: params.toString(),
            });

            const raw = await response.text();
            let json;
            debugger;
            try { json = JSON.parse(raw); } catch { json = { ok: response.ok, message: raw }; }

            if (!response.ok || !json.ok) {
              throw new Error(json.message || `HTTP ${response.status}`);
            }

            alertBox.textContent = `Cảm ơn ${name}! Xác nhận đã được ghi nhận.`;
            alertBox.classList.remove('d-none');
            form.reset();
            form.classList.remove('was-validated');
          } catch (err) {
            alertBox.textContent = `Có lỗi xảy ra: ${String(err)}`;
            alertBox.classList.remove('d-none');
          } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = oldText;
            setTimeout(() => alertBox.classList.add('d-none'), 4000);
          }
        });
  }
};
