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

    form.addEventListener('submit', (e)=>{
      e.preventDefault();

      // kiểm tra nhanh
      if(!form.checkValidity()){
        form.classList.add('was-validated');
        return;
      }

      const data = {
        side: inputSide.value,              // 'groom' | 'bride'
        name: document.getElementById('input-name').value.trim(),
        phone: document.getElementById('input-phone').value.trim(),
        status: document.getElementById('input-status').value
      };

      // Hiển thị thông báo thành công
      alertBox.textContent =
        `Cảm ơn ${data.name}! Đã xác nhận "${data.status==='yes'?'Có tham dự': data.status==='maybe'?'Chưa xác định':'Không tham dự'}" `+
        `tại ${data.side==='groom'?'nhà trai':'nhà gái'}.`;
      alertBox.classList.remove('d-none');

      // Reset form
      form.reset();
      form.classList.remove('was-validated');
    });
  }
};
