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
      sideBadge.className = 'badge ' + (side==='groom' ? 'text-bg-primary' : 'text-bg-pink');
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
    //bride sẽ thay sau
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      // kiểm tra nhanh
      if(!form.checkValidity()){
        form.classList.add('was-validated');
        return;
      }
      debugger;
      const side = inputSide.value; // xác định bên hiện tại
      const endpoint = GAS_URL[side];
      if (!endpoint) {
        alertBox.textContent =
          'Chưa cấu hình URL nhận dữ liệu cho ' +
          (side === 'groom' ? 'nhà trai' : 'nhà gái') +
          '.';
        alertBox.classList.remove('d-none');
        return;
      }
   
      // gửi dữ liệu
      const data = {
        side, // 'groom' | 'bride'
        name: el('input-name').value.trim(),
        phone: el('input-phone').value.trim(),
        status: el('input-status').value,
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      const oldText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Đang gửi...';
      
      const fd = new FormData();
      Object.entries(data).forEach(([k,v]) => fd.append(k, v));

       try {
          const res = await fetch(endpoint, {
            method: 'POST',
            body: fd, // KHÔNG đặt Content-Type -> trình duyệt tự set multipart/form-data
          });


          const text = await res.text();
          let json;
          try {
            json = JSON.parse(text);
          } catch {
            // Server trả về HTML / không phải JSON
            json = { ok: false, message: text };
          }

          if (!res.ok || !json.ok) {
            throw new Error(json.message || `HTTP ${res.status}`);
          } 
          console.log("err",json)
          // OK: báo thành công
          alertBox.textContent = `Cảm ơn ${data.name}! Xác nhận đã được ghi nhận.`;
          alertBox.classList.remove('d-none');

          // reset form
          form.reset();
          form.classList.remove('was-validated');
        } catch (err) {
          alertBox.textContent = `Có lỗi xảy ra: ${String(err)}`;
          alertBox.classList.remove('d-none');
        } finally {
          // mở nút lại
          submitBtn.disabled = false;
          submitBtn.innerHTML = oldText;
          setTimeout(() => alertBox.classList.add('d-none'), 4000);
        }
    });
  }
};
