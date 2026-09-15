// store.js — Carga dinámica de productos para la Tienda Frankie Tattoo
const Store = {
  /*
   * MAPA DE IMÁGENES DE PINTEREST (o cualquier enlace):
   * Puedes pegar aquí tus links directos de Pinterest o de cualquier imagen.
   * Si lo dejas vacío (""), automáticamente se muestra el recuadro estilizado (Placeholder)
   * listo con su diseño y dimensiones perfectas.
   */
  customImages: {
    // Vapes & Smokeshop
    "Pipa de Cristal Pyrex Artesanal": "images/smokeshop-pipas-cristal.jpg",
    "Blunts y Papelillos de Sabores": "images/smokeshop-blunts-papelillos.jpg",
    "Vape Desechable ElfBar 10000 Puffs (Blueberry Ice)": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSrhcsDKaywJYaMCfjZsO-nQu2aRDxQOVfjc-9KAyq3_l_S-1Rm3DyHwUYk&s=10",
    "Pod Kit Vaporesso XROS 3 Recargable": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiDciX31PVScN-QeskGLZXm6WnjiYXIr1Z0SCu3yWfAQdAGzX5UKfVW7RH&s=10",
    "Líquido E-Juice Premium 60ml (Mango Tango)": "https://www.tigovape.cl/wp-content/uploads/2025/08/Just-juice-Nic-Salt-Banner-e1754429124315.webp",
    "Sales de Nicotina NicSalts 30ml (Menta Polar)": "https://www.tigovape.cl/wp-content/uploads/2025/08/Just-juice-Nic-Salt-Banner-e1754429124315.webp",
    "Resistencias Vaporesso Mesh 0.6 ohm (Pack x4)": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSiDciX31PVScN-QeskGLZXm6WnjiYXIr1Z0SCu3yWfAQdAGzX5UKfVW7RH&s=10",

    // Piercings & Joyería
    "Argolla Hélix de Acero Quirúrgico 316L": "images/piercing-tragus-real.jpg",
    "Labret Acero Quirúrgico con Circonia Cúbica": "images/piercing-labret-real.jpg",
    "Septum Clicker Ornamental Tribal": "images/piercing-nostril-real.jpg",
    "Industrial Barbell Anodizado Tornasol": "images/piercing-industrial-real.jpg",
    "Nostril Piercing L-Shape en Oro Rosado": "images/piercing-nostril-real.jpg",
    "Banana Ombligo Acero Quirúrgico Hipoalergénico": "images/piercing-ombligo-real.jpg"
  },

  getIconForType(type) {
    if (type === "SmokeShop") return "💨";
    if (type === "Piercing") return "💎";
    if (type === "Artesania") return "🎨";
    return "⚡";
  },

  async renderStore(serviceType = "All", containerId = "tienda-products-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="ft-loading-products">
        <div class="ft-spinner"></div>
        <p>Cargando productos de la tienda...</p>
      </div>
    `;

    try {
      const url = (serviceType && serviceType !== "All") 
        ? `/api/products?type=${serviceType}`
        : `/api/products`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al consultar productos");
      let products = await res.json();

      // Si es "All", excluimos los de tipo Tatuaje si solo queremos vender artículos físicos
      if (serviceType === "All") {
        products = products.filter(p => (p.tipoServicio || p.type) !== "Tattoo");
      }

      if (!products || products.length === 0) {
        container.innerHTML = `
          <div class="ft-cart-empty" style="grid-column: 1 / -1; padding: 4.5rem 1.5rem; text-align: center; background: #181818; border: 1px solid #2a2a2a; border-radius: 14px; max-width: 600px; margin: 2rem auto;">
            <span style="font-size: 3.5rem; display: block; margin-bottom: 1rem;">📦</span>
            <h3 style="color: #00e676; margin-bottom: 0.8rem; font-size: 1.4rem;">Catálogo en Configuración</h3>
            <p style="color: #aaa; font-size: 1rem; line-height: 1.6; margin: 0 auto 1.8rem; max-width: 480px;">
              Estamos actualizando el inventario de la tienda con Franki. Si deseas consultar por piezas de joyería en acero quirúrgico, vapes o accesorios disponibles en el estudio, escríbenos directamente.
            </p>
            <a href="https://wa.me/593991548585?text=Hola%20Franki,%20deseo%20consultar%20por%20un%20producto%20o%20accesorio" target="_blank" rel="noopener" class="btn" style="background: #00e676; color: #000; font-weight: bold; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px;">
              💬 Consultar Disponibilidad por WhatsApp
            </a>
          </div>
        `;
        return;
      }

      container.innerHTML = "";
      products.forEach((prod) => {
        const name = prod.nombre || prod.name || "";
        const type = prod.tipoServicio || prod.type || "General";
        const icon = this.getIconForType(type);
        const customUrl = prod.imageUrl || this.customImages[name];

        const price = parseFloat(prod.precio || prod.price || 0).toFixed(2);
        const stock = prod.inventario !== undefined ? prod.inventario : (prod.stock !== undefined ? prod.stock : 10);
        const inStock = stock > 0;

        const card = document.createElement("div");
        card.className = "item-card ft-product-card";

        // HTML del medio (si hay imagen personalizada la muestra, si no el placeholder elegante)
        let mediaHtml = "";
        if (customUrl) {
          const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(customUrl);
          mediaHtml = `
            <div class="card-media">
              ${isVideo 
                ? `<video src="${customUrl}" controls muted playsinline loop style="width:100%; height:220px; object-fit:cover; background:#000;"></video>`
                : `<img src="${customUrl}" alt="${name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                   <div class="img-placeholder" style="display:none;">
                     <div class="ph-icon">${icon}</div>
                     <span>${name}</span>
                   </div>`
              }
            </div>
          `;
        } else {
          mediaHtml = `
            <div class="img-placeholder">
              <div class="ph-icon">${icon}</div>
              <span>${name}</span>
            </div>
          `;
        }

        card.innerHTML = `
          <div class="price-tag">$${price}</div>
          ${mediaHtml}
          <div class="item-info">
            <span class="ft-product-category">${prod.nombreCategoria || type}</span>
            <h3>${name}</h3>
            <p>${prod.descripcion || prod.description || "Producto garantizado por Franki Tattoo Studio."}</p>
            
            <div class="ft-stock-status">
              ${inStock 
                ? `<span class="ft-badge-in-stock">✓ Disponible (${stock} en stock)</span>` 
                : `<span class="ft-badge-out-stock">✕ Agotado</span>`
              }
            </div>

            <div class="ft-card-actions">
              ${inStock ? `
                <div class="ft-qty-selector">
                  <button type="button" class="ft-card-qty-minus">-</button>
                  <span class="ft-card-qty-value">1</span>
                  <button type="button" class="ft-card-qty-plus">+</button>
                </div>
                <button type="button" class="btn ft-btn-add-cart">
                  🛒 Agregar
                </button>
              ` : `
                <button type="button" class="btn btn-disabled" disabled style="opacity:0.5; cursor:not-allowed; width:100%;">
                  Agotado
                </button>
              `}
            </div>
          </div>
        `;

        if (inStock) {
          let currentQty = 1;
          const qtyVal = card.querySelector(".ft-card-qty-value");
          const btnMinus = card.querySelector(".ft-card-qty-minus");
          const btnPlus = card.querySelector(".ft-card-qty-plus");
          const btnAdd = card.querySelector(".ft-btn-add-cart");

          btnMinus.addEventListener("click", () => {
            if (currentQty > 1) {
              currentQty--;
              qtyVal.textContent = currentQty;
            }
          });

          btnPlus.addEventListener("click", () => {
            if (currentQty < stock) {
              currentQty++;
              qtyVal.textContent = currentQty;
            }
          });

          btnAdd.addEventListener("click", () => {
            Cart.addItem(prod, currentQty);
          });
        }

        container.appendChild(card);
      });

    } catch (err) {
      console.error(err);
      container.innerHTML = `
        <div class="ft-cart-empty" style="grid-column: 1 / -1; padding: 3rem 1rem;">
          <p style="color:#ff5252;">No se pudieron cargar los productos en este momento.</p>
          <button class="btn" onclick="Store.renderStore('${serviceType}', '${containerId}')" style="margin-top:1rem;">Reintentar</button>
        </div>
      `;
    }
  }
};
