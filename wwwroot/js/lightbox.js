// lightbox.js — Visor HD en pantalla completa para Franki Tattoo Studio
(function () {
  let lightboxEl = null;
  let currentItems = [];
  let currentIndex = 0;

  function createLightboxUI() {
    if (document.getElementById("ft-lightbox")) return;

    lightboxEl = document.createElement("div");
    lightboxEl.id = "ft-lightbox";
    lightboxEl.className = "ft-lightbox ft-hidden";
    lightboxEl.innerHTML = `
      <div class="ft-lightbox-backdrop"></div>
      <button class="ft-lightbox-close" title="Cerrar (Esc)">&times;</button>
      <button class="ft-lightbox-nav ft-lightbox-prev" title="Anterior (←)">&#10094;</button>
      <button class="ft-lightbox-nav ft-lightbox-next" title="Siguiente (→)">&#10095;</button>
      <div class="ft-lightbox-content">
        <div class="ft-lightbox-media-wrapper" id="ft-lightbox-media"></div>
        <div class="ft-lightbox-caption" id="ft-lightbox-caption"></div>
      </div>
    `;

    document.body.appendChild(lightboxEl);

    // Cerrar al pulsar el botón o fondo
    lightboxEl.querySelector(".ft-lightbox-close").addEventListener("click", closeLightbox);
    lightboxEl.querySelector(".ft-lightbox-backdrop").addEventListener("click", closeLightbox);

    // Navegación
    lightboxEl.querySelector(".ft-lightbox-prev").addEventListener("click", (e) => {
      e.stopPropagation();
      navigate(-1);
    });
    lightboxEl.querySelector(".ft-lightbox-next").addEventListener("click", (e) => {
      e.stopPropagation();
      navigate(1);
    });

    // Teclado
    document.addEventListener("keydown", (e) => {
      if (lightboxEl.classList.contains("ft-hidden")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    });

    // Soporte para gestos táctiles (swipe) en celular
    let touchStartX = 0;
    let touchEndX = 0;
    lightboxEl.addEventListener("touchstart", (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    lightboxEl.addEventListener("touchend", (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 45) {
        if (diff > 0) navigate(-1);
        else navigate(1);
      }
    }
  }

  function openLightbox(items, index = 0) {
    if (!items || items.length === 0) return;
    createLightboxUI();
    currentItems = items;
    currentIndex = index;
    renderItem(currentIndex);
    lightboxEl.classList.remove("ft-hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.add("ft-hidden");
    document.body.style.overflow = "";
  }

  function navigate(direction) {
    if (currentItems.length <= 1) return;
    currentIndex = (currentIndex + direction + currentItems.length) % currentItems.length;
    renderItem(currentIndex);
  }

  function renderItem(idx) {
    const item = currentItems[idx];
    if (!item) return;

    const mediaContainer = document.getElementById("ft-lightbox-media");
    const captionContainer = document.getElementById("ft-lightbox-caption");

    const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(item.src);
    mediaContainer.innerHTML = isVideo
      ? `<video src="${item.src}" controls autoplay playsinline loop class="ft-lightbox-media-el"></video>`
      : `<img src="${item.src}" alt="${item.title || ''}" class="ft-lightbox-media-el" />`;

    captionContainer.innerHTML = `
      <div class="ft-lb-title">${item.title || 'Franki Tattoo Studio'}</div>
      ${item.category ? `<div class="ft-lb-cat">${item.category}</div>` : ''}
      <div class="ft-lb-counter">${idx + 1} / ${currentItems.length}</div>
    `;

    const prevBtn = lightboxEl.querySelector(".ft-lightbox-prev");
    const nextBtn = lightboxEl.querySelector(".ft-lightbox-next");
    if (prevBtn && nextBtn) {
      const showArrows = currentItems.length > 1;
      prevBtn.style.display = showArrows ? "flex" : "none";
      nextBtn.style.display = showArrows ? "flex" : "none";
    }
  }

  function bindGalleries() {
    createLightboxUI();

    document.addEventListener("click", (e) => {
      if (e.target.closest("button, a.btn, a.btn-store-cta, .nav-action-btn")) return;

      const card = e.target.closest(".gallery-item, .item-card");
      if (!card) return;

      const img = card.querySelector("img, image");
      const video = card.querySelector("video");
      const mediaEl = img || video;
      if (!mediaEl) return;

      const mediaSrc = mediaEl.currentSrc || mediaEl.src || mediaEl.getAttribute("src");
      if (!mediaSrc) return;

      const parentGallery = card.closest(".gallery") || document.body;
      const allCards = Array.from(parentGallery.querySelectorAll(".gallery-item, .item-card"))
        .filter(c => c.querySelector("img, image, video"));

      const items = allCards.map(c => {
        const m = c.querySelector("img, image, video");
        const titleEl = c.querySelector(".gallery-overlay h3, .item-info h3");
        const title = titleEl ? titleEl.textContent.replace("•", "").trim() : "";
        const catEl = c.querySelector(".item-info p");
        const category = catEl ? catEl.textContent.trim() : "";
        return {
          src: m.currentSrc || m.src || m.getAttribute("src"),
          title: title,
          category: category
        };
      }).filter(item => item.src && !item.src.includes("franki-logo"));

      const targetIndex = items.findIndex(item => item.src === mediaSrc);

      if (items.length > 0) {
        e.preventDefault();
        openLightbox(items, targetIndex >= 0 ? targetIndex : 0);
      }
    });
  }

  window.FrankiLightbox = {
    open: openLightbox,
    close: closeLightbox
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindGalleries);
  } else {
    bindGalleries();
  }
})();
