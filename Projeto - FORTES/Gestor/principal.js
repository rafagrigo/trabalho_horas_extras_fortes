/* ===== Helpers ===== */
function genId(){ return 'id_' + Math.random().toString(36).slice(2,9); }
function money(n){ return 'R$ ' + Number(n).toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function parseHoras(h){ const m = String(h||'').match(/(\d+)/); return m? Number(m[1]):0; }
function parseDataBR(d){ const [dd,mm,yy] = d.split('/').map(Number); return new Date(yy,mm-1,dd); }

/* ===== Data (persist) ===== */
const DEFAULT_DATA = {
  saldo: 50000.00,
  pendentes: [
    { id: genId(), dataRecebimento:"02/11/2025", encarregado:"Ana Paula", tecnico:"Maria Santos", obra:"Obra Residencial Torres", data:"16/11/2025", duracao:"6h", custo:270.00 },
    { id: genId(), dataRecebimento:"03/11/2025", encarregado:"Carlos Silva", tecnico:"Carlos Oliveira", obra:"Obra Industrial Norte", data:"18/11/2025", duracao:"8h", custo:360.00 },
    { id: genId(), dataRecebimento:"15/10/2025", encarregado:"Carlos Silva", tecnico:"João Pedro Silva", obra:"Obra Comercial Centro", data:"20/10/2025", duracao:"4h", custo:180.00 }
  ],
  cumpridas: [
    { id: genId(), tecnico:"João Pedro Silva", encarregado:"Carlos Silva", obra:"Obra Comercial Centro", data:"20/10/2025", duracao:"4h", custo:180.00 },
    { id: genId(), tecnico:"Ana Costa", encarregado:"Ana Paula", obra:"Obra Residencial Sul", data:"22/10/2025", duracao:"6h", custo:270.00 },
    { id: genId(), tecnico:"Pedro Alves", encarregado:"Carlos Silva", obra:"Obra Industrial Leste", data:"25/10/2025", duracao:"5h", custo:225.00 }
  ],
  historico: [
    { id: genId(), status:"Aprovado", dataRecebimento:"18/10/2025", encarregado:"Ana Paula", tecnico:"Ana Costa", obra:"Obra Residencial Sul", data:"22/10/2025", duracao:"6h", custo:270.00 },
    { id: genId(), status:"Recusado", dataRecebimento:"20/10/2025", encarregado:"Carlos Silva", tecnico:"Pedro Alves", obra:"Obra Shopping Center", data:"25/10/2025", duracao:"8h", custo:360.00, justificativa:"Não houve necessidade." },
    { id: genId(), status:"Recusado", dataRecebimento:"02/11/2025", encarregado:"Ana Paula", tecnico:"Maria Santos", obra:"Obra Residencial Torres", data:"16/11/2025", duracao:"6h", custo:270.00, justificativa:"Orçamento insuficiente." }
  ],
  tecnicos: [
    { nome:"João Pedro Silva", horas:"24h", custo:1080.00 },
    { nome:"Maria Santos", horas:"18h", custo:810.00 },
    { nome:"Carlos Oliveira", hours:"32h", custo:1440.00 },
    { nome:"Ana Costa", horas:"16h", custo:720.00 },
    { nome:"Pedro Alves", horas:"28h", custo:1260.00 }
  ],
  obras: [
    { obra:"Obra Shopping Center", horas:"48h", tecnicos:8, valor:2160.00 },
    { obra:"Obra Residencial Torres", horas:"36h", tecnicos:6, valor:1620.00 },
    { obra:"Obra Industrial Norte", horas:"64h", tecnicos:10, valor:2880.00 },
    { obra:"Obra Comercial Centro", horas:"28h", tecnicos:5, valor:1260.00 }
  ]
};
const STORAGE_KEY = 'fortes_horas_extra_v1';
function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA)); return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
  try{ const parsed = JSON.parse(raw); return Object.assign({}, DEFAULT_DATA, parsed); }
  catch(e){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA)); return JSON.parse(JSON.stringify(DEFAULT_DATA)); }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA)); }
let DATA = loadData();

/* ===== DOM ===== */
const pages = document.querySelectorAll('.page');
const saldoValorEl = document.getElementById('saldoValor');
const listaSolicitacoesEl = document.getElementById('listaSolicitacoes');
const tabelaCumpridasEl = document.getElementById('tabelaCumpridas');
const tabelaTecnicosEl  = document.getElementById('tabelaTecnicos');
const tabelaObrasEl     = document.getElementById('tabelaObras');
const tabelaHistoricoEl = document.getElementById('tabelaHistorico');

/* Topbar / dropdown */
const userInfoBtn = document.getElementById('userInfoBtn');
const profileDropdown = document.getElementById('profileDropdown');
const btnSair = document.getElementById('btnSair');

/* overlay (modais) */
const overlay = document.getElementById('overlay');

/* ===== Estado ===== */
let sortCum = {k:null,dir:1};
let sortTec = {k:null,dir:1};
let sortObra = {k:null,dir:1};
let sortHist = {k:null,dir:1};
let actionTargetId = null;
let actionHistoryEntry = null;
let rmTecTarget = null;

/* ===== Init ===== */
function init(){
  bindMenu();
  bindTopbar();
  renderAll();
  if(window.feather) feather.replace();
}
init();

/* ===== Navegação + ações por página ===== */
function bindMenu(){
  document.querySelectorAll('.menu-item').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const page = btn.dataset.page;
      document.querySelectorAll('.menu-item').forEach(m=>m.classList.remove('active'));
      btn.classList.add('active');
      navigateTo(page);
    });
  });
}
function navigateTo(page){
  pages.forEach(p=>p.hidden = p.dataset.page !== page);
  setActions(page);
  if(window.feather) feather.replace();
}
function setActions(page){
  // limpa
  ['actions-pendentes','actions-cumpridas','actions-tecnicos','actions-historico']
    .forEach(id=>{ const box=document.getElementById(id); if(box) box.innerHTML=''; });
  const add = (containerId, icon, label, handler) => {
    const box = document.getElementById(containerId);
    if(!box) return;
    const b = document.createElement('button');
    b.className = 'btn ghost lift-sm';
    b.innerHTML = `<i data-feather="${icon}"></i> ${label}`;
    b.addEventListener('click', handler);
    box.appendChild(b);
  };
  if(page==='pendentes'){
    add('actions-pendentes','refresh-cw','Atualizar', ()=>renderAll());
    add('actions-pendentes','download','Exportar CSV', ()=>exportCSV('pendentes'));
  }
  if(page==='cumpridas'){
    add('actions-cumpridas','refresh-cw','Atualizar', ()=>renderAll());
    add('actions-cumpridas','download','Exportar CSV', ()=>exportCSV('cumpridas'));
  }
  if(page==='tecnicos'){
    add('actions-tecnicos','refresh-cw','Atualizar', ()=>renderAll());
    add('actions-tecnicos','download','Exportar CSV', ()=>exportCSV('tecnicos'));
  }
  if(page==='historico'){
    add('actions-historico','refresh-cw','Atualizar', ()=>renderAll());
    add('actions-historico','download','Exportar CSV', ()=>exportCSV('historico'));
  }
}

/* Topbar / dropdown / sair */
function bindTopbar(){
  userInfoBtn.addEventListener('click', (e)=>{ e.stopPropagation(); toggleProfile(profileDropdown.classList.contains('hidden')); });
  window.addEventListener('click', (e)=>{ if(!profileDropdown.classList.contains('hidden')){ const inside = profileDropdown.contains(e.target) || userInfoBtn.contains(e.target); if(!inside) toggleProfile(false); }});
  btnSair.addEventListener('click', ()=> alert('Logout efetuado (mock).'));
}
function toggleProfile(open){
  if(open){ profileDropdown.classList.remove('hidden'); userInfoBtn.setAttribute('aria-expanded','true'); }
  else { profileDropdown.classList.add('hidden'); userInfoBtn.setAttribute('aria-expanded','false'); }
}

/* ===== Render all ===== */
function renderAll(){
  saldoValorEl.textContent = money(DATA.saldo);
  renderSolicitadas();
  renderCumpridas();
  renderTecnicos();
  renderObras();
  renderHistorico();

  document.getElementById('despesasValor').textContent =
    money(DATA.cumpridas.reduce((s,i)=>s+Number(i.custo||0),0));
  document.getElementById('despesasTecnicos').textContent =
    money(DATA.tecnicos.reduce((s,t)=>s+Number(t.custo||0),0));
  document.getElementById('totalObras').textContent =
    money(DATA.obras.reduce((s,o)=>s+Number(o.valor||0),0));

  saveData();
  if(window.feather) feather.replace();
}

/* ===== Solicitações ===== */
function renderSolicitadas(){
  listaSolicitacoesEl.innerHTML = '';
  if(!DATA.pendentes.length){
    const empty = document.createElement('div');
    empty.className = 'card';
    empty.textContent = 'Nenhuma solicitação pendente.';
    listaSolicitacoesEl.appendChild(empty);
    return;
  }
  DATA.pendentes.forEach(item=>{
    const card = document.createElement('div');
    card.className = 'solic-card';
    const c1 = document.createElement('div'); c1.className='s-group';
    c1.innerHTML = `
      <div><div class="field-label">Data de Recebimento</div><div class="field-value">${item.dataRecebimento}</div></div>
      <div><div class="field-label">Data</div><div class="field-value">${item.data}</div></div>
    `;
    const c2 = document.createElement('div'); c2.className='s-group';
    c2.innerHTML = `
      <div><div class="field-label">Encarregado</div><div class="field-value">${item.encarregado}</div></div>
      <div><div class="field-label">Duração</div><div class="field-value">${item.duracao}</div></div>
    `;
    const c3 = document.createElement('div'); c3.className='s-group';
    c3.innerHTML = `
      <div><div class="field-label">Técnico</div><div class="field-value">${item.tecnico}</div></div>
      <div><div class="field-label">Custo</div><div class="field-value">${money(item.custo)}</div></div>
    `;
    const c4 = document.createElement('div'); c4.className='s-group obra-wrap';
    c4.innerHTML = `<div><div class="field-label">Obra</div><div class="field-value">${item.obra}</div></div>`;
    const c5 = document.createElement('div'); c5.className='pair-actions';
    c5.innerHTML = `
      <button class="btn btn-danger" data-action="recusar" data-id="${item.id}"><i data-feather="x"></i> Recusar</button>
      <button class="btn btn-success" data-action="aceitar" data-id="${item.id}"><i data-feather="check"></i> Aceitar</button>
    `;
    card.append(c1,c2,c3,c4,c5);
    listaSolicitacoesEl.appendChild(card);
  });

  // listeners
  listaSolicitacoesEl.querySelectorAll('button[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.dataset.id;
      const item = DATA.pendentes.find(p=>p.id===id);
      if(!item) return;
      btn.dataset.action==='aceitar' ? openAprovarModal(item) : openRecusarModal(item);
    });
  });

  if(window.feather) feather.replace();
}

/* ===== Cumpridas ===== */
function renderCumpridas(){
  tabelaCumpridasEl.innerHTML = '';
  const data = DATA.cumpridas.map(r=>({...r, duracaoNum:parseHoras(r.duracao), dataObj:parseDataBR(r.data)}));
  if(sortCum.k){
    data.sort((a,b)=>{
      let av=a[sortCum.k], bv=b[sortCum.k];
      if(sortCum.k==='data'){ av=a.dataObj; bv=b.dataObj; }
      return av>bv ? sortCum.dir : av<bv ? -sortCum.dir : 0;
    });
  }
  data.forEach(r=>{
    const row = document.createElement('div');
    row.className='table-row-card';
    row.innerHTML = `
      <div>${r.tecnico}</div>
      <div>${r.encarregado||'-'}</div>
      <div class="obra-wrap" style="text-align:center">${r.obra}</div>
      <div>${r.data}</div>
      <div>${r.duracao}</div>
      <div>${money(r.custo)}</div>
    `;
    tabelaCumpridasEl.appendChild(row);
  });

  document.querySelectorAll('#page-cumpridas .th-sort').forEach(el=>{
    el.onclick = ()=>{
      const k = el.dataset.k;
      sortCum.dir = (sortCum.k===k) ? -sortCum.dir : 1;
      sortCum.k = k;
      renderCumpridas();
      document.querySelectorAll('#page-cumpridas .th-sort').forEach(s=>s.textContent='↕');
      el.textContent = sortCum.dir===1?'↓':'↑';
    };
  });
}

/* ===== Técnicos ===== */
function classBadge(h){
  const v = parseHoras(h);
  if(v<=20) return `<span class="badge low">Baixo</span>`;
  if(v<=30) return `<span class="badge med">Médio</span>`;
  return `<span class="badge high">Alto</span>`;
}
function renderTecnicos(){
  tabelaTecnicosEl.innerHTML = '';
  const q = (document.getElementById('buscaTecnico')?.value||'').toLowerCase();
  const f = (document.getElementById('filtroHoras')?.value||'all');

  let data = DATA.tecnicos.map(t=>({
    ...t,
    horasDisplay: t.horas || t.hours,
    horasNum: parseHoras(t.horas || t.hours),
    nome: String(t.nome)
  }));

  if(q) data = data.filter(t=>t.nome.toLowerCase().includes(q));
  if(f==='<=20') data = data.filter(t=>t.horasNum<=20);
  if(f==='21-30') data = data.filter(t=>t.horasNum>=21 && t.horasNum<=30);
  if(f==='>30') data = data.filter(t=>t.horasNum>30);

  if(sortTec.k){
    data.sort((a,b)=>{
      const av=a[sortTec.k], bv=b[sortTec.k];
      return av>bv ? sortTec.dir : av<bv ? -sortTec.dir : 0;
    });
  }

  data.forEach(t=>{
    const row = document.createElement('div');
    row.className='table-row-card';
    row.style.gridTemplateColumns = '1fr 1fr 1fr';
    row.innerHTML = `
      <div style="text-align:center">
        <button class="tech-pill" data-tec="${t.nome}">
          <span class="avatar">${t.nome.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase()}</span>
          <span>${t.nome}</span>
        </button>
      </div>
      <div style="text-align:center">${t.horasDisplay}&nbsp;${classBadge(t.horasDisplay)}</div>
      <div style="text-align:center">${money(t.custo)}</div>
    `;
    tabelaTecnicosEl.appendChild(row);
  });

  document.querySelectorAll('#page-tecnicos .th-sort').forEach(el=>{
    el.onclick = ()=>{
      const k = el.dataset.k;
      sortTec.dir = (sortTec.k===k) ? -sortTec.dir : 1;
      sortTec.k = k;
      renderTecnicos();
      document.querySelectorAll('#page-tecnicos .th-sort').forEach(s=>s.textContent='↕');
      el.textContent = sortTec.dir===1?'↓':'↑';
    };
  });

  // eventos únicos
  const busca = document.getElementById('buscaTecnico');
  const filtro = document.getElementById('filtroHoras');
  if(busca && !busca._binded){ busca._binded=true; busca.addEventListener('input', renderTecnicos); }
  if(filtro && !filtro._binded){ filtro._binded=true; filtro.addEventListener('change', renderTecnicos); }

  document.querySelectorAll('.tech-pill').forEach(b=>{
    b.onclick = ()=>{
      rmTecTarget = b.dataset.tec;
      document.getElementById('rmTecTexto').innerHTML = `Tem certeza que deseja remover <strong>${rmTecTarget}</strong> da lista?`;
      openModal('modalRemoveTec');
    };
  });

  if(window.feather) feather.replace();
}

/* ===== Obras ===== */
function renderObras(){
  tabelaObrasEl.innerHTML = '';
  let data = DATA.obras.map(o=>({...o, horasNum:parseHoras(o.horas)}));
  if(sortObra.k){
    data.sort((a,b)=>{
      const av=a[sortObra.k], bv=b[sortObra.k];
      return av>bv ? sortObra.dir : av<bv ? -sortObra.dir : 0;
    });
  }
  data.forEach(o=>{
    const row = document.createElement('div');
    row.className='table-row-card';
    row.innerHTML = `
      <div style="text-align:center" class="obra-wrap">${o.obra}</div>
      <div style="text-align:center">${o.horas}</div>
      <div style="text-align:center">${o.tecnicos}</div>
      <div style="text-align:center">${money(o.valor)}</div>
    `;
    tabelaObrasEl.appendChild(row);
  });

  document.querySelectorAll('#page-obras .th-sort').forEach(el=>{
    el.onclick = ()=>{
      const k = el.dataset.k;
      sortObra.dir = (sortObra.k===k) ? -sortObra.dir : 1;
      sortObra.k = k;
      renderObras();
      document.querySelectorAll('#page-obras .th-sort').forEach(s=>s.textContent='↕');
      el.textContent = sortObra.dir===1?'↓':'↑';
    };
  });
}

/* ===== Histórico ===== */
function renderHistorico(){
  tabelaHistoricoEl.innerHTML = '';
  let data = DATA.historico.map(h=>({
    ...h, duracaoNum:parseHoras(h.duracao), dataObj:parseDataBR(h.data), dataRecObj:parseDataBR(h.dataRecebimento)
  }));
  if(sortHist.k){
    data.sort((a,b)=>{
      let av=a[sortHist.k], bv=b[sortHist.k];
      if(sortHist.k==='data') { av=a.dataObj; bv=b.dataObj; }
      if(sortHist.k==='dataRecebimento') { av=a.dataRecObj; bv=b.dataRecObj; }
      return av>bv ? sortHist.dir : av<bv ? -sortHist.dir : 0;
    });
  }
  data.forEach(h=>{
    const row = document.createElement('div');
    row.className='table-row-card';
    row.style.gridTemplateColumns = 'repeat(9,1fr)';
    const badge = h.status === 'Aprovado' ? `<span class="badge low">Aprovado</span>` : `<span class="badge high">Recusado</span>`;
    row.innerHTML = `
      <div style="text-align:center">${badge}</div>
      <div style="text-align:center">${h.dataRecebimento}</div>
      <div style="text-align:center">${h.encarregado}</div>
      <div style="text-align:center">${h.tecnico}</div>
      <div style="text-align:center" class="obra-wrap">${h.obra}</div>
      <div style="text-align:center">${h.data}</div>
      <div style="text-align:center">${h.duracao}</div>
      <div style="text-align:center">${money(h.custo)}</div>
      <div style="text-align:center"><button class="btn btn-primary" data-undo="${h.id}">Desfazer</button></div>
    `;
    tabelaHistoricoEl.appendChild(row);
  });

  tabelaHistoricoEl.querySelectorAll('button[data-undo]').forEach(btn=>{
    btn.onclick = ()=>{
      const entry = DATA.historico.find(h=>h.id===btn.dataset.undo);
      if(entry) openDesfazerModal(entry);
    };
  });

  document.querySelectorAll('#page-historico .th-sort').forEach(el=>{
    el.onclick = ()=>{
      const k = el.dataset.k;
      sortHist.dir = (sortHist.k===k) ? -sortHist.dir : 1;
      sortHist.k = k;
      renderHistorico();
      document.querySelectorAll('#page-historico .th-sort').forEach(s=>s.textContent='↕');
      el.textContent = sortHist.dir===1?'↓':'↑';
    };
  });

  if(window.feather) feather.replace();
}

/* ===== Modais base ===== */
function showOverlay(){ overlay.hidden=false; overlay.style.opacity='1'; }
function hideOverlay(){ overlay.hidden=true; overlay.style.opacity='0'; }
function openModal(id){ document.getElementById(id).hidden=false; showOverlay(); if(window.feather) feather.replace(); }
function closeModal(id){ document.getElementById(id).hidden=true; hideOverlay(); }

/* Aprovar/Recusar/Desfazer */
function openAprovarModal(item){
  actionTargetId = item.id;
  document.getElementById('aprovarTexto').textContent = `Deseja confirmar a aprovação da hora extra de ${item.tecnico}?`;
  openModal('modalAprovar');
}
function openRecusarModal(item){
  actionTargetId = item.id;
  document.getElementById('justificativa').value='';
  document.getElementById('recusarTexto').textContent = `Adicione uma justificativa para recusar a hora extra de ${item.tecnico}`;
  openModal('modalRecusar');
}
function openDesfazerModal(historyEntry){
  actionHistoryEntry = historyEntry;
  document.getElementById('desfazerTexto').textContent = `Deseja desfazer a aprovação da hora extra de ${historyEntry.tecnico}? Esta ação retornará a solicitação para a lista de pendentes.`;
  openModal('modalDesfazer');
}

/* Bind modais (cliques) */
document.getElementById('aprovarCancelar').onclick = ()=>closeModal('modalAprovar');
document.getElementById('aprovarConfirmar').onclick = ()=>{
  if(!actionTargetId) return;
  const idx = DATA.pendentes.findIndex(p=>p.id===actionTargetId);
  if(idx === -1){ closeModal('modalAprovar'); return; }
  const item = DATA.pendentes[idx];
  DATA.cumpridas.push({ id:genId(), tecnico:item.tecnico, encarregado:item.encarregado, obra:item.obra, data:item.data, duracao:item.duracao, custo:item.custo });
  DATA.historico.push({ id:genId(), status:'Aprovado', dataRecebimento:item.dataRecebimento, encarregado:item.encarregado, tecnico:item.tecnico, obra:item.obra, data:item.data, duracao:item.duracao, custo:item.custo });
  DATA.pendentes.splice(idx,1);
  DATA.saldo = Number((DATA.saldo - item.custo).toFixed(2));
  renderAll(); closeModal('modalAprovar');
};

document.getElementById('recusarCancelar').onclick = ()=>closeModal('modalRecusar');
document.getElementById('recusarClose').onclick = ()=>closeModal('modalRecusar');
document.getElementById('recusarConfirmar').onclick = ()=>{
  const justificativa = document.getElementById('justificativa').value.trim();
  if(!justificativa){ alert('Por favor, adicione uma justificativa para a recusa.'); return; }
  if(!actionTargetId) return;
  const idx = DATA.pendentes.findIndex(p=>p.id===actionTargetId);
  if(idx === -1){ closeModal('modalRecusar'); return; }
  const item = DATA.pendentes[idx];
  DATA.historico.push({ id:genId(), status:'Recusado', dataRecebimento:item.dataRecebimento, encarregado:item.encarregado, tecnico:item.tecnico, obra:item.obra, data:item.data, duracao:item.duracao, custo:item.custo, justificativa });
  DATA.pendentes.splice(idx,1);
  renderAll(); closeModal('modalRecusar');
};

document.getElementById('desfazerCancelar').onclick = ()=>closeModal('modalDesfazer');
document.getElementById('desfazerConfirmar').onclick = ()=>{
  if(!actionHistoryEntry) return;
  const idx = DATA.historico.findIndex(h=>h.id===actionHistoryEntry.id);
  if(idx === -1){ closeModal('modalDesfazer'); return; }
  const entry = DATA.historico[idx];
  if(entry.status === 'Aprovado'){
    const i = DATA.cumpridas.findIndex(c=>c.tecnico===entry.tecnico && c.data===entry.data && Number(c.custo)===Number(entry.custo));
    if(i !== -1) DATA.cumpridas.splice(i,1);
    DATA.saldo = Number((DATA.saldo + entry.custo).toFixed(2));
  }
  DATA.pendentes.push({ id:genId(), dataRecebimento:entry.dataRecebimento, encarregado:entry.encarregado, tecnico:entry.tecnico, obra:entry.obra, data:entry.data, duracao:entry.duracao, custo:entry.custo });
  DATA.historico.splice(idx,1);
  renderAll(); closeModal('modalDesfazer');
};

/* Modal senha */
const modalPassword = document.getElementById('modalPassword');
document.getElementById('openPassword').onclick = ()=>{ toggleProfile(false); modalPassword.classList.add('show'); };
document.getElementById('passwordClose').onclick = ()=>modalPassword.classList.remove('show');
document.getElementById('passwordCancel').onclick = ()=>modalPassword.classList.remove('show');
modalPassword.addEventListener('click',(e)=>{ if(e.target===modalPassword) modalPassword.classList.remove('show'); });
document.getElementById('passwordForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const a = document.getElementById('newPassword').value.trim();
  const b = document.getElementById('confirmPassword').value.trim();
  const err = document.getElementById('passwordError');
  const ok  = document.getElementById('passwordOk');
  err.hidden = true; ok.hidden = true;
  if(a !== b){ err.textContent = 'As senhas não coincidem. Tente novamente.'; err.hidden = false; return; }
  ok.textContent = 'Senha alterada com sucesso!'; ok.hidden = false;
  setTimeout(()=>modalPassword.classList.remove('show'), 900);
});

/* Remover/Novo técnico */
document.getElementById('rmTecClose').onclick = ()=>closeModal('modalRemoveTec');
document.getElementById('rmTecCancel').onclick = ()=>closeModal('modalRemoveTec');
document.getElementById('rmTecConfirm').onclick = ()=>{
  if(!rmTecTarget) return;
  const i = DATA.tecnicos.findIndex(t=>t.nome===rmTecTarget);
  if(i>-1) DATA.tecnicos.splice(i,1);
  rmTecTarget=null; renderAll(); closeModal('modalRemoveTec');
};
document.getElementById('novoTecClose').onclick = ()=>closeModal('modalNovoTec');
document.getElementById('novoTecCancel').onclick = ()=>closeModal('modalNovoTec');
document.getElementById('novoTecAdd').onclick = ()=>{
  const nome=document.getElementById('novoNome').value.trim();
  const horas=Number(document.getElementById('novoHoras').value);
  const total=Number(document.getElementById('novoTotal').value);
  if(!nome||isNaN(horas)||isNaN(total)){ alert('Preencha os campos corretamente.'); return; }
  DATA.tecnicos.push({ nome, horas:`${horas}h`, custo: total });
  renderAll(); closeModal('modalNovoTec');
};

/* Suporte TI */
document.getElementById('btnSuporte').onclick = ()=>openModal('modalSuporte');
document.getElementById('suporteClose').onclick = ()=>closeModal('modalSuporte');
document.getElementById('copyEmail').onclick = ()=>navigator.clipboard.writeText('ti@fortes.eng');
document.getElementById('copyTel').onclick = ()=>navigator.clipboard.writeText('(27) 99999-0000');
document.getElementById('btnMail').onclick = ()=>{
  const body = encodeURIComponent(document.getElementById('suporteMsg').value||'');
  window.location.href = `mailto:ti@fortes.eng?subject=Suporte%20de%20TI&body=${body}`;
};
document.getElementById('btnWhats').onclick = ()=>{
  const msg = encodeURIComponent(document.getElementById('suporteMsg').value||'Olá, preciso de suporte.');
  window.open(`https://wa.me/5527999990000?text=${msg}`,'_blank');
};

/* Teclas globais */
window.addEventListener('keydown', (e)=>{
  if(e.key==='Escape'){
    ['modalAprovar','modalRecusar','modalDesfazer','modalRemoveTec','modalNovoTec','modalSuporte']
      .forEach(id=>{ const el=document.getElementById(id); if(el && !el.hidden) closeModal(id); });
    if(modalPassword.classList.contains('show')) modalPassword.classList.remove('show');
  }
});

/* ===== CSV ===== */
function exportCSV(page){
  let rows = [];
  if(page==='pendentes'){
    rows = [['Data Recebimento','Encarregado','Técnico','Obra','Data','Duração','Custo']];
    DATA.pendentes.forEach(p=>rows.push([p.dataRecebimento,p.encarregado,p.tecnico,p.obra,p.data,p.duracao,money(p.custo)]));
  }else if(page==='cumpridas'){
    rows = [['Técnico','Encarregado','Obra','Data','Duração','Custo']];
    DATA.cumpridas.forEach(c=>rows.push([c.tecnico,c.encarregado||'-',c.obra,c.data,c.duracao,money(c.custo)]));
  }else if(page==='tecnicos'){
    rows = [['Nome','Horas','Total']];
    DATA.tecnicos.forEach(t=>rows.push([t.nome, t.horas||t.hours, money(t.custo)]));
  }else if(page==='historico'){
    rows = [['Status','Data Recebimento','Encarregado','Técnico','Obra','Data','Duração','Custo']];
    DATA.historico.forEach(h=>rows.push([h.status,h.dataRecebimento,h.encarregado,h.tecnico,h.obra,h.data,h.duracao,money(h.custo)]));
  }
  const csv = rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`${page}.csv`; a.click();
  URL.revokeObjectURL(url);
}

/* Primeira seleção de ações */
navigateTo('pendentes');