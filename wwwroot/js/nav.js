// nav.js — menú hamburguesa y soporte táctil para agrandar tarjetas en celulares
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("header nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      toggle.textContent = isOpen ? "✕" : "☰";
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    // Cierra el menú al tocar un link (por ejemplo en index.html, que es una sola página larga)
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        toggle.textContent = "☰";
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Efecto táctil en celulares: al tocar una tarjeta se agranda suavemente todo el cuadro
  document.addEventListener("click", (e) => {
    // Si hizo clic en botones, enlaces o controles interactivos, permitir su acción normal
    if (e.target.closest("button, a, input, select, textarea, .btn")) {
      return;
    }

    const card = e.target.closest(".item-card, .gallery-item");
    if (!card) {
      document.querySelectorAll(".item-card.is-active, .gallery-item.is-active").forEach(c => c.classList.remove("is-active"));
      return;
    }

    if (card.classList.contains("is-active")) {
      card.classList.remove("is-active");
    } else {
      document.querySelectorAll(".item-card.is-active, .gallery-item.is-active").forEach(c => c.classList.remove("is-active"));
      card.classList.add("is-active");
    }
  });

  // Banner de Consentimiento de Cookies y Privacidad
  if (!localStorage.getItem("ft_cookie_consent")) {
    const banner = document.createElement("div");
    banner.className = "cookie-banner";
    banner.id = "ft-cookie-banner";
    banner.innerHTML = `
      <div class="cookie-content">
        <span class="cookie-icon">🍪</span>
        <p class="cookie-text">
          Utilizamos almacenamiento local y cookies técnicas para recordar tu carrito y brindarte una experiencia segura. Al continuar navegando, aceptas nuestros 
          <a href="privacidad-terminos.html">Términos y Política de Privacidad</a>.
        </p>
      </div>
      <div class="cookie-actions">
        <button id="ft-accept-cookie-btn" class="cookie-btn-accept">Aceptar y Continuar</button>
      </div>
    `;
    document.body.appendChild(banner);

    const acceptBtn = document.getElementById("ft-accept-cookie-btn");
    if (acceptBtn) {
      acceptBtn.addEventListener("click", () => {
        localStorage.setItem("ft_cookie_consent", "accepted");
        banner.style.transition = "transform 0.3s ease, opacity 0.3s ease";
        banner.style.transform = "translateY(100%)";
        banner.style.opacity = "0";
        setTimeout(() => banner.remove(), 350);
      });
    }
  }
});

