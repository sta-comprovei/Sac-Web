
// ═══════════════════════════════════════════════════════════════
// LogiTrack SAC — UI Utilities
// ═══════════════════════════════════════════════════════════════

const Toast = {
  container: null,
  init() { this.container = document.getElementById('toast-container'); },
  show(msg, type='success', duration=3500) {
    const icons = {
      success:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
      error:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
      warning:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      info:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type]||icons.info}</span><span>${msg}</span><button class="toast-close" onclick="this.parentElement.remove()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);margin-left:auto;display:flex"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    if (this.container) this.container.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, duration);
  },
  success(m){ this.show(m,'success'); },
  error(m)  { this.show(m,'error',5000); },
  warning(m){ this.show(m,'warning'); },
  info(m)   { this.show(m,'info'); },
};

const Modal = {
  open(id)  { const e=document.getElementById(id); if(e){e.classList.add('open');document.body.style.overflow='hidden';} },
  close(id) { const e=document.getElementById(id); if(e){e.classList.remove('open');document.body.style.overflow='';} },
  closeAll(){ document.querySelectorAll('.modal-overlay.open').forEach(e=>e.classList.remove('open')); document.body.style.overflow=''; },
};

document.addEventListener('click', e => { if(e.target.classList.contains('modal-overlay')) Modal.closeAll(); });
document.addEventListener('keydown', e => { if(e.key==='Escape') Modal.closeAll(); });

function confirmDialog(title, msg, onConfirm, danger=true) {
  const old = document.getElementById('confirm-modal');
  if(old) old.remove();
  const m = document.createElement('div');
  m.id = 'confirm-modal';
  m.className = 'modal-overlay open';
  m.innerHTML = `<div class="modal modal-sm"><div class="modal-header"><span class="modal-title">${title}</span><button class="modal-close" onclick="document.getElementById('confirm-modal').remove()" style="background:none;border:none;cursor:pointer;display:flex;align-items:center;color:var(--text-secondary)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div class="modal-body"><p style="color:var(--text-secondary);font-size:14px;">${msg}</p></div><div class="modal-footer"><button class="btn btn-secondary" onclick="document.getElementById('confirm-modal').remove()">Cancelar</button><button class="btn ${danger?'btn-danger':'btn-primary'}" id="confirm-ok-btn">Confirmar</button></div></div>`;
  document.body.appendChild(m);
  document.getElementById('confirm-ok-btn').onclick = () => { m.remove(); onConfirm(); };
}

const Theme = {
  current: 'light',
  init() {
    const saved = localStorage.getItem('lt_theme') || 'light';
    this.apply(saved);
  },
  toggle() {
    this.apply(this.current==='light'?'dark':'light');
    localStorage.setItem('lt_theme', this.current);
  },
  apply(t) {
    this.current = t;
    document.documentElement.setAttribute('data-theme', t);
  },
};

const Icons = {
  svg(name, size=18) {
    const paths = {
      home:`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
      alert:`<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>`,
      plus:`<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
      search:`<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
      edit:`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
      trash:`<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>`,
      eye:`<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
      check:`<polyline points="20 6 9 17 4 12"/>`,
      x:`<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
      menu:`<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>`,
      truck:`<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>`,
      user:`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`,
      users:`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
      chart:`<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>`,
      file:`<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>`,
      download:`<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
      settings:`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
      bell:`<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>`,
      target:`<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>`,
      shield:`<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
      logout:`<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>`,
      moon:`<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
      sun:`<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>`,
      calendar:`<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>`,
      filter:`<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>`,
      star:`<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>`,
      list:`<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>`,
      pin:`<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
      info:`<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
      refresh:`<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,
      arrow_up:`<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>`,
      arrow_down:`<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>`,
    };
    const p = paths[name];
    if(!p) return '';
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="${size}" height="${size}">${p}</svg>`;
  }
};

function renderPagination(containerId, total, page, perPage, onChange) {
  const totalPages = Math.ceil(total/perPage);
  const el = document.getElementById(containerId);
  if(!el) return;
  if(totalPages<=1){el.innerHTML='';return;}
  let pages='';
  const start=Math.max(1,page-2), end=Math.min(totalPages,page+2);
  if(start>1) pages+=`<button class="page-btn" data-p="1">1</button>`;
  if(start>2) pages+=`<span class="page-ellipsis">…</span>`;
  for(let i=start;i<=end;i++) pages+=`<button class="page-btn${i===page?' active':''}" data-p="${i}">${i}</button>`;
  if(end<totalPages-1) pages+=`<span class="page-ellipsis">…</span>`;
  if(end<totalPages) pages+=`<button class="page-btn" data-p="${totalPages}">${totalPages}</button>`;
  const from=(page-1)*perPage+1, to=Math.min(page*perPage,total);
  el.innerHTML=`<div class="pagination"><span class="page-info">Exibindo ${from}–${to} de ${total}</span><div class="page-btns"><button class="page-btn" data-p="${page-1}" ${page===1?'disabled':''}>‹</button>${pages}<button class="page-btn" data-p="${page+1}" ${page===totalPages?'disabled':''}>›</button></div></div>`;
  el.querySelectorAll('.page-btn:not([disabled])').forEach(btn=>{
    btn.addEventListener('click',()=>onChange(parseInt(btn.dataset.p)));
  });
}

