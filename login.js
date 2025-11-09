const tabs = document.querySelectorAll(".tab");
const forms = document.querySelectorAll(".form");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    forms.forEach(f => f.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

const roles = document.querySelectorAll(".role-btn");
roles.forEach(btn => {
  btn.addEventListener("click", () => {
    roles.forEach(r => {
      r.classList.remove("active");
      r.setAttribute("aria-pressed","false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed","true");

    const cargo = btn.dataset.role;
    const btnPrimary = document.querySelectorAll(".btn-primary");
    btnPrimary.forEach(b => {
      if (cargo === "gestor") b.textContent = b.textContent.replace(/(Técnico|Encarregado)/, "Gestor");
      if (cargo === "tecnico") b.textContent = b.textContent.replace(/(Gestor|Encarregado)/, "Técnico");
      if (cargo === "encarregado") b.textContent = b.textContent.replace(/(Gestor|Técnico)/, "Encarregado");
    });
  });
});


window.addEventListener('load', () => {
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.initialize({
      client_id: "SEU_CLIENT_ID_DO_GOOGLE_AQUI.apps.googleusercontent.com",
      callback: handleCredentialResponse
    });

    const opts = { theme: "outline", size: "large", text: "continue_with", width: 300 };

    const gLogin = document.getElementById("google-login");
    const gRegister = document.getElementById("google-register");
    if (gLogin) google.accounts.id.renderButton(gLogin, opts);
    if (gRegister) google.accounts.id.renderButton(gRegister, opts);
  } else {

    const fallback = (elId) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.innerHTML = `
        <button class="btn-google-fallback" type="button">
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.1 0 5.5 1.1 7.4 2.4l5.6-5.6C34.7 3.4 29.7 1.5 24 1.5 14.8 1.5 6.9 6.8 3 14.5l6.6 5.2C11.5 15.1 17.2 9.5 24 9.5z"></path></svg>
          Entrar com Google
        </button>`;
    };
    fallback('google-login');
    fallback('google-register');
  }
});

function handleCredentialResponse(response) {
  console.log("Token JWT do Google:", response.credential);
  alert("Login com Google bem-sucedido!");
}