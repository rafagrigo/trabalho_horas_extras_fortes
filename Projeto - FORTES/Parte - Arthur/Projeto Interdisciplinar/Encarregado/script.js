const TECNICOS = [
  { nome: 'João Pedro Silva', horas: 24, total: 720 },
  { nome: 'Maria Santos', horas: 18, total: 540 },
  { nome: 'Carlos Oliveira', horas: 32, total: 960 },
  { nome: 'Ana Costa', horas: 16, total: 480 },
  { nome: 'Pedro Alves', horas: 28, total: 840 },
];

const HISTORY = {
  'João Pedro Silva': [
    { data: '15/11/2025', periodo: '08:00 - 12:00', obra: 'Obra Shopping Center', valor: 240, status: 'Aprovado' },
    { data: '20/11/2025', periodo: '14:00 - 18:00', obra: 'Obra Residencial Torres', valor: 180, status: 'Em Análise' },
  ],
  'Maria Santos': [
    { data: '10/11/2025', periodo: '07:00 - 11:00', obra: 'Obra Centro', valor: 180, status: 'Aprovado' },
  ],
  'Carlos Oliveira': [
    { data: '22/11/2025', periodo: '06:00 - 10:00', obra: 'Obra Industrial Norte', valor: 200, status: 'Recusado', justificativa: 'Fora do orçamento' },
  ],
  'Ana Costa': [
    { data: '12/11/2025', periodo: '13:00 - 17:00', obra: 'Obra Litorânea', valor: 160, status: 'Em Análise' },
  ],
  'Pedro Alves': [
    { data: '05/11/2025', periodo: '18:00 - 22:00', obra: 'Obra Shopping Center', valor: 200, status: 'Aprovado' },
  ],
};
const STATUS_LIST = Object.entries(HISTORY).flatMap(([nome, regs]) =>
  regs.map(r => ({ tecnico:nome, ...r }))
);

let state = {
  data: [...TECNICOS],
  filtered: [...TECNICOS],
  currentPage: 1,
  rowsPerPage: 5,
  sortState: { key: null, asc: true },
  currentTech: '',
  tempRemoveTech: null,
  lastRemoved: null
};

const formatBRL = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const getInitials = n => n.split(' ').filter(Boolean).slice(0,2).map(s=>s[0]).join('').toUpperCase();
const badgeClass = h => (h<=20?'badge-low':h<=30?'badge-mid':'badge-high');
const badgeText  = h => (h<=20?'Baixo':h<=30?'Médio':'Alto');
const parseBRDate = s => { const [d,m,y] = s.split('/').map(n=>parseInt(n,10)); return new Date(y, m-1, d); };

function openModal(id){ const el=document.getElementById(id); if(!el) return; el.classList.remove('closing'); el.classList.add('show'); }
function closeModal(id){
  const el=document.getElementById(id); if(!el) return;
  el.classList.add('closing');
  const end=()=>{ el.classList.remove('show','closing'); el.removeEventListener('animationend', end); };
  el.addEventListener('animationend', end);
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.modal-overlay').forEach(overlay=>{
    overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeModal(overlay.id); });
  });
  window.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      document.querySelectorAll('.modal-overlay.show').forEach(m => closeModal(m.id));
    }
  });
});

function atualizarTotalMensal(){
  const total = state.filtered.reduce((acc, t) => acc + t.total, 0);
  document.getElementById('total-mensal').textContent = formatBRL(total);
}
function clearSortIndicators(){
  document.querySelectorAll('#tecnicos-table thead th').forEach(th=> th.classList.remove('sorted-asc','sorted-desc'));
}
function renderTable(){
  const tbody = document.getElementById('tecnicos-body');
  tbody.innerHTML = '';

  const start = (state.currentPage - 1) * state.rowsPerPage;
  const pageItems = state.filtered.slice(start, start + state.rowsPerPage);

  pageItems.forEach(t => {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.innerHTML = `
      <button class="tech-chip btn" data-ripple title="Remover técnico" onclick="openRemoveTechModal('${t.nome.replace(/'/g,"\\'")}')">
        <span class="avatar-sm">${getInitials(t.nome)}</span> ${t.nome}
      </button>`;
    tr.appendChild(tdNome);

    const tdHoras = document.createElement('td');
    tdHoras.innerHTML = `${t.horas}h <span class="badge ${badgeClass(t.horas)}" style="margin-left:8px;">${badgeText(t.horas)}</span>`;
    tr.appendChild(tdHoras);

    const tdTotal = document.createElement('td');
    tdTotal.textContent = formatBRL(t.total);
    tr.appendChild(tdTotal);

    const tdAcoes = document.createElement('td');
    tdAcoes.innerHTML = `<button class="btn btn-mini btn-solicitar" data-ripple onclick="openConfirmModal('${t.nome.replace(/'/g,"\\'")}')">Solicitar</button>`;
    tr.appendChild(tdAcoes);

    tbody.appendChild(tr);
  });

  document.getElementById('pg-current').textContent = state.currentPage;
  document.getElementById('pg-total').textContent = Math.max(1, Math.ceil(state.filtered.length / state.rowsPerPage));
  atualizarTotalMensal();

  if (state.sortState.key){
    const th = document.querySelector(`[data-sort="${state.sortState.key}"]`);
    clearSortIndicators();
    if (th) th.classList.add(state.sortState.asc ? 'sorted-asc' : 'sorted-desc');
    const map = { nome:'#sort-nome', horas:'#sort-horas', total:'#sort-total' };
    const iconSpan = document.querySelector(map[state.sortState.key]);
    if (iconSpan) iconSpan.textContent = state.sortState.asc ? '↑' : '↓';
  }
}

function applyFilters(){
  const q = (document.getElementById('tech-search')?.value || '').toLowerCase();
  const filtro = document.getElementById('filter-horas')?.value || 'todos';

  state.filtered = state.data.filter(t => {
    const matchNome = t.nome.toLowerCase().includes(q);
    let matchHoras = true;
    if(filtro === '<=20') matchHoras = t.horas <= 20;
    if(filtro === '21-30') matchHoras = t.horas >= 21 && t.horas <= 30;
    if(filtro === '>30') matchHoras = t.horas > 30;
    return matchNome && matchHoras;
  });

  state.currentPage = 1;
  renderTable();
}
function sortBy(key){
  if(state.sortState.key === key){ state.sortState.asc = !state.sortState.asc; }
  else { state.sortState.key = key; state.sortState.asc = true; }
  const dir = state.sortState.asc ? 1 : -1;

  state.data.sort((a,b)=>{
    if(key === 'nome') return a.nome.localeCompare(b.nome) * dir;
    if(key === 'horas') return (a.horas - b.horas) * dir;
    if(key === 'total') return (a.total - b.total) * dir;
    return 0;
  });

  applyFilters();
}
function nextPage(){
  const max = Math.max(1, Math.ceil(state.filtered.length / state.rowsPerPage));
  if(state.currentPage < max){ state.currentPage++; renderTable(); }
}
function prevPage(){ if(state.currentPage > 1){ state.currentPage--; renderTable(); } }

function openConfirmModal(techName){ state.currentTech = techName; document.getElementById('confirm-tech-name').textContent = techName; openModal('modal-confirm'); }
function openFormModal(){ closeModal('modal-confirm'); document.getElementById('form-tech-name').textContent = state.currentTech; openModal('modal-form'); }

function openRemoveTechModal(nome){
  state.tempRemoveTech = nome;
  document.getElementById('remove-tech-name').textContent = nome;

  const btn = document.getElementById('confirm-remove-tech');
  if(btn){
    btn.classList.remove('btn-primary','btn-outline');
    btn.classList.add('btn-danger');
  }
  openModal('modal-remove-tech');
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('confirm-remove-tech').addEventListener('click', ()=>{
    if(!state.tempRemoveTech) return;
    const tech = state.data.find(t => t.nome === state.tempRemoveTech);
    state.lastRemoved = tech ? {...tech} : null;
    state.data = state.data.filter(t => t.nome !== state.tempRemoveTech);
    state.tempRemoveTech = null;
    closeModal('modal-remove-tech');
    applyFilters();
    mostrarUndoBanner();
  });
});

function mostrarUndoBanner(){
  let banner = document.getElementById('undo-banner');
  if(!banner){
    banner = document.createElement('div');
    banner.id = 'undo-banner';
    banner.className = 'undo-banner';
    banner.innerHTML = `Técnico removido. <button data-ripple onclick="desfazerRemocao()">Desfazer</button>`;
    document.body.appendChild(banner);
  }
  banner.classList.add('show');
  setTimeout(()=> banner.classList.remove('show'), 5000);
}
function desfazerRemocao(){
  if(state.lastRemoved){
    state.data.push(state.lastRemoved);
    state.lastRemoved = null;
    applyFilters();
    const banner = document.getElementById('undo-banner');
    if(banner) banner.classList.remove('show');
  }
}

function popularSelectHistorico(){
  const sel = document.getElementById('hist-tech-filter');
  sel.innerHTML = state.data.map(t => `<option value="${t.nome}">${t.nome}</option>`).join('');
}
function renderHistorico(nome){
  const regs = HISTORY[nome] || [];
  const body = document.getElementById('history-body');
  body.innerHTML = regs.map(r => `
    <tr>
      <td>${r.data}</td>
      <td>${r.periodo}</td>
      <td>${r.obra}</td>
      <td>${formatBRL(r.valor || 0)}</td>
      <td><span class="status ${r.status.replace(' ','-').toLowerCase()}">${r.status}</span></td>
      <td>${r.status === 'Recusado' ? (r.justificativa || '-') : '-'}</td>
    </tr>`).join('');
}
function abrirHistoricoSidebar(){ popularSelectHistorico(); renderHistorico(document.getElementById('hist-tech-filter').value); openModal('modal-history'); }

function contarStatus(lista){
  const tot = { Aprovado:0, 'Em Análise':0, Recusado:0 };
  lista.forEach(r => tot[r.status]++);
  document.getElementById('sc-aprovado').textContent = tot['Aprovado'] || 0;
  document.getElementById('sc-analise').textContent = tot['Em Análise'] || 0;
  document.getElementById('sc-recusado').textContent = tot['Recusado'] || 0;
}
function filtrarStatus(){
  const st = document.getElementById('status-filter').value;
  const period = document.getElementById('period-filter').value;
  const obra = (document.getElementById('obra-filter').value || '').toLowerCase();

  let base = [...STATUS_LIST];

  if (st !== 'todos') base = base.filter(r => r.status === st);

  const hoje = new Date(); hoje.setHours(0,0,0,0);
  if (period === 'hoje'){
    base = base.filter(r => parseBRDate(r.data).getTime() === hoje.getTime());
  } else if (period === '7'){
    const from = new Date(hoje); from.setDate(from.getDate() - 7);
    base = base.filter(r => { const d = parseBRDate(r.data); return d >= from && d <= hoje; });
  } else if (period === '30'){
    const from = new Date(hoje); from.setDate(from.getDate() - 30);
    base = base.filter(r => { const d = parseBRDate(r.data); return d >= from && d <= hoje; });
  }

  if (obra) base = base.filter(r => r.obra.toLowerCase().includes(obra));

  return base;
}
function renderStatus(){
  const rows = filtrarStatus();
  const body = document.getElementById('status-body');
  body.innerHTML = rows.map(r => `
    <tr>
      <td>${r.tecnico}</td>
      <td>${r.data}</td>
      <td>${r.periodo}</td>
      <td>${r.obra}</td>
      <td><span class="status ${r.status.replace(' ','-').toLowerCase()}">${r.status}</span></td>
    </tr>`).join('');
  contarStatus(rows);
}
function abrirStatusSidebar(){ renderStatus(); openModal('modal-status'); }

function toggleProfileMenu(){ const dd=document.getElementById('profile-dropdown'); dd.classList.toggle('hidden'); dd.classList.toggle('show'); }
function openPasswordModal(event){ event.stopPropagation(); const dd=document.getElementById('profile-dropdown'); dd.classList.add('hidden'); dd.classList.remove('show'); openModal('modal-password'); }
window.addEventListener('click', (e)=>{ const userInfo=document.querySelector('.user-info'); const dd=document.getElementById('profile-dropdown'); if(dd && dd.classList.contains('show') && !userInfo.contains(e.target)){ dd.classList.add('hidden'); dd.classList.remove('show'); } });

function exportCSV(){
  const header = ['Nome','Horas extras / mês','Total'];
  const rows = state.filtered.map(t => [t.nome, `${t.horas}h`, formatBRL(t.total)]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'tecnicos.csv'; a.click(); URL.revokeObjectURL(url);
}

document.getElementById('help-fab').addEventListener('click', ()=> openModal('modal-support'));
function enviarEmail(){
  const msg = document.getElementById('support-msg').value.trim();
  const assunto = 'Suporte - Horas Extras';
  const corpo = `Olá Suporte,%0D%0A%0D%0A${encodeURIComponent(msg || 'Descreva aqui seu problema.')}%0D%0A%0D%0A— Enviado pelo sistema de Horas Extras`;
  const mailto = `mailto:ti@fortes.eng?subject=${encodeURIComponent(assunto)}&body=${corpo}`;
  window.location.href = mailto;
}
function abrirWhats(){
  const msg = document.getElementById('support-msg').value.trim() || 'Preciso de suporte no sistema de Horas Extras.';
  const url = `https://wa.me/5527999990000?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}
function copiarContato(texto){
  navigator.clipboard.writeText(texto).then(()=>{
    const btn = document.activeElement;
    if(btn){ const old = btn.textContent; btn.textContent = 'Copiado!'; setTimeout(()=> btn.textContent = old, 1200); }
  });
}

function confirmCancel(){ alert('Solicitação cancelada com sucesso!'); closeModal('modal-cancel'); }
function logout(){ alert('Funcionalidade de Sair / Logout'); }
function navigateTo(page){
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const el = document.getElementById('page-'+page);
  if(el) el.classList.remove('hidden');
  document.querySelectorAll('.menu-item').forEach(i=>i.classList.toggle('active', i.dataset.page===page));
}

document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.btn,[data-ripple],.fab-help');
  if(!btn) return;
  const rect = btn.getBoundingClientRect();
  const ink = document.createElement('span');
  ink.className = 'ripple-ink';
  const size = Math.max(rect.width, rect.height);
  ink.style.width = ink.style.height = size + 'px';
  ink.style.left = (e.clientX - rect.left - size/2) + 'px';
  ink.style.top  = (e.clientY - rect.top  - size/2) + 'px';
  btn.appendChild(ink);
  ink.addEventListener('animationend', ()=> ink.remove());
});

document.addEventListener('DOMContentLoaded', () => {
  const meses = ['JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO','JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'];
  const d = new Date();
  document.getElementById('kpi-month').textContent = `${meses[d.getMonth()]}/${d.getFullYear()}`;

  document.querySelectorAll('.menu-item').forEach(item => {
    const page = item.dataset.page;
    if(page && !['historico','status'].includes(page)){
      item.addEventListener('click', ()=>navigateTo(page));
    }
  });
  document.getElementById('open-sidebar-history').addEventListener('click', abrirHistoricoSidebar);
  document.getElementById('open-sidebar-status').addEventListener('click', abrirStatusSidebar);

  navigateTo('tecnicos');

  document.querySelectorAll('#tecnicos-table thead th[data-sort]').forEach(th=>{
    th.addEventListener('click', ()=> sortBy(th.getAttribute('data-sort')));
  });

  const debounce = (fn, ms=250)=>{ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; };
  document.getElementById('tech-search').addEventListener('input', debounce(applyFilters));
  document.getElementById('filter-horas').addEventListener('change', applyFilters);

  document.getElementById('pg-next').addEventListener('click', nextPage);
  document.getElementById('pg-prev').addEventListener('click', prevPage);

  document.getElementById('btn-export').addEventListener('click', exportCSV);
  const btnRefresh = document.getElementById('btn-refresh');
  btnRefresh.addEventListener('click', ()=>{
    btnRefresh.disabled = true; btnRefresh.textContent = 'Atualizando...';
    setTimeout(()=>{ btnRefresh.disabled = false; btnRefresh.textContent = 'Atualizar'; atualizarTotalMensal(); }, 600);
  });

  document.getElementById('btn-add-tech').addEventListener('click', ()=> openModal('modal-novo-tecnico'));
  document.getElementById('novo-tecnico-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const nome = document.getElementById('nt-nome').value.trim();
    const horas = parseInt(document.getElementById('nt-horas').value, 10);
    const total = parseFloat(document.getElementById('nt-total').value);
    if(!nome || isNaN(horas) || isNaN(total)) return;
    state.data.push({ nome, horas, total });
    closeModal('modal-novo-tecnico'); e.target.reset(); applyFilters();
  });

  const dateInput = document.getElementById('date-input');
  if(dateInput){
    dateInput.addEventListener('input', (e)=>{
      let v = e.target.value.replace(/\D/g,'');
      if(v.length>=3) v = v.slice(0,2)+'/'+v.slice(2);
      if(v.length>=6) v = v.slice(0,5)+'/'+v.slice(5,9);
      e.target.value = v;
    });
  }
  const overtimeForm = document.getElementById('overtime-form');
  if(overtimeForm){
    overtimeForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      alert('Solicitação enviada com sucesso para ' + state.currentTech + '!');
      closeModal('modal-form'); e.target.reset();
    });
  }

  const passwordForm = document.getElementById('password-form');
  if(passwordForm){
    passwordForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const a = document.getElementById('new-password').value.trim();
      const b = document.getElementById('confirm-password').value.trim();
      const err = document.getElementById('password-error');
      const ok = document.getElementById('password-success');
      err.style.display='none'; ok.style.display='none';
      if(a !== b){ err.textContent='As senhas não coincidem. Tente novamente.'; err.style.display='block'; return; }
      ok.textContent='Senha alterada com sucesso!'; ok.style.display='block';
      setTimeout(()=>{ closeModal('modal-password'); passwordForm.reset(); }, 900);
    });
  }

  document.getElementById('hist-tech-filter').addEventListener('change', (e)=> renderHistorico(e.target.value));
  ['status-filter','period-filter','obra-filter'].forEach(id=>{
    document.getElementById(id).addEventListener('input', renderStatus);
    document.getElementById(id).addEventListener('change', renderStatus);
  });

  applyFilters();
});

window.openModal = openModal;
window.closeModal = closeModal;
window.openConfirmModal = openConfirmModal;
window.openFormModal = openFormModal;
window.openRemoveTechModal = openRemoveTechModal;
window.desfazerRemocao = desfazerRemocao;
window.popularSelectHistorico = popularSelectHistorico;
window.renderHistorico = renderHistorico;
window.abrirHistoricoSidebar = abrirHistoricoSidebar;
window.renderStatus = renderStatus;
window.abrirStatusSidebar = abrirStatusSidebar;
window.toggleProfileMenu = toggleProfileMenu;
window.openPasswordModal = openPasswordModal;
window.confirmCancel = confirmCancel;
window.logout = logout;
window.navigateTo = navigateTo;
window.exportCSV = exportCSV;
window.enviarEmail = enviarEmail;
window.abrirWhats = abrirWhats;
window.copiarContato = copiarContato;