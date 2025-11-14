// Rotas simuladas por cargo (ajuste para as reais do seu projeto):
const ROUTES = {
  tecnico: 'dashboard_tecnico.html',
  encarregado: 'dashboard_encarregado.html',
  gestor: 'dashboard_gestor.html'
};

let currentRole = 'tecnico';

// Helpers
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

function setActiveRole(btn){
  $$('.role-card').forEach(b=>{
    b.classList.remove('active');
    b.setAttribute('aria-pressed','false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-pressed','true');
  currentRole = btn.dataset.role;
}

function switchTab(tab){
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  $$('.form').forEach(f => f.classList.remove('show'));
  (tab === 'login' ? $('#form-login') : $('#form-register')).classList.add('show');
}

// Eventos UI
$$('.role-card').forEach(btn => btn.addEventListener('click', () => setActiveRole(btn)));
$$('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

switchTab('login'); // padrão

// ===== Entrar (loading + rota por cargo) =====
$('#form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const userOrEmail = $('#login-email').value.trim();
  const pass  = $('#login-pass').value.trim();
  if(!userOrEmail){ alert('Informe seu usuário ou email.'); return; }
  if(!pass){ alert('Informe sua senha.'); return; }

  const btn = $('#login-submit');
  btn.classList.add('loading');
  btn.disabled = true;

  setTimeout(() => {
    localStorage.setItem('fe:userRole', currentRole);
    window.location.href = ROUTES[currentRole] || 'index.html';
  }, 1200);
});

// ===== Cadastrar (boas-vindas) =====
$('#form-register').addEventListener('submit', (e) => {
  e.preventDefault();

  const name = $('#reg-name').value.trim();
  const mail = $('#reg-email').value.trim();
  const tel  = $('#reg-phone').value.trim();
  const p1   = $('#reg-pass').value.trim();
  const user = $('#reg-user').value.trim();

  if(!name || !mail || !p1 || !user){
    alert('Preencha os campos obrigatórios: Nome, Email, Senha e Usuário.');
    return;
  }

  const overlay = $('#welcome-overlay');
  overlay.classList.add('show');

  setTimeout(() => {
    overlay.classList.remove('show');
    switchTab('login');
    $('#login-email').value = user || mail;
    $('#login-pass').value = '';
  }, 1700);
});

// ===== FAB Ajuda + Modal de Suporte =====
const modal = $('#modal-support');
const fab = $('#fab-help');
const closeBtn = $('#modal-support .modal-close');
const msg = $('#support-message');
const sendBtn = $('#support-send');

const defaultMessage = '';

function openSupport(){
  msg.value = defaultMessage;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(()=> msg.focus(), 0);
}
function closeSupport(){
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
}

fab.addEventListener('click', openSupport);
closeBtn.addEventListener('click', closeSupport);
modal.addEventListener('click', (e)=>{ if(e.target === modal) closeSupport(); });
document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape' && modal.classList.contains('show')) closeSupport(); });

sendBtn.addEventListener('click', ()=>{
  const text = msg.value.trim();
  if(!text){
    alert('Por favor, descreva sua dúvida antes de enviar.');
    msg.focus();
    return;
  }
  alert('Mensagem enviada ao suporte. Em breve entraremos em contato.');
  closeSupport();
});