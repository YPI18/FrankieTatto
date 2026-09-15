// auth-modal.js — Gestión de Autenticación de Clientes (Login y Registro) conectado a PostgreSQL
const CustomerAuth = {
  KEY: "frankie_customer",

  get() {
    try {
      const raw = localStorage.getItem(this.KEY) || localStorage.getItem("frankie_auth");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
    // Sincronizar con frankie_auth para compatibilidad
    localStorage.setItem("frankie_auth", JSON.stringify(data));
    this.updateNavbar();
    window.dispatchEvent(new CustomEvent("customer-auth-changed", { detail: data }));
  },

  async clear() {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem("frankie_auth");
    this.updateNavbar();
    window.dispatchEvent(new CustomEvent("customer-auth-changed", { detail: null }));
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) { }
  },

  isLoggedIn() {
    const user = this.get();
    return !!(user && user.token);
  },

  openModal(defaultTab = "login") {
    let modal = document.getElementById("ft-auth-modal");
    if (!modal) {
      this.createUI();
      modal = document.getElementById("ft-auth-modal");
    }
    modal.classList.remove("ft-hidden");
    this.switchTab(defaultTab);
  },

  closeModal() {
    const modal = document.getElementById("ft-auth-modal");
    if (modal) modal.classList.add("ft-hidden");
  },

  switchTab(tab) {
    const loginForm = document.getElementById("ft-login-form");
    const regForm = document.getElementById("ft-register-form");
    const tabLogin = document.getElementById("ft-tab-login");
    const tabReg = document.getElementById("ft-tab-register");
    const errorBox = document.getElementById("ft-auth-error");
    if (errorBox) errorBox.classList.add("ft-hidden");

    if (tab === "register") {
      loginForm.classList.add("ft-hidden");
      regForm.classList.remove("ft-hidden");
      tabLogin.classList.remove("active");
      tabReg.classList.add("active");
    } else {
      regForm.classList.add("ft-hidden");
      loginForm.classList.remove("ft-hidden");
      tabReg.classList.remove("active");
      tabLogin.classList.add("active");
    }
  },

  createUI() {
    if (document.getElementById("ft-auth-modal")) return;

    const modal = document.createElement("div");
    modal.id = "ft-auth-modal";
    modal.className = "ft-modal-overlay ft-hidden";
    modal.innerHTML = `
      <div class="ft-modal-card">
        <button class="ft-modal-close" id="ft-auth-close-btn">&times;</button>
        <div class="ft-modal-header">
          <h3>Franki <span>Tattoo</span></h3>
          <p class="ft-modal-subtitle">Tu cuenta para compras y reservas</p>
        </div>

        <div class="ft-auth-tabs">
          <button id="ft-tab-login" class="ft-auth-tab active">Iniciar Sesión</button>
          <button id="ft-tab-register" class="ft-auth-tab">Crear Cuenta</button>
        </div>

        <div id="ft-auth-error" class="ft-auth-alert ft-hidden"></div>

        <!-- Formulario Login -->
        <form id="ft-login-form" class="ft-auth-form">
          <div class="ft-form-group">
            <label>Correo Electrónico</label>
            <input type="email" id="ft-login-email" required placeholder="tu@correo.com" autocomplete="email" />
          </div>
          <div class="ft-form-group">
            <label>Contraseña</label>
            <input type="password" id="ft-login-password" required placeholder="••••••••" autocomplete="current-password" />
          </div>
          <div class="ft-form-group ft-hidden" id="ft-login-2fa-group">
            <label>Código de Seguridad (2FA)</label>
            <input type="text" id="ft-login-2fa-code" placeholder="Código de 6 dígitos de Google Authenticator" autocomplete="one-time-code" />
          </div>
          <button type="submit" class="ft-btn-primary" id="ft-login-submit">Ingresar a mi Cuenta</button>
          <p class="ft-form-footer">¿No tienes cuenta? <a href="#" id="ft-switch-to-register">Regístrate aquí</a></p>
        </form>

        <!-- Formulario Registro -->
        <form id="ft-register-form" class="ft-auth-form ft-hidden">
          <div class="ft-form-group">
            <label>Nombre Completo</label>
            <input type="text" id="ft-reg-name" required placeholder="Ej: Juan Pérez" autocomplete="name" />
          </div>
          <div class="ft-form-group">
            <label>Correo Electrónico</label>
            <input type="email" id="ft-reg-email" required placeholder="tu@correo.com" autocomplete="email" />
          </div>
          <div class="ft-form-group">
            <label>Teléfono / WhatsApp (Opcional)</label>
            <input type="tel" id="ft-reg-phone" placeholder="Ej: 0991548585" autocomplete="tel" />
          </div>
          <div class="ft-form-group">
            <label>Contraseña (mínimo 6 caracteres)</label>
            <input type="password" id="ft-reg-password" required minlength="6" placeholder="••••••••" autocomplete="new-password" />
          </div>
          <button type="submit" class="ft-btn-primary" id="ft-reg-submit">Crear Cuenta y Continuar</button>
          <p class="ft-form-footer">¿Ya tienes cuenta? <a href="#" id="ft-switch-to-login">Inicia sesión</a></p>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    // Eventos
    document.getElementById("ft-auth-close-btn").addEventListener("click", () => this.closeModal());
    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.closeModal();
    });

    document.getElementById("ft-tab-login").addEventListener("click", () => this.switchTab("login"));
    document.getElementById("ft-tab-register").addEventListener("click", () => this.switchTab("register"));
    document.getElementById("ft-switch-to-register").addEventListener("click", (e) => {
      e.preventDefault();
      this.switchTab("register");
    });
    document.getElementById("ft-switch-to-login").addEventListener("click", (e) => {
      e.preventDefault();
      this.switchTab("login");
    });

    // Submit Login
    document.getElementById("ft-login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("ft-login-email").value.trim();
      const pass = document.getElementById("ft-login-password").value;
      const twoFactorInput = document.getElementById("ft-login-2fa-code");
      const twoFactorCode = twoFactorInput ? twoFactorInput.value.trim() : "";
      const btn = document.getElementById("ft-login-submit");

      btn.disabled = true;
      btn.textContent = "Ingresando...";
      this.showError("");

      try {
        const payload = { correo: email, contrasena: pass };
        if (twoFactorCode) payload.codigo2fa = twoFactorCode;

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (res.ok && data.requiere2fa) {
            document.getElementById("ft-login-2fa-group").classList.remove("ft-hidden");
            this.showError("Por favor, ingresa el código de 6 dígitos de tu app autenticadora.");
            document.getElementById("ft-login-error")?.classList?.remove("ft-hidden");
            if (twoFactorInput) twoFactorInput.focus();
            btn.disabled = false;
            btn.textContent = "Verificar y Entrar";
            return;
        }

        if (!res.ok) {
          throw new Error(data || "Error al iniciar sesión.");
        }

        this.set(data);
        this.closeModal();

        const isStaff = this.isStaff(data);
        if (isStaff) {
          this.showToast("👑 ¡Bienvenido/a Franki! Abriendo Panel de Gestión...");
          setTimeout(() => {
            window.location.href = "estudio-interno.html";
          }, 800);
        } else {
          this.showToast(`¡Bienvenido/a de nuevo, ${data.nombreCompleto || "Cliente"}!`);
        }
      } catch (err) {
        this.showError(err.message || "Credenciales incorrectas.");
      } finally {
        btn.disabled = false;
        btn.textContent = "Ingresar a mi Cuenta";
      }
    });

    // Submit Registro
    document.getElementById("ft-register-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("ft-reg-name").value.trim();
      const email = document.getElementById("ft-reg-email").value.trim();
      const phone = document.getElementById("ft-reg-phone").value.trim();
      const pass = document.getElementById("ft-reg-password").value;
      const btn = document.getElementById("ft-reg-submit");

      btn.disabled = true;
      btn.textContent = "Creando cuenta...";
      this.showError("");

      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombreCompleto: name,
            correo: email,
            contrasena: pass,
            telefono: phone || null
          })
        });

        const data = await res.json();
        if (!res.ok) {
          const msg = Array.isArray(data) ? data.join(", ") : (data || "Error al registrar la cuenta.");
          throw new Error(msg);
        }

        this.set(data);
        this.closeModal();
        this.showToast(`¡Cuenta creada con éxito! Bienvenido/a ${data.nombreCompleto}`);
      } catch (err) {
        this.showError(err.message || "No se pudo registrar la cuenta.");
      } finally {
        btn.disabled = false;
        btn.textContent = "Crear Cuenta y Continuar";
      }
    });
  },

  isStaff(user) {
    user = user || this.get();
    return !!(user && Array.isArray(user.roles) && (user.roles.includes("Admin") || user.roles.includes("Employee")));
  },

  showError(msg) {
    const box = document.getElementById("ft-auth-error");
    if (!box) return;
    if (msg) {
      box.textContent = msg;
      box.classList.remove("ft-hidden");
    } else {
      box.classList.add("ft-hidden");
    }
  },

  showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "ft-toast";
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  },

  updateNavbar() {
    const desktopBtn = document.getElementById("ft-nav-user-btn");
    const mobileBtn = document.getElementById("ft-nav-user-btn-mobile");
    const user = this.get();
    const isStaff = this.isStaff(user);

    const updateBtn = (btn, isMobile) => {
      if (!btn) return;
      if (user && user.token) {
        if (isStaff) {
          btn.classList.add("admin-btn");
          btn.title = "👑 Panel de Gestión (Admin): " + (user.correo || "");
          btn.innerHTML = isMobile
            ? `<span class="ft-user-icon">👑</span>`
            : `<span class="ft-user-icon">👑</span><span class="ft-user-name">Panel Admin</span>`;
        } else {
          btn.classList.remove("admin-btn");
          const firstName = (user.nombreCompleto || "Cliente").split(" ")[0];
          btn.title = "Cuenta iniciada: " + (user.correo || "");
          btn.innerHTML = isMobile
            ? `<span class="ft-user-icon">👤</span>`
            : `<span class="ft-user-icon">👤</span><span class="ft-user-name">${firstName}</span>`;
        }
        btn.onclick = (e) => {
          e.stopPropagation();
          this.showUserMenu(btn);
        };
      } else {
        btn.classList.remove("admin-btn");
        btn.title = "Iniciar sesión o Registrarse";
        btn.innerHTML = isMobile
          ? `<span class="ft-user-icon">👤</span>`
          : `<span class="ft-user-icon">👤</span><span class="ft-user-name">Ingresar</span>`;
        btn.onclick = (e) => {
          e.stopPropagation();
          this.openModal("login");
        };
      }
    };

    updateBtn(desktopBtn, false);
    updateBtn(mobileBtn, true);
  },

  showUserMenu(anchorBtn) {
    const user = this.get();
    if (!user) return;

    const existingMenu = document.getElementById("ft-user-dropdown");
    if (existingMenu) {
      existingMenu.remove();
      return;
    }

    const isStaff = this.isStaff(user);
    const menu = document.createElement("div");
    menu.id = "ft-user-dropdown";
    menu.className = "ft-user-dropdown";

    const adminItemHtml = isStaff
      ? `<a href="estudio-interno.html" class="ft-dropdown-item ft-text-admin"><span>⚙️</span><span>Abrir Panel de Gestión ➔</span></a>`
      : "";

    menu.innerHTML = `
      <div class="ft-user-dropdown-header">
        <strong>${isStaff ? "👑 " : ""}${user.nombreCompleto || "Usuario"}</strong>
        <small>${user.correo || ""}</small>
        ${isStaff ? '<span class="ft-badge-admin">Administrador</span>' : ""}
      </div>
      <div class="ft-user-dropdown-actions">
        ${adminItemHtml}
        <button id="ft-logout-btn" class="ft-dropdown-item ft-text-danger">
          <span>🚪</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    `;

    const target = anchorBtn || document.getElementById("ft-nav-user-btn") || document.getElementById("ft-nav-user-btn-mobile");
    if (target && target.parentElement) {
      target.parentElement.appendChild(menu);
    } else {
      document.body.appendChild(menu);
    }

    document.getElementById("ft-logout-btn").addEventListener("click", () => {
      menu.remove();
      this.clear();
      this.showToast("Has cerrado sesión.");
    });

    // Cerrar al clickear afuera
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!menu.contains(e.target) && target && !target.contains(e.target)) {
          menu.remove();
          window.removeEventListener("click", closeMenu);
        }
      };
      window.addEventListener("click", closeMenu);
    }, 100);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  CustomerAuth.createUI();
  CustomerAuth.updateNavbar();
});
