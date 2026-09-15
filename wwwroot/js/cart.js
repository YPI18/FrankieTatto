// =========================================================================
// 🏦 CONFIGURACIÓN DE CUENTAS BANCARIAS Y PAGOS — FRANKIE TATTOO STUDIO
// Edita los valores de este objeto cuando Franki te pase sus datos reales.
// Todo el sistema (textos, botones de copiar y comprobantes) se actualiza solo.
// =========================================================================
const FRANKI_PAYMENT_CONFIG = {
  // 1. Banco Pichincha (Transferencia Directa entre cuentas Pichincha)
  pichincha: {
    banco: "Banco Pichincha",
    tipoCuenta: "Cuenta de Ahorros",
    numero: "2207894512",              // <-- EDITAR: Número de cuenta Pichincha
    titular: "Franki Tattoo Studio",    // <-- EDITAR: Nombre del titular
    identificacion: "1003456789001",    // <-- EDITAR: Cédula o RUC
    email: "pagos@frankitattoo.com"     // <-- EDITAR: Correo para confirmación
  },

  // 2. DeUna (App Móvil Pichincha / QR)
  deuna: {
    telefono: "099 154 8585",           // <-- EDITAR: Teléfono celular de DeUna
    beneficiario: "Franki Tattoo",      // <-- EDITAR: Nombre que sale en DeUna
    qrUrl: ""                           // <-- EDITAR (opcional): URL de foto QR
  },

  // 3. Otros Bancos (Transferencia Interbancaria: Guayaquil, Produbanco, Pacífico, Coops)
  interbancario: {
    bancoDestino: "Banco Pichincha",
    tipoCuenta: "Cuenta de Ahorros",
    numero: "2207894512",              // <-- EDITAR: Mismo número de cuenta de Franki
    titular: "Franki Tattoo Studio",    // <-- EDITAR: Titular completo
    identificacion: "1003456789001",    // <-- EDITAR: Cédula / RUC (obligatorio para interbancario)
    email: "pagos@frankitattoo.com"     // <-- EDITAR: Correo donde llega el aviso interbancario
  },

  // WhatsApp oficial para coordinar compras y citas
  whatsappNumero: "593991548585"
};

const Cart = {
  KEY: "frankie_cart",
  uploadedVoucherUrl: null,
  uploadedVoucherFile: null,

  copyText(text, btn) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = "✅ ¡Copiado!";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove("copied");
      }, 2000);
    }
    this.showToast(`Copiado: ${text}`);
  },

  async handleVoucherUpload(input, type) {
    const file = input.files?.[0];
    if (!file) return;
    this.uploadedVoucherFile = file;

    const statusEl = document.getElementById(`ft-voucher-${type}-status`);
    if (statusEl) {
      statusEl.classList.remove("ft-hidden");
      statusEl.textContent = "⏳ Subiendo comprobante...";
      statusEl.style.color = "#ffd600";
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("No se pudo subir la imagen");

      const data = await res.json();
      this.uploadedVoucherUrl = data.url;

      if (statusEl) {
        statusEl.innerHTML = `✅ <strong>Comprobante adjuntado:</strong> <a href="${data.url}" target="_blank" style="color:#00e676; text-decoration:underline;">Ver comprobante</a>`;
        statusEl.style.color = "#00e676";
      }
      this.showToast("¡Comprobante adjuntado con éxito!");
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = "❌ Error al subir imagen. Puedes adjuntarla por WhatsApp.";
        statusEl.style.color = "#ff5252";
      }
    }
  },

  getItems() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  setItems(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    this.updateCartBadge();
    this.renderCartDrawer();
  },

  addItem(product, qty = 1) {
    const items = this.getItems();
    const existing = items.find((i) => i.id === product.id);

    if (existing) {
      existing.quantity += qty;
    } else {
      items.push({
        id: product.id,
        name: product.nombre || product.name,
        price: parseFloat(product.precio || product.price || 0),
        quantity: qty,
        type: product.tipoServicio || product.type,
        categoryName: product.nombreCategoria || "",
        image: product.imageUrl || (window.Store && window.Store.customImages[product.nombre || product.name]) || this.getDefaultImage(product.tipoServicio || product.type)
      });
    }

    this.setItems(items);
    this.showToast(`¡"${product.nombre || product.name}" agregado al carrito!`);
    this.openDrawer();
  },

  updateQuantity(id, qty) {
    let items = this.getItems();
    if (qty <= 0) {
      items = items.filter((i) => i.id !== id);
    } else {
      const item = items.find((i) => i.id === id);
      if (item) item.quantity = qty;
    }
    this.setItems(items);
  },

  removeItem(id) {
    let items = this.getItems();
    items = items.filter((i) => i.id !== id);
    this.setItems(items);
  },

  clear() {
    localStorage.removeItem(this.KEY);
    this.updateCartBadge();
    this.renderCartDrawer();
  },

  getTotal() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getCount() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getDefaultImage(type) {
    if (type === "SmokeShop") return "img/vape-disposable.jpg";
    if (type === "Piercing") return "https://patantattoo.com/wp-content/uploads/2024/06/helix-piercing-oreja-jerez-3-scaled.jpg";
    if (type === "Artesania") return "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTBg8Ko2LB9ki8A7kXFIFlxlbh31eIKsRrVjShDenopsdrjbpnudAjwkg4&s=10";
    return "https://patantattoo.com/wp-content/uploads/2024/06/helix-piercing-oreja-jerez-3-scaled.jpg";
  },

  updateCartBadge() {
    const badge = document.getElementById("ft-nav-cart-badge");
    if (!badge) return;
    const count = this.getCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline-flex" : "none";
  },

  createUI() {
    if (document.getElementById("ft-cart-drawer")) return;

    // 1. Drawer del Carrito
    const drawer = document.createElement("div");
    drawer.id = "ft-cart-drawer";
    drawer.className = "ft-drawer ft-hidden";
    drawer.innerHTML = `
      <div class="ft-drawer-overlay" id="ft-cart-overlay"></div>
      <div class="ft-drawer-content">
        <div class="ft-drawer-header">
          <h3>Tu Carrito de Compras 🛒</h3>
          <button class="ft-modal-close" id="ft-cart-close">&times;</button>
        </div>
        <div id="ft-cart-items-list" class="ft-drawer-body"></div>
        <div class="ft-drawer-footer" id="ft-cart-footer">
          <div class="ft-cart-summary">
            <span>Subtotal:</span>
            <span id="ft-cart-subtotal" class="ft-cart-total-price">$0.00</span>
          </div>
          <p class="ft-cart-note">Impuestos incluidos. Retiro en local o envío en Ibarra.</p>
          <button id="ft-cart-checkout-btn" class="ft-btn-primary ft-btn-block">
            Proceder al Pago ➔
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(drawer);

    // Eventos Drawer
    document.getElementById("ft-cart-close").addEventListener("click", () => this.closeDrawer());
    document.getElementById("ft-cart-overlay").addEventListener("click", () => this.closeDrawer());
    document.getElementById("ft-cart-checkout-btn").addEventListener("click", () => {
      this.closeDrawer();
      this.openCheckout();
    });

    // 2. Modal de Checkout
    const checkoutModal = document.createElement("div");
    checkoutModal.id = "ft-checkout-modal";
    checkoutModal.className = "ft-modal-overlay ft-hidden";
    checkoutModal.innerHTML = `
      <div class="ft-modal-card ft-modal-card-lg">
        <button class="ft-modal-close" id="ft-checkout-close">&times;</button>
        <div class="ft-modal-header">
          <h3>Finalizar Compra — Franki <span>Tattoo</span></h3>
          <p class="ft-modal-subtitle">Paga con Banco Pichincha o DeUna al instante</p>
        </div>

        <div id="ft-checkout-step-auth" class="ft-checkout-auth-banner ft-hidden">
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.6rem;">
            <span>⚡ Compra rápida como <strong>Invitado</strong> (sin contraseña)</span>
            <button type="button" class="ft-btn-secondary" id="ft-checkout-login-trigger" style="padding:0.35rem 0.75rem; font-size:0.8rem; cursor:pointer;">¿Tienes cuenta? Inicia sesión</button>
          </div>
        </div>

        <form id="ft-checkout-form">
          <div class="ft-checkout-grid">
            <!-- Columna izquierda: Datos del Cliente y Entrega -->
            <div class="ft-checkout-section">
              <h4>1. Datos de Entrega</h4>
              <div class="ft-form-group">
                <label>Nombre Completo *</label>
                <input type="text" id="ft-chk-name" required placeholder="Tu nombre y apellido" />
              </div>
              <div class="ft-form-group">
                <label>Correo Electrónico *</label>
                <input type="email" id="ft-chk-email" required placeholder="tu@correo.com" />
              </div>
              <div class="ft-form-group">
                <label>Teléfono / WhatsApp *</label>
                <input type="tel" id="ft-chk-phone" required placeholder="0991548585" />
              </div>
              <div class="ft-form-group">
                <label>Tipo de Entrega *</label>
                <select id="ft-chk-delivery" required>
                  <option value="pickup">Retiro en Estudio (Calle Olmedo y Grijalva, Ibarra - Gratis)</option>
                  <option value="delivery_local">Envío a Domicilio en Ibarra (+$2.00)</option>
                  <option value="delivery_servientrega">Envío Nacional por Servientrega (+$5.00)</option>
                </select>
              </div>
              <div class="ft-form-group ft-hidden" id="ft-chk-city-group">
                <label>Ciudad y Provincia de Destino *</label>
                <input type="text" id="ft-chk-city" placeholder="Ej: Quito, Pichincha / Guayaquil, Guayas..." />
              </div>
              <div class="ft-form-group ft-hidden" id="ft-chk-address-group">
                <label>Dirección y Referencia de Entrega *</label>
                <input type="text" id="ft-chk-address" placeholder="Ej: Av. Teodoro Gómez y Atahualpa, frente a farmacia..." />
              </div>
            </div>

            <!-- Columna derecha: Método de Pago y Resumen -->
            <div class="ft-checkout-section">
              <h4>2. Método de Pago</h4>
              
              <div class="ft-payment-methods">
                <label class="ft-payment-tab active" data-method="pichincha">
                  <input type="radio" name="ft-pay-method" value="pichincha" checked />
                  <span>🏦 Banco Pichincha (Directa)</span>
                </label>
                <label class="ft-payment-tab" data-method="deuna">
                  <input type="radio" name="ft-pay-method" value="deuna" />
                  <span>📱 DeUna (Banco Pichincha)</span>
                </label>
                <label class="ft-payment-tab" data-method="interbancario">
                  <input type="radio" name="ft-pay-method" value="interbancario" />
                  <span>🏛️ Otros Bancos (Guayaquil, Produbanco, Coops)</span>
                </label>
              </div>

              <!-- Detalle Banco Pichincha -->
              <div id="ft-pay-detail-pichincha" class="ft-pay-detail-box">
                <div class="ft-bank-notice">
                  ⚡ <strong>Transferencia directa entre cuentas Pichincha:</strong> Acreditación inmediata y sin recargo de comisión.
                </div>
                <div class="ft-bank-box">
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Banco:</span> <strong>${FRANKI_PAYMENT_CONFIG.pichincha.banco}</strong></div>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Tipo de Cuenta:</span> <strong>${FRANKI_PAYMENT_CONFIG.pichincha.tipoCuenta}</strong></div>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Número:</span> <span class="ft-copyable">${FRANKI_PAYMENT_CONFIG.pichincha.numero}</span></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.pichincha.numero}', this)">📋 Copiar</button>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Titular:</span> <strong>${FRANKI_PAYMENT_CONFIG.pichincha.titular}</strong></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.pichincha.titular}', this)">📋 Copiar</button>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">C.I. / RUC:</span> <span class="ft-copyable">${FRANKI_PAYMENT_CONFIG.pichincha.identificacion}</span></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.pichincha.identificacion}', this)">📋 Copiar</button>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Email:</span> <span>${FRANKI_PAYMENT_CONFIG.pichincha.email}</span></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.pichincha.email}', this)">📋 Copiar</button>
                  </div>
                </div>
                <div class="ft-form-group" style="margin-top:0.85rem;">
                  <label>Número de Comprobante / Referencia Bancaria *</label>
                  <input type="text" id="ft-chk-pichincha-ref" placeholder="Ej: 8945127" />
                </div>
                <div class="ft-voucher-box">
                  <span class="ft-bank-label">📎 Adjuntar captura del comprobante (opcional):</span>
                  <div>
                    <input type="file" id="ft-voucher-pichincha-file" accept="image/*,.pdf" style="display:none;" onchange="Cart.handleVoucherUpload(this, 'pichincha')" />
                    <button type="button" class="ft-voucher-btn" onclick="document.getElementById('ft-voucher-pichincha-file').click()">
                      📸 Subir foto de comprobante
                    </button>
                    <div id="ft-voucher-pichincha-status" class="ft-voucher-preview ft-hidden"></div>
                  </div>
                </div>
              </div>

              <!-- Detalle DeUna -->
              <div id="ft-pay-detail-deuna" class="ft-pay-detail-box ft-hidden">
                <div class="ft-deuna-box">
                  <div class="ft-deuna-qr-wrapper">
                    ${FRANKI_PAYMENT_CONFIG.deuna.qrUrl 
                      ? `<img src="${FRANKI_PAYMENT_CONFIG.deuna.qrUrl}" alt="QR DeUna" style="width: 100px; height: 100px; object-fit: contain; border-radius: 8px; border: 2px solid #00e676; padding: 4px; background: white;">` 
                      : `<div class="ft-deuna-qr-mock">
                          <div class="ft-qr-visual">
                            <span style="font-size:2rem;">📱</span>
                            <strong style="color:#000;">DeUna!</strong>
                            <span style="font-size:0.75rem; color:#444;">Banco Pichincha</span>
                          </div>
                        </div>`
                    }
                  </div>
                  <div class="ft-deuna-info" style="flex:1;">
                    <h5 style="margin:0 0 0.5rem 0;">Paga al instante con DeUna:</h5>
                    <div class="ft-bank-row">
                      <div><span class="ft-bank-label">Celular:</span> <span class="ft-copyable">${FRANKI_PAYMENT_CONFIG.deuna.telefono}</span></div>
                      <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.deuna.telefono}', this)">📋 Copiar</button>
                    </div>
                    <p style="margin:0.35rem 0 0 0; font-size:0.82rem;"><strong>Beneficiario:</strong> ${FRANKI_PAYMENT_CONFIG.deuna.beneficiario}</p>
                    <p style="font-size:0.75rem; color:#999; margin:0.2rem 0 0 0;">Abre tu app DeUna o Banca Móvil Pichincha y transfiere al número.</p>
                  </div>
                </div>
                <div class="ft-voucher-box" style="margin-top:0.85rem;">
                  <span class="ft-bank-label">📎 Adjuntar captura de DeUna (opcional):</span>
                  <div>
                    <input type="file" id="ft-voucher-deuna-file" accept="image/*,.pdf" style="display:none;" onchange="Cart.handleVoucherUpload(this, 'deuna')" />
                    <button type="button" class="ft-voucher-btn" onclick="document.getElementById('ft-voucher-deuna-file').click()">
                      📸 Subir captura DeUna
                    </button>
                    <div id="ft-voucher-deuna-status" class="ft-voucher-preview ft-hidden"></div>
                  </div>
                </div>
              </div>

              <!-- Detalle Otros Bancos (Interbancaria) -->
              <div id="ft-pay-detail-interbancario" class="ft-pay-detail-box ft-hidden">
                <div class="ft-bank-notice">
                  🏛️ <strong>¿Transfieres desde Banco Guayaquil, Produbanco, Pacífico, Internacional o Cooperativas?</strong><br/>
                  Abre la app de tu banco, selecciona <em>"Transferencia Interbancaria / A otros bancos"</em> y usa estos datos:
                </div>
                <div class="ft-bank-box">
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Banco Destino:</span> <strong>${FRANKI_PAYMENT_CONFIG.interbancario.bancoDestino}</strong></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.interbancario.bancoDestino}', this)">📋 Copiar</button>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Tipo de Cuenta:</span> <strong>${FRANKI_PAYMENT_CONFIG.interbancario.tipoCuenta}</strong></div>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Número de Cuenta:</span> <span class="ft-copyable">${FRANKI_PAYMENT_CONFIG.interbancario.numero}</span></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.interbancario.numero}', this)">📋 Copiar</button>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Titular de Cuenta:</span> <strong>${FRANKI_PAYMENT_CONFIG.interbancario.titular}</strong></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.interbancario.titular}', this)">📋 Copiar</button>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Cédula / RUC:</span> <span class="ft-copyable">${FRANKI_PAYMENT_CONFIG.interbancario.identificacion}</span></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.interbancario.identificacion}', this)">📋 Copiar</button>
                  </div>
                  <div class="ft-bank-row">
                    <div><span class="ft-bank-label">Correo Notificación:</span> <span>${FRANKI_PAYMENT_CONFIG.interbancario.email}</span></div>
                    <button type="button" class="ft-btn-copy" onclick="Cart.copyText('${FRANKI_PAYMENT_CONFIG.interbancario.email}', this)">📋 Copiar</button>
                  </div>
                </div>
                <div class="ft-form-group" style="margin-top:0.85rem;">
                  <label>Número de Comprobante / Referencia Interbancaria *</label>
                  <input type="text" id="ft-chk-inter-ref" placeholder="Ej: SPI-901842" />
                </div>
                <div class="ft-voucher-box">
                  <span class="ft-bank-label">📎 Adjuntar captura de transferencia (opcional):</span>
                  <div>
                    <input type="file" id="ft-voucher-inter-file" accept="image/*,.pdf" style="display:none;" onchange="Cart.handleVoucherUpload(this, 'inter')" />
                    <button type="button" class="ft-voucher-btn" onclick="document.getElementById('ft-voucher-inter-file').click()">
                      📸 Subir foto de comprobante
                    </button>
                    <div id="ft-voucher-inter-status" class="ft-voucher-preview ft-hidden"></div>
                  </div>
                </div>
              </div>

              <!-- Resumen Total -->
              <div class="ft-checkout-summary-box">
                <div class="ft-chk-line" style="display:flex; justify-content:space-between; margin-bottom:0.4rem; color:#bbb; font-size:0.9rem;">
                  <span>Subtotal productos:</span>
                  <span id="ft-chk-subtotal-display" style="font-weight:600; color:#fff;">$0.00</span>
                </div>
                <div class="ft-chk-line" style="display:flex; justify-content:space-between; margin-bottom:0.5rem; color:#bbb; font-size:0.9rem;">
                  <span>Costo de entrega:</span>
                  <span id="ft-chk-shipping-display" style="color:#00e676; font-weight:600;">Gratis</span>
                </div>
                <div class="ft-chk-line" style="display:flex; justify-content:space-between; border-top:1px solid rgba(255,255,255,0.12); padding-top:0.6rem; margin-top:0.2rem;">
                  <span style="font-weight:bold; font-size:1.05rem;">Total a Pagar:</span>
                  <strong id="ft-chk-total-display" class="ft-cart-total-price">$0.00</strong>
                </div>
              </div>

              <div id="ft-chk-error" class="ft-auth-alert ft-hidden"></div>

              <button type="submit" id="ft-chk-submit-btn" class="ft-btn-primary ft-btn-block" style="margin-top:1rem;">
                Confirmar y Realizar Pedido
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(checkoutModal);

    // Eventos Checkout
    document.getElementById("ft-checkout-close").addEventListener("click", () => this.closeCheckout());
    checkoutModal.addEventListener("click", (e) => {
      if (e.target === checkoutModal) this.closeCheckout();
    });

    // Toggle de tipo de entrega
    document.getElementById("ft-chk-delivery").addEventListener("change", (e) => {
      const cityGroup = document.getElementById("ft-chk-city-group");
      const cityInput = document.getElementById("ft-chk-city");
      const addrGroup = document.getElementById("ft-chk-address-group");
      const addrInput = document.getElementById("ft-chk-address");
      const val = e.target.value;

      if (val === "delivery_servientrega") {
        cityGroup.classList.remove("ft-hidden");
        cityInput.required = true;
        addrGroup.classList.remove("ft-hidden");
        addrInput.required = true;
      } else if (val === "delivery_local") {
        cityGroup.classList.add("ft-hidden");
        cityInput.required = false;
        cityInput.value = "Ibarra";
        addrGroup.classList.remove("ft-hidden");
        addrInput.required = true;
      } else {
        cityGroup.classList.add("ft-hidden");
        cityInput.required = false;
        addrGroup.classList.add("ft-hidden");
        addrInput.required = false;
      }

      this.updateCheckoutTotals();
    });

    // Selector de métodos de pago
    document.querySelectorAll("input[name='ft-pay-method']").forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const val = e.target.value;
        document.querySelectorAll(".ft-payment-tab").forEach((tab) => {
          tab.classList.toggle("active", tab.dataset.method === val);
        });
        document.getElementById("ft-pay-detail-pichincha").classList.toggle("ft-hidden", val !== "pichincha");
        document.getElementById("ft-pay-detail-deuna").classList.toggle("ft-hidden", val !== "deuna");
        document.getElementById("ft-pay-detail-interbancario").classList.toggle("ft-hidden", val !== "interbancario");
      });
    });

    // Form submit Checkout
    document.getElementById("ft-checkout-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.processOrder();
    });

    // Trigger de login desde checkout
    document.getElementById("ft-checkout-login-trigger").addEventListener("click", () => {
      CustomerAuth.openModal("login");
    });

    // Escuchar cambio de autenticación
    window.addEventListener("customer-auth-changed", () => {
      this.syncUserData();
    });
  },

  openDrawer() {
    let drawer = document.getElementById("ft-cart-drawer");
    if (!drawer) {
      this.createUI();
      drawer = document.getElementById("ft-cart-drawer");
    }
    this.renderCartDrawer();
    drawer.classList.remove("ft-hidden");
  },

  closeDrawer() {
    const drawer = document.getElementById("ft-cart-drawer");
    if (drawer) drawer.classList.add("ft-hidden");
  },

  renderCartDrawer() {
    const list = document.getElementById("ft-cart-items-list");
    const subtotalEl = document.getElementById("ft-cart-subtotal");
    const footer = document.getElementById("ft-cart-footer");
    if (!list) return;

    const items = this.getItems();
    if (items.length === 0) {
      list.innerHTML = `
        <div class="ft-cart-empty">
          <span style="font-size:3rem;">🛒</span>
          <p>Tu carrito está vacío</p>
          <small>Explora nuestras secciones de Vapes, Joyería y Artesanías para agregar productos.</small>
        </div>
      `;
      if (footer) footer.style.display = "none";
      return;
    }

    if (footer) footer.style.display = "block";
    let html = "";
    items.forEach((item) => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      html += `
        <div class="ft-cart-item-row" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="ft-cart-item-img" />
          <div class="ft-cart-item-info">
            <h5>${item.name}</h5>
            <div class="ft-cart-item-meta">
              <span class="ft-cart-price">$${item.price.toFixed(2)} c/u</span>
            </div>
            <div class="ft-cart-item-controls">
              <button class="ft-qty-btn ft-btn-minus" data-id="${item.id}">-</button>
              <span class="ft-qty-num">${item.quantity}</span>
              <button class="ft-qty-btn ft-btn-plus" data-id="${item.id}">+</button>
              <button class="ft-remove-item-btn" data-id="${item.id}" title="Eliminar">🗑️</button>
            </div>
          </div>
          <div class="ft-cart-item-total">$${itemTotal}</div>
        </div>
      `;
    });

    list.innerHTML = html;
    if (subtotalEl) subtotalEl.textContent = `$${this.getTotal().toFixed(2)}`;

    // Eventos de botones
    list.querySelectorAll(".ft-btn-minus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const item = this.getItems().find((i) => i.id === id);
        if (item) this.updateQuantity(id, item.quantity - 1);
      });
    });

    list.querySelectorAll(".ft-btn-plus").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        const item = this.getItems().find((i) => i.id === id);
        if (item) this.updateQuantity(id, item.quantity + 1);
      });
    });

    list.querySelectorAll(".ft-remove-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.dataset.id);
        this.removeItem(id);
      });
    });
  },

  updateCheckoutTotals() {
    const subtotal = this.getTotal();
    const deliverySelect = document.getElementById("ft-chk-delivery");
    const deliveryType = deliverySelect ? deliverySelect.value : "pickup";
    let shipping = 0;
    let shippingLabel = "Gratis ($0.00)";

    if (deliveryType === "delivery_local") {
      shipping = 2.00;
      shippingLabel = "$2.00 USD";
    } else if (deliveryType === "delivery_servientrega") {
      shipping = 5.00;
      shippingLabel = "$5.00 USD (Servientrega)";
    }

    const total = subtotal + shipping;

    const subEl = document.getElementById("ft-chk-subtotal-display");
    if (subEl) subEl.textContent = `$${subtotal.toFixed(2)}`;

    const shipEl = document.getElementById("ft-chk-shipping-display");
    if (shipEl) {
      shipEl.textContent = shippingLabel;
      shipEl.style.color = shipping > 0 ? "#ffd600" : "#00e676";
    }

    const totEl = document.getElementById("ft-chk-total-display");
    if (totEl) totEl.textContent = `$${total.toFixed(2)}`;

    return { subtotal, shipping, total, deliveryType };
  },

  openCheckout() {
    const items = this.getItems();
    if (items.length === 0) {
      this.showToast("Tu carrito está vacío. Agrega productos primero.");
      return;
    }

    let modal = document.getElementById("ft-checkout-modal");
    if (!modal) {
      this.createUI();
      modal = document.getElementById("ft-checkout-modal");
    }

    this.updateCheckoutTotals();
    this.syncUserData();
    modal.classList.remove("ft-hidden");
  },

  closeCheckout() {
    const modal = document.getElementById("ft-checkout-modal");
    if (modal) modal.classList.add("ft-hidden");
  },

  syncUserData() {
    const user = CustomerAuth.get();
    const banner = document.getElementById("ft-checkout-step-auth");
    const nameInput = document.getElementById("ft-chk-name");
    const emailInput = document.getElementById("ft-chk-email");
    const phoneInput = document.getElementById("ft-chk-phone");

    if (user && user.token) {
      if (banner) banner.classList.add("ft-hidden");
      if (nameInput && !nameInput.value) nameInput.value = user.nombreCompleto || "";
      if (emailInput && !emailInput.value) emailInput.value = user.correo || "";
      if (phoneInput && !phoneInput.value) phoneInput.value = user.telefono || "";
    } else {
      if (banner) banner.classList.remove("ft-hidden");
    }
  },

  async processOrder() {
    const errorBox = document.getElementById("ft-chk-error");
    const submitBtn = document.getElementById("ft-chk-submit-btn");
    errorBox.classList.add("ft-hidden");

    let user = CustomerAuth.get();
    const name = document.getElementById("ft-chk-name").value.trim();
    const email = document.getElementById("ft-chk-email").value.trim();
    const phone = document.getElementById("ft-chk-phone").value.trim();
    const delivery = document.getElementById("ft-chk-delivery").value;
    const city = document.getElementById("ft-chk-city")?.value.trim() || (delivery === "delivery_local" ? "Ibarra" : "");
    const address = document.getElementById("ft-chk-address")?.value.trim() || "";

    const { subtotal, shipping, total } = this.updateCheckoutTotals();

    if (delivery === "delivery_servientrega") {
      if (!city) {
        this.showCheckoutError("Por favor ingresa la ciudad y provincia de destino para Servientrega.");
        return;
      }
      if (!address) {
        this.showCheckoutError("Por favor ingresa la dirección exacta y referencia de entrega para Servientrega.");
        return;
      }
    } else if (delivery === "delivery_local") {
      if (!address) {
        this.showCheckoutError("Por favor ingresa tu dirección y referencia de entrega en Ibarra.");
        return;
      }
    }

    const methodRadio = document.querySelector("input[name='ft-pay-method']:checked");
    const method = methodRadio ? methodRadio.value : "pichincha";

    let paymentRef = "";
    let methodDisplay = "";

    if (method === "pichincha") {
      paymentRef = document.getElementById("ft-chk-pichincha-ref").value.trim();
      if (!paymentRef) {
        this.showCheckoutError("Por favor ingresa el número o referencia del comprobante Banco Pichincha.");
        return;
      }
      methodDisplay = "Banco Pichincha (Directa)";
    } else if (method === "deuna") {
      paymentRef = "Comprobante por WhatsApp/Adjunto";
      methodDisplay = "DeUna (Banco Pichincha)";
    } else if (method === "interbancario") {
      paymentRef = document.getElementById("ft-chk-inter-ref").value.trim();
      if (!paymentRef) {
        this.showCheckoutError("Por favor ingresa el número de comprobante o referencia de tu banco.");
        return;
      }
    } else {
      paymentRef = "Comprobante por WhatsApp/Adjunto";
      methodDisplay = "Transferencia Bancaria";
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Procesando pedido...";

    try {
      // Si el cliente no tiene sesión iniciada, asegurarse de crearlo o buscarlo en DB
      let customerId = user?.idCliente;
      if (!customerId) {
        // Consultar o crear cliente temporal
        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: name,
            email: email,
            phone: phone
          })
        });
        if (custRes.ok) {
          const newCust = await custRes.json();
          customerId = newCust.id || newCust.Id;
        }
      }

      if (!customerId) {
        customerId = 1; // Fallback seguro
      }

      const items = this.getItems().map((i) => ({
        idProducto: i.id,
        cantidad: i.quantity
      }));

      // Llamar al endpoint /api/orders
      const headers = { "Content-Type": "application/json" };
      if (user?.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          idCliente: customerId,
          tipoEntrega: delivery,
          ciudadEnvio: city,
          direccionEnvio: address,
          costoEnvio: shipping,
          articulos: items
        })
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData || "Error al registrar el pedido.");
      }

      const orderId = orderData.id || orderData.Id || Math.floor(1000 + Math.random() * 9000);
      const itemsList = this.getItems();
      const voucherSaved = this.uploadedVoucherUrl;
      const voucherFileSaved = this.uploadedVoucherFile;

      // Limpiar carrito
      this.clear();
      this.closeCheckout();
      this.uploadedVoucherUrl = null;
      this.uploadedVoucherFile = null;

      // Mostrar confirmación
      this.showOrderSuccessModal({
        orderId,
        subtotal: subtotal.toFixed(2),
        shipping: shipping.toFixed(2),
        total: total.toFixed(2),
        name,
        email,
        phone,
        method: methodDisplay,
        ref: paymentRef,
        voucherUrl: voucherSaved,
        voucherFile: voucherFileSaved,
        deliveryType: delivery,
        city: city,
        address: address,
        items: itemsList
      });

    } catch (err) {
      this.showCheckoutError(err.message || "Ocurrió un error al procesar el pedido.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirmar y Realizar Pedido";
    }
  },

  showCheckoutError(msg) {
    const errorBox = document.getElementById("ft-chk-error");
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.classList.remove("ft-hidden");
  },

  showOrderSuccessModal(order) {
    const modal = document.createElement("div");
    modal.className = "ft-modal-overlay";
    
    // URL limpia y segura del comprobante (validar protocolo http/https para prevenir XSS)
    let cleanVoucherUrl = null;
    if (order.voucherUrl && typeof order.voucherUrl === "string") {
      const trimmed = order.voucherUrl.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        cleanVoucherUrl = trimmed;
      } else if (trimmed.startsWith("/")) {
        cleanVoucherUrl = `${window.location.origin}${trimmed}`;
      }
    }

    // Formatear modalidad de entrega para WhatsApp
    let deliveryLabel = "";
    if (order.deliveryType === "delivery_servientrega") {
      deliveryLabel = `Envío Nacional por Servientrega (+$${order.shipping} USD)\n📍 *Ciudad/Provincia:* ${order.city}\n🏠 *Dirección y Ref:* ${order.address}`;
    } else if (order.deliveryType === "delivery_local") {
      deliveryLabel = `Envío a Domicilio en Ibarra (+$${order.shipping} USD)\n🏠 *Dirección y Ref:* ${order.address}`;
    } else {
      deliveryLabel = `Retiro en Estudio Franki Tattoo (Calle Olmedo y Grijalva, Ibarra - Gratis)`;
    }

    // Formatear mensaje para WhatsApp
    let waText = `*¡Hola Franki Tattoo!* 🖤 Acabo de realizar una compra en su tienda online:\n\n`;
    waText += `📦 *Pedido:* #PED-${order.orderId}\n`;
    waText += `👤 *Cliente:* ${order.name}\n`;
    waText += `📞 *Teléfono:* ${order.phone}\n`;
    waText += `🚚 *Modalidad:* ${deliveryLabel}\n\n`;
    waText += `🛒 *Artículos:* \n`;
    order.items.forEach(i => {
      waText += ` • ${i.quantity}x ${i.name} ($${(i.price * i.quantity).toFixed(2)})\n`;
    });
    waText += `\n💵 *Subtotal Productos:* $${order.subtotal} USD\n`;
    if (Number(order.shipping) > 0) {
      waText += `🛵 *Costo de Envío:* $${order.shipping} USD\n`;
    }
    waText += `💰 *TOTAL:* $${order.total} USD\n`;
    waText += `💳 *Método de Pago:* ${order.method}\n`;
    waText += `🔖 *Comprobante/Ref:* ${order.ref}\n`;

    if (cleanVoucherUrl) {
      waText += `📎 *Foto Comprobante:* ${cleanVoucherUrl}\n\n`;
      waText += `He adjuntado el comprobante en la web. ¡Quedo atento a la confirmación y despacho!`;
    } else {
      waText += `\n📸 *Comprobante:* Adjunto la foto de la transferencia aquí en el chat. ¡Muchas gracias!`;
    }

    const encoded = encodeURIComponent(waText);
    const waNumber = FRANKI_PAYMENT_CONFIG?.whatsappNumero || "593991548585";
    const waUrl = `https://wa.me/${waNumber}?text=${encoded}`;

    const canShareFile = !!(navigator.canShare && order.voucherFile && navigator.canShare({ files: [order.voucherFile] }));

    modal.innerHTML = `
      <div class="ft-modal-card ft-text-center">
        <div style="font-size:3.5rem; margin-bottom:1rem;">🎉</div>
        <h3 style="color:#00e676; margin-bottom:0.5rem;">¡Pedido Confirmado con Éxito!</h3>
        <p style="color:#aaa; font-size:1.1rem; margin-bottom:1.5rem;">
          Número de Pedido: <strong>#PED-${order.orderId}</strong>
        </p>

        <div class="ft-order-summary-box">
          <p><strong>Subtotal Productos:</strong> $${order.subtotal} USD</p>
          ${Number(order.shipping) > 0 ? `<p><strong>Costo de Entrega:</strong> $${order.shipping} USD</p>` : ''}
          <p style="font-size:1.15rem; color:#00e676; margin:0.4rem 0;"><strong>Total a Pagar:</strong> $${order.total} USD</p>
          <p><strong>Método de Pago:</strong> ${order.method}</p>
          <p><strong>Referencia:</strong> ${order.ref}</p>

          ${cleanVoucherUrl ? `
            <div style="margin:0.8rem 0; padding:0.6rem; background:rgba(0,0,0,0.3); border-radius:8px; border:1px solid rgba(0,230,118,0.25);">
              <p style="font-size:0.82rem; color:#aaa; margin-bottom:0.4rem;"><strong>📸 Comprobante Adjuntado:</strong></p>
              <a href="${cleanVoucherUrl}" target="_blank" title="Ver foto en tamaño completo">
                <img src="${cleanVoucherUrl}" alt="Comprobante" style="max-height:110px; max-width:100%; border-radius:6px; border:1px solid #00e676; object-fit:contain;" />
              </a>
              <br><small style="color:#00e676; font-size:0.75rem;">(Haz clic en la foto para verla en grande)</small>
            </div>
          ` : ''}

          <div style="margin-top:0.6rem; padding-top:0.6rem; border-top:1px dashed rgba(255,255,255,0.15); text-align:left;">
            <strong>Tipo de Entrega:</strong><br>
            ${order.deliveryType === 'delivery_servientrega' 
              ? `🚚 <strong>Servientrega Nacional (+$${order.shipping} USD)</strong><br>📍 <strong>Ciudad:</strong> ${order.city}<br>🏠 <strong>Dirección:</strong> ${order.address}` 
              : order.deliveryType === 'delivery_local' 
              ? `🛵 <strong>A Domicilio en Ibarra (+$${order.shipping} USD)</strong><br>🏠 <strong>Dirección:</strong> ${order.address}`
              : `🏢 <strong>Retiro en Estudio Franki Tattoo</strong> (Calle Olmedo y Grijalva, Ibarra)`}
          </div>
        </div>

        <p style="margin:1.2rem 0 0.8rem 0; color:#ddd; font-size:0.95rem;">
          Para validar tu pago y despachar tus productos de inmediato, envía la confirmación a nuestro WhatsApp oficial:
        </p>

        ${canShareFile ? `
          <button type="button" id="ft-btn-share-wa" class="ft-btn-whatsapp ft-btn-block" style="margin-bottom:0.5rem; cursor:pointer;">
            📲 Enviar Pedido con Foto a WhatsApp
          </button>
        ` : ''}

        <a href="${waUrl}" target="_blank" id="ft-btn-direct-wa" class="ft-btn-whatsapp ft-btn-block" style="${canShareFile ? 'background:#1f2c34; border:1px solid #25d366; color:#25d366;' : ''}">
          📲 Abrir Chat de WhatsApp con Franki
        </a>

        <p style="margin-top:0.6rem; font-size:0.78rem; color:#888;">
          💡 Si tu WhatsApp no carga la imagen automáticamente, puedes adjuntar o pegar la captura directamente en el chat con el botón 📎 de WhatsApp.
        </p>

        <button class="ft-btn-secondary ft-btn-block" id="ft-success-close-btn" style="margin-top:0.75rem;">
          Continuar navegando en el sitio
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    const shareBtn = modal.querySelector("#ft-btn-share-wa");
    if (shareBtn && order.voucherFile) {
      shareBtn.addEventListener("click", async () => {
        try {
          await navigator.share({
            title: `Pedido #PED-${order.orderId} - Franki Tattoo`,
            text: waText,
            files: [order.voucherFile]
          });
        } catch (e) {
          window.open(waUrl, "_blank");
        }
      });
    }

    modal.querySelector("#ft-success-close-btn").addEventListener("click", () => {
      modal.remove();
    });
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
  }
};

document.addEventListener("DOMContentLoaded", () => {
  Cart.createUI();
  Cart.updateCartBadge();
});

