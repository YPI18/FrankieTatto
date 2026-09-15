// app.js
// Arma la interfaz de CRUD genérica a partir de una configuración por entidad,
// muy parecido en espíritu a cómo tu Crud<T> es genérico por tipo.
//
// IMPORTANTE: los "name" de los campos y los "key" de las columnas tienen que
// ser EXACTAMENTE los nombres de propiedad que usa el API (los [JsonPropertyName]
// en español de los DTOs), no los nombres en inglés de las clases C#. Si no
// coinciden, el formulario manda campos vacíos y el API los rechaza (400) o la
// tabla te queda con columnas en blanco.

const crudClients = {
  categories: makeCrud("/api/categories"),
  products: makeCrud("/api/products"),
  customers: makeCrud("/api/customers"),
  employees: makeCrud("/api/employees"),
  appointments: makeCrud("/api/appointments"),
  orders: makeCrud("/api/orders"),
  portfolio: makeCrud("/api/portfolio"),
};

const entities = {
  categories: {
    label: "Categorías",
    requiredRolesToWrite: ["Admin", "Employee"],
    columns: [
      { key: "id", label: "ID" },
      { key: "nombre", label: "Nombre" },
      { key: "descripcion", label: "Descripción" },
    ],
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "text" },
    ],
  },
  products: {
    label: "Productos",
    requiredRolesToWrite: ["Admin", "Employee"],
    columns: [
      { key: "id", label: "ID" },
      { key: "nombre", label: "Nombre" },
      { key: "tipoServicio", label: "Tipo" },
      { key: "precio", label: "Precio" },
      { key: "inventario", label: "Stock" },
      { key: "nombreCategoria", label: "Categoría" },
    ],
    fields: [
      { name: "nombre", label: "Nombre", type: "text", required: true },
      { name: "descripcion", label: "Descripción", type: "text" },
      { name: "imageUrl", label: "Imagen", type: "image-upload" },
      { name: "precio", label: "Precio", type: "number", step: "0.01", required: true },
      { name: "inventario", label: "Stock", type: "number", required: true },
      { name: "limiteAlertaInventario", label: "Stock mínimo", type: "number" },
      { name: "tipoServicio", label: "Tipo", type: "select", options: ["Piercing", "SmokeShop", "Artesania"], required: true },
      { name: "idCategoria", label: "Categoría", type: "select-remote", source: "categories", required: true },
    ],
  },
  customers: {
    label: "Clientes",
    requiredRolesToWrite: ["Admin", "Employee"],
    columns: [
      { key: "id", label: "ID" },
      { key: "nombreCompleto", label: "Nombre completo" },
      { key: "telefono", label: "Teléfono" },
      { key: "correo", label: "Email" },
    ],
    fields: [
      { name: "nombreCompleto", label: "Nombre completo", type: "text", required: true },
      { name: "telefono", label: "Teléfono", type: "text" },
      { name: "correo", label: "Email", type: "email" },
      { name: "internalNotes", label: "Notas Médicas / Internas", type: "textarea" },
    ],
  },
  appointments: {
    label: "Citas",
    requiredRolesToWrite: ["Admin", "Employee"],
    columns: [
      { key: "id", label: "ID" },
      { key: "fechaHora", label: "Fecha y hora" },
      { key: "tipoServicio", label: "Tipo" },
      { key: "estado", label: "Estado" },
      { key: "nombreCliente", label: "Cliente" },
      { key: "notas", label: "Notas / Teléfono" },
      { key: "nombreEmpleado", label: "Empleado" },
    ],
    fields: [
      { name: "fechaHora", label: "Fecha y hora", type: "datetime-local", required: true },
      { name: "tipoServicio", label: "Tipo", type: "select", options: ["Tattoo", "Piercing", "SmokeShop"], required: true },
      { name: "notas", label: "Notas", type: "text" },
      { name: "idCliente", label: "Cliente", type: "select-remote", source: "customers", required: true },
      { name: "idEmpleado", label: "Empleado", type: "select-remote", source: "employees" },
    ],
    statusOptions: ["Pending", "Confirmed", "Completed", "Cancelled"],
  },
  portfolio: {
    label: "Portafolio",
    requiredRolesToWrite: ["Admin", "Employee"],
    columns: [
      { key: "id", label: "ID" },
      { key: "title", label: "Título" },
      { key: "category", label: "Categoría" },
    ],
    fields: [
      { name: "title", label: "Título", type: "text", required: true },
      { name: "category", label: "Categoría", type: "select", options: ["Tattoo", "Piercing", "SmokeShop", "Artesania"], required: true },
      { name: "imageUrl", label: "Imagen", type: "image-upload", required: true },
    ],
  }
};

let currentTab = "dashboard";

// ---------------- Auth ----------------

function refreshAuthUI() {
  const auth = Auth.get();
  const box = document.getElementById("auth-box");
  const gateWrapper = document.getElementById("auth-gate");
  const dashboardView = document.getElementById("dashboard-view");
  const gateError = document.getElementById("gate-error-banner");

  const isStaff = auth && Array.isArray(auth.roles) && (auth.roles.includes("Admin") || auth.roles.includes("Employee"));

  if (gateWrapper && dashboardView) {
    if (isStaff) {
      gateWrapper.classList.add("hidden");
      dashboardView.classList.remove("hidden");
    } else {
      gateWrapper.classList.remove("hidden");
      dashboardView.classList.add("hidden");
      if (auth && !isStaff) {
        Auth.clear();
        if (gateError) {
          gateError.textContent = "⛔ Acceso denegado: Esta cuenta no cuenta con permisos administrativos.";
          gateError.classList.remove("hidden");
        }
      }
    }
  }

  if (auth && isStaff) {
    if (box) {
      const displayName = auth.nombreCompleto || auth.fullName || auth.correo || "Franki";
      box.innerHTML = `
        <a href="index.html" class="nav-site-link" title="Ir al sitio público">🌐 Ver Sitio Web</a>
        <span>👑 ${displayName} — <em>${auth.roles.join(", ") || "Admin"}</em></span>
        <button id="logout-btn" type="button">Cerrar sesión</button>
      `;
      document.getElementById("logout-btn").onclick = () => {
        Auth.clear();
        localStorage.removeItem("frankie_customer");
        refreshAuthUI();
        renderTab();
      };
    }
  } else {
    if (box) {
      box.innerHTML = "";
    }
  }

  // Configurar formulario de la pantalla de bloqueo (Gate)
  const gateForm = document.getElementById("gate-login-form");
  if (gateForm && !gateForm._bound) {
    gateForm._bound = true;
    gateForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("gate-email").value.trim();
      const password = document.getElementById("gate-password").value;
      const twoFactorInput = document.getElementById("gate-2fa-code");
      const twoFactorCode = twoFactorInput ? twoFactorInput.value.trim() : "";
      const submitBtn = document.getElementById("gate-submit-btn");
      const gateError = document.getElementById("gate-error-banner");

      if (gateError) gateError.classList.add("hidden");
      submitBtn.disabled = true;
      submitBtn.textContent = "Verificando credenciales...";

      try {
        const payload = { correo: email, contrasena: password };
        if (twoFactorCode) payload.codigo2fa = twoFactorCode;

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // handleResponse reads text and parses JSON, but throws if not ok.
        // We'll handle res.ok here manually for the 2FA scenario.
        if (res.ok) {
          const data = await handleResponse(res);
          if (data && data.requiere2fa) {
            document.getElementById("gate-2fa-group").classList.remove("hidden");
            gateError.textContent = "Se requiere código de autenticación en 2 pasos.";
            gateError.classList.remove("hidden");
            if (twoFactorInput) twoFactorInput.focus();
            submitBtn.disabled = false;
            submitBtn.textContent = "Verificar Código ➔";
            return;
          }

          if (!data.roles || (!data.roles.includes("Admin") && !data.roles.includes("Employee"))) {
            throw new Error("⛔ Acceso denegado: Se requieren permisos de Administrador.");
          }

          Auth.set(data);
          localStorage.setItem("frankie_customer", JSON.stringify(data));
          refreshAuthUI();
          renderTab();
          return;
        }

        // If not ok, handleResponse will throw
        await handleResponse(res);
      } catch (err) {
        if (gateError) {
          gateError.textContent = err.message || "Credenciales incorrectas.";
          gateError.classList.remove("hidden");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Desbloquear Panel ➔";
      }
    };
  }
}

// ---------------- Errores ----------------

function showError(msg) {
  const banner = document.getElementById("error-banner");
  banner.textContent = msg;
  banner.classList.remove("hidden");
  clearTimeout(showError._t);
  showError._t = setTimeout(() => banner.classList.add("hidden"), 6000);
}

function errorPara(err, requiredRoles) {
  const p = document.createElement("p");
  p.className = "error-text";
  p.textContent = /401|403/.test(err.message)
    ? `Necesitás iniciar sesión con un rol permitido (${requiredRoles.join("/")}) para ver esto.`
    : err.message;
  return p;
}

// ---------------- Tabs ----------------

function setupTabs() {
  const nav = document.getElementById("tabs");
  nav.innerHTML = "";
  const keys = ["dashboard", ...Object.keys(entities), "orders", "security"];

  keys.forEach((key) => {
    const btn = document.createElement("button");
    if (key === "dashboard") {
        btn.textContent = "IA / Dashboard";
    } else if (key === "orders") {
        btn.textContent = "Pedidos";
    } else if (key === "security") {
        btn.textContent = "Seguridad 2FA";
    } else {
        btn.textContent = entities[key].label;
    }
    btn.className = "tab-btn";
    btn.dataset.key = key;
    btn.onclick = () => {
      currentTab = key;
      renderTab();
    };
    nav.appendChild(btn);
  });
}

async function renderTab() {
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.key === currentTab));

  const content = document.getElementById("content");
  content.innerHTML = "";

  if (currentTab === "dashboard") {
    return renderDashboard(content);
  }

  if (currentTab === "orders") {
    return renderOrders(content);
  }

  if (currentTab === "security") {
    return renderSecurity(content);
  }

  const config = entities[currentTab];
  const client = crudClients[currentTab];
  const canWrite = Auth.hasAnyRole(...config.requiredRolesToWrite);

  const title = document.createElement("h2");
  title.textContent = config.label;
  content.appendChild(title);

  // Barra de herramientas: Botón Nuevo + Buscador en tiempo real
  const toolbar = document.createElement("div");
  toolbar.style.display = "flex";
  toolbar.style.justifyContent = "space-between";
  toolbar.style.alignItems = "center";
  toolbar.style.flexWrap = "wrap";
  toolbar.style.gap = "1rem";
  toolbar.style.marginBottom = "1.2rem";

  const leftControls = document.createElement("div");
  leftControls.style.display = "flex";
  leftControls.style.gap = "0.75rem";

  if (canWrite) {
    const newBtn = document.createElement("button");
    newBtn.type = "button";
    newBtn.textContent = "+ Nuevo";
    newBtn.onclick = () => renderForm(content, currentTab, config, client, null);
    leftControls.appendChild(newBtn);
  }

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = `🔍 Buscar en ${config.label.toLowerCase()}...`;
  searchInput.style.padding = "0.55rem 1rem";
  searchInput.style.borderRadius = "20px";
  searchInput.style.border = "1px solid #444";
  searchInput.style.background = "#181818";
  searchInput.style.color = "#fff";
  searchInput.style.fontSize = "0.9rem";
  searchInput.style.width = "280px";
  searchInput.style.outline = "none";

  toolbar.appendChild(leftControls);
  toolbar.appendChild(searchInput);
  content.appendChild(toolbar);

  const table = document.createElement("table");
  content.appendChild(table);

  try {
    const allItems = await client.getAll();
    renderTable(table, config, client, allItems, canWrite);

    searchInput.addEventListener("input", () => {
      const q = searchInput.value.toLowerCase().trim();
      if (!q) {
        renderTable(table, config, client, allItems, canWrite);
        return;
      }
      const filtered = allItems.filter(item => {
        return config.columns.some(col => {
          const val = item[col.key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
        });
      });
      renderTable(table, config, client, filtered, canWrite);
    });
  } catch (err) {
    content.appendChild(errorPara(err, config.requiredRolesToWrite));
  }
}

function renderTable(table, config, client, items, canWrite) {
  table.innerHTML = "";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  config.columns.forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col.label;
    headRow.appendChild(th);
  });
  if (canWrite) {
    const th = document.createElement("th");
    th.textContent = "Acciones";
    headRow.appendChild(th);
  }
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  items.forEach((item, index) => {
    const tr = document.createElement("tr");
    config.columns.forEach((col) => {
      const td = document.createElement("td");
      if ((col.key === "nombre" || col.key === "title") && item.imageUrl) {
        td.style.display = "flex";
        td.style.alignItems = "center";
        td.style.gap = "0.6rem";
        const thumb = document.createElement("img");
        thumb.src = item.imageUrl;
        thumb.alt = "";
        thumb.style.width = "34px";
        thumb.style.height = "34px";
        thumb.style.borderRadius = "6px";
        thumb.style.objectFit = "cover";
        thumb.style.border = "1px solid #333";
        thumb.onerror = () => thumb.style.display = "none";
        td.appendChild(thumb);
        const textSpan = document.createElement("span");
        textSpan.textContent = item[col.key] ?? "";
        td.appendChild(textSpan);
      } else if (col.key === "id") {
        td.textContent = index + 1;
      } else {
        td.textContent = item[col.key] ?? "";
      }
      tr.appendChild(td);
    });

    if (canWrite) {
      const td = document.createElement("td");

      if (config.statusOptions) {
        const select = document.createElement("select");
        config.statusOptions.forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s;
          opt.textContent = s;
          if (s === item.estado) opt.selected = true;
          select.appendChild(opt);
        });
        select.onchange = async () => {
          try {
            await client.patchAt(`${item.id}/status`, { estado: select.value });
            renderTab();
          } catch (err) {
            showError(err.message);
          }
        };
        td.appendChild(select);
      }

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.textContent = "Editar";
      editBtn.onclick = () => renderForm(document.getElementById("content"), currentTab, config, client, item);
      td.appendChild(editBtn);

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.textContent = "Borrar";
      delBtn.className = "danger";
      delBtn.onclick = async () => {
        if (!confirm("¿Seguro que querés borrar este registro?")) return;
        try {
          await client.remove(item.id);
          renderTab();
        } catch (err) {
          showError(err.message);
        }
      };
      td.appendChild(delBtn);

      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

// ---------------- Formulario genérico ----------------

async function renderForm(container, tabKey, config, client, item) {
  container.innerHTML = "";
  const isEdit = !!item;

  const heading = document.createElement("h2");
  heading.textContent = isEdit ? `Editar — ${config.label}` : `Nuevo — ${config.label}`;
  container.appendChild(heading);

  const form = document.createElement("form");
  form.className = "entity-form";
  const inputs = {};

  for (const field of config.fields) {
    const label = document.createElement("label");
    label.textContent = field.label;

    let input;
    if (field.type === "select") {
      input = document.createElement("select");
      field.options.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else if (field.type === "select-remote") {
      input = document.createElement("select");
      if (!field.required) {
        const empty = document.createElement("option");
        empty.value = "";
        empty.textContent = "(ninguno)";
        input.appendChild(empty);
      }
      try {
        const options = await crudClients[field.source].getAll();
        options.forEach((opt) => {
          const o = document.createElement("option");
          o.value = opt.id;
          o.textContent = opt.nombre || opt.nombreCompleto || `#${opt.id}`;
          input.appendChild(o);
        });
      } catch (err) {
        showError(`No se pudo cargar "${field.source}": ${err.message}`);
      }
    } else if (field.type === "image-upload") {
      // Un wrapper para el text input (URL), botón de subir y vista previa
      const wrapper = document.createElement("div");
      wrapper.style.display = "flex";
      wrapper.style.flexDirection = "column";
      wrapper.style.gap = "0.6rem";

      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "10px";

      input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Pega URL o sube foto/video...";
      input.style.flex = "1";

      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*,video/*";
      fileInput.style.display = "none";

      const uploadBtn = document.createElement("button");
      uploadBtn.type = "button";
      uploadBtn.textContent = "Subir foto / video";
      uploadBtn.onclick = () => fileInput.click();

      row.appendChild(input);
      row.appendChild(fileInput);
      row.appendChild(uploadBtn);
      wrapper.appendChild(row);

      // Contenedor de Vista Previa
      const previewBox = document.createElement("div");
      previewBox.style.display = "none";
      previewBox.style.alignItems = "center";
      previewBox.style.gap = "0.75rem";
      previewBox.style.padding = "0.4rem 0.6rem";
      previewBox.style.background = "#141414";
      previewBox.style.borderRadius = "8px";
      previewBox.style.border = "1px solid #333";

      const previewThumb = document.createElement("img");
      previewThumb.style.width = "70px";
      previewThumb.style.height = "70px";
      previewThumb.style.objectFit = "cover";
      previewThumb.style.borderRadius = "6px";
      previewThumb.style.border = "1px solid #00e676";

      const previewText = document.createElement("span");
      previewText.textContent = "Foto actual asignada";
      previewText.style.color = "#aaa";
      previewText.style.fontSize = "0.85rem";

      previewBox.appendChild(previewThumb);
      previewBox.appendChild(previewText);
      wrapper.appendChild(previewBox);

      function updatePreview(url) {
        if (url && url.trim()) {
          previewThumb.src = url;
          previewBox.style.display = "flex";
        } else {
          previewBox.style.display = "none";
        }
      }

      input.oninput = () => updatePreview(input.value);

      fileInput.onchange = async () => {
        if (!fileInput.files[0]) return;
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        
        uploadBtn.disabled = true;
        uploadBtn.textContent = "Subiendo...";
        try {
          const uploadHeaders = {};
          const token = Auth.token();
          if (token) uploadHeaders["Authorization"] = `Bearer ${token}`;

          const res = await fetch("/api/upload", {
            method: "POST",
            headers: uploadHeaders,
            body: formData,
            credentials: "include"
          });
          if (!res.ok) throw new Error("Error al subir imagen");
          const data = await res.json();
          input.value = data.url;
          updatePreview(data.url);
        } catch(err) {
          showError(err.message);
        } finally {
          uploadBtn.disabled = false;
          uploadBtn.textContent = "Subir foto / video";
        }
      };

      label.appendChild(wrapper);
      inputs[field.name] = input;
      
      if (isEdit && item[field.name]) {
        input.value = item[field.name];
        updatePreview(item[field.name]);
      }
      form.appendChild(label);
      continue; // Skip the default appending below
    } else if (field.type === "textarea") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else {
      input = document.createElement("input");
      input.type = field.type;
      if (field.step) input.step = field.step;
      if (field.type === "number") input.min = "0";
    }

    if (field.required) input.required = true;

    if (isEdit && item[field.name] !== undefined && item[field.name] !== null) {
      input.value = field.type === "datetime-local" ? String(item[field.name]).slice(0, 16) : item[field.name];
    }

    inputs[field.name] = input;
    label.appendChild(input);
    form.appendChild(label);
  }

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = isEdit ? "Guardar cambios" : "Crear";
  form.appendChild(submitBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.onclick = () => renderTab();
  form.appendChild(cancelBtn);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    for (const field of config.fields) {
      const el = inputs[field.name];
      let value = el.value;

      if (field.type === "number" || field.type === "select-remote") {
        value = value === "" ? null : Number(value);
      }
      if (field.type === "datetime-local" && value && value.length === 16) {
        value += ":00";
      }
      payload[field.name] = value === "" ? null : value;
    }

    try {
      if (isEdit) {
        await client.update(item.id, payload);
      } else {
        await client.create(payload);
      }
      currentTab = tabKey;
      renderTab();
    } catch (err) {
      showError(err.message);
    }
  };

  container.appendChild(form);
}

// ---------------- Pedidos (caso especial: ítems anidados) ----------------

async function renderOrders(content) {
  const requiredRoles = ["Admin", "Employee"];
  const client = crudClients.orders;
  const canWrite = Auth.hasAnyRole(...requiredRoles);
  const canCreate = !!Auth.get();

  const title = document.createElement("h2");
  title.textContent = "Pedidos";
  content.appendChild(title);

  if (canCreate) {
    const newBtn = document.createElement("button");
    newBtn.type = "button";
    newBtn.textContent = "+ Nuevo pedido";
    newBtn.onclick = () => renderOrderForm(content);
    content.appendChild(newBtn);
  }

  const table = document.createElement("table");
  content.appendChild(table);

  try {
    const orders = await client.getAll();

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    ["#", "Id", "Fecha", "Cliente (Id)", "Total", "Entrega", "Destino / Dirección", "Estado"].forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      headRow.appendChild(th);
    });
    if (canWrite) {
      const th = document.createElement("th");
      th.textContent = "Acciones";
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    orders.forEach((order, index) => {
      const tr = document.createElement("tr");

      let entregaTexto = "🏢 Retiro Local";
      if (order.tipoEntrega === "delivery_servientrega") {
        entregaTexto = `🚚 Servientrega ($${Number(order.costoEnvio || 0).toFixed(2)})`;
      } else if (order.tipoEntrega === "delivery_local") {
        entregaTexto = `🛵 Domicilio Ibarra ($${Number(order.costoEnvio || 0).toFixed(2)})`;
      }

      let direccionTexto = "En estudio";
      if (order.ciudadEnvio && order.direccionEnvio) {
        direccionTexto = `${order.ciudadEnvio}: ${order.direccionEnvio}`;
      } else if (order.direccionEnvio) {
        direccionTexto = order.direccionEnvio;
      }

      [
        index + 1,
        order.id,
        new Date(order.fechaCreacion).toLocaleString(),
        order.idCliente,
        `$${Number(order.total).toFixed(2)}`,
        entregaTexto,
        direccionTexto
      ].forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val;
        tr.appendChild(td);
      });

      const statusTd = document.createElement("td");
      if (canWrite) {
        const select = document.createElement("select");
        ["Pending", "Processing", "Completed", "Cancelled"].forEach((s) => {
          const opt = document.createElement("option");
          opt.value = s;
          opt.textContent = s;
          if (s === order.estado) opt.selected = true;
          select.appendChild(opt);
        });
        select.onchange = async () => {
          try {
            await client.patchAt(`${order.id}/status`, { estado: select.value });
            renderTab();
          } catch (err) {
            showError(err.message);
          }
        };
        statusTd.appendChild(select);
      } else {
        statusTd.textContent = order.estado;
      }
      tr.appendChild(statusTd);

      if (canWrite) {
        const actionsTd = document.createElement("td");
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.textContent = "Borrar";
        delBtn.className = "danger";
        delBtn.onclick = async () => {
          if (!confirm("¿Borrar este pedido? El stock se devuelve automáticamente.")) return;
          try {
            await client.remove(order.id);
            renderTab();
          } catch (err) {
            showError(err.message);
          }
        };
        actionsTd.appendChild(delBtn);
        tr.appendChild(actionsTd);
      }

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  } catch (err) {
    content.appendChild(errorPara(err, requiredRoles));
  }
}

async function renderOrderForm(content) {
  content.innerHTML = "";
  const title = document.createElement("h2");
  title.textContent = "Nuevo pedido";
  content.appendChild(title);

  const form = document.createElement("form");
  form.className = "entity-form";

  const customerLabel = document.createElement("label");
  customerLabel.textContent = "Cliente";
  const customerSelect = document.createElement("select");
  try {
    const customers = await crudClients.customers.getAll();
    customers.forEach((c) => {
      const o = document.createElement("option");
      o.value = c.id;
      o.textContent = c.nombreCompleto;
      customerSelect.appendChild(o);
    });
  } catch (err) {
    showError(`No se pudieron cargar los clientes: ${err.message}`);
  }
  customerLabel.appendChild(customerSelect);
  form.appendChild(customerLabel);

  const itemsHeading = document.createElement("p");
  itemsHeading.textContent = "Productos del pedido:";
  form.appendChild(itemsHeading);

  const itemsContainer = document.createElement("div");
  form.appendChild(itemsContainer);

  let products = [];
  try {
    products = await crudClients.products.getAll();
  } catch (err) {
    showError(`No se pudieron cargar los productos: ${err.message}`);
  }

  function addItemRow() {
    const row = document.createElement("div");
    row.className = "order-item-row";

    const productSelect = document.createElement("select");
    products.forEach((p) => {
      const o = document.createElement("option");
      o.value = p.id;
      o.textContent = `${p.nombre} (stock: ${p.inventario})`;
      productSelect.appendChild(o);
    });

    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.value = "1";

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.textContent = "Quitar";
    removeBtn.onclick = () => row.remove();

    row.appendChild(productSelect);
    row.appendChild(qtyInput);
    row.appendChild(removeBtn);
    itemsContainer.appendChild(row);
  }

  addItemRow();

  const addRowBtn = document.createElement("button");
  addRowBtn.type = "button";
  addRowBtn.textContent = "+ Agregar producto";
  addRowBtn.onclick = addItemRow;
  form.appendChild(addRowBtn);

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = "Crear pedido";
  form.appendChild(submitBtn);

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Cancelar";
  cancelBtn.onclick = () => renderTab();
  form.appendChild(cancelBtn);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const items = Array.from(itemsContainer.children).map((row) => {
      const select = row.querySelector("select");
      const input = row.querySelector("input");
      return { idProducto: Number(select.value), cantidad: Number(input.value) };
    });

    try {
      await crudClients.orders.create({ idCliente: Number(customerSelect.value), articulos: items });
      currentTab = "orders";
      renderTab();
    } catch (err) {
      showError(err.message);
    }
  };

  content.appendChild(form);
}

// ---------------- Dashboard / IA ----------------

async function renderDashboard(content) {
  content.innerHTML = `
    <h2>🤖 Asistente Inteligente Franki</h2>
    <div style="background: #1e1e1e; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #333;">
      <h3 style="color: #00e676; margin-top: 0;">Resumen del día</h3>
      <p id="dashboard-ai-text" style="font-size: 1.2rem; line-height: 1.6; color: #eee;">Analizando datos...</p>
    </div>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
      <div style="background: #111; padding: 1.5rem; border-radius: 8px; text-align: center; border: 1px solid #222;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🗓️</div>
        <div id="dash-appointments" style="font-size: 1.5rem; font-weight: bold;">-</div>
        <div style="color: #888;">Citas Hoy</div>
      </div>
      <div style="background: #111; padding: 1.5rem; border-radius: 8px; text-align: center; border: 1px solid #222;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</div>
        <div id="dash-stock" style="font-size: 1.5rem; font-weight: bold; color: #ff5252;">-</div>
        <div style="color: #888;">Stock Bajo</div>
      </div>
      <div style="background: #111; padding: 1.5rem; border-radius: 8px; text-align: center; border: 1px solid #222;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">💰</div>
        <div id="dash-sales" style="font-size: 1.5rem; font-weight: bold; color: #00e676;">-</div>
        <div style="color: #888;">Ventas (7 días)</div>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem;">
      <div style="background: #1e1e1e; padding: 1rem; border-radius: 12px; border: 1px solid #333;">
        <h4 style="text-align:center; color:#ccc; margin-top:0;">Ventas (Últimos 7 días)</h4>
        <canvas id="salesChart"></canvas>
      </div>
      <div style="background: #1e1e1e; padding: 1rem; border-radius: 12px; border: 1px solid #333;">
        <h4 style="text-align:center; color:#ccc; margin-top:0;">Citas (Últimos 7 días)</h4>
        <canvas id="appointmentsChart"></canvas>
      </div>
    </div>
  `;

  try {
    const res = await fetch("/api/dashboard/summary", { headers: buildHeaders(false) });
    if (!res.ok) throw new Error("No se pudo cargar el resumen");
    const data = await res.json();

    document.getElementById("dashboard-ai-text").textContent = data.aiMessage;
    document.getElementById("dash-appointments").textContent = data.appointmentsToday;
    document.getElementById("dash-stock").textContent = data.lowStockProducts;
    document.getElementById("dash-sales").textContent = "$" + data.weeklySales.toFixed(2);

    // Inicializar Gráficos
    const salesCtx = document.getElementById("salesChart").getContext("2d");
    new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: data.chartLabels,
        datasets: [{
          label: 'Ingresos ($)',
          data: data.salesChartData,
          borderColor: '#00e676',
          backgroundColor: 'rgba(0, 230, 118, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });

    const appCtx = document.getElementById("appointmentsChart").getContext("2d");
    new Chart(appCtx, {
      type: 'bar',
      data: {
        labels: data.chartLabels,
        datasets: [{
          label: 'N° de Citas',
          data: data.appointmentsChartData,
          backgroundColor: '#ff5252',
          borderRadius: 4
        }]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });

  } catch (err) {
    document.getElementById("dashboard-ai-text").textContent = "❌ Error conectando con la IA de asistencia: " + err.message;
  }
}

// ---------------- Seguridad / 2FA ----------------

async function renderSecurity(content) {
  content.innerHTML = `
    <h2>🔒 Configuración de Seguridad (2FA)</h2>
    <div style="background: #1e1e1e; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid #333; max-width: 600px;">
      <p style="color: #ccc; margin-bottom: 1.5rem;">
        Protege tu cuenta requiriendo un código generado en tu celular (Google Authenticator) cada vez que inicies sesión.
      </p>
      <div id="2fa-loading">Cargando estado...</div>
      <div id="2fa-content" class="hidden"></div>
    </div>
  `;

  try {
    const res = await fetch("/api/auth/2fa-setup", { headers: buildHeaders(false) });
    const data = await handleResponse(res);
    const container = document.getElementById("2fa-content");

    if (data.isEnabled) {
      container.innerHTML = `
        <div style="padding: 1rem; background: rgba(0,230,118,0.1); border-left: 4px solid #00e676; margin-bottom: 1rem;">
          <h3 style="color:#00e676; margin-top:0;">✅ 2FA Activado</h3>
          <p>Tu cuenta está protegida por la autenticación en dos pasos.</p>
        </div>
        <button id="btn-disable-2fa" class="gate-btn" style="background:#ff5252; padding: 0.75rem 1.5rem; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Desactivar 2FA</button>
      `;
      container.classList.remove("hidden");
      document.getElementById("2fa-loading").classList.add("hidden");

      document.getElementById("btn-disable-2fa").onclick = async () => {
        if (!confirm("¿Estás seguro de desactivar la seguridad 2FA?")) return;
        try {
          await fetch("/api/auth/2fa-disable", { method: "POST", headers: buildHeaders(false) });
          showError("2FA desactivado correctamente.");
          renderSecurity(content);
        } catch (e) { showError(e.message); }
      };
    } else {
      container.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
          <h3 style="margin-top: 0;">Paso 1: Escanea este código QR</h3>
          <p style="color:#999; font-size:0.9rem;">Usa la app de Google Authenticator.</p>
          <div id="qrcode" style="background:#fff; padding:1rem; display:inline-block; border-radius:8px;"></div>
        </div>
        <div style="margin-bottom: 1.5rem;">
          <h3>Paso 2: Verifica el código</h3>
          <div style="display: flex; gap: 1rem; align-items: center;">
              <input type="text" id="2fa-verify-code" placeholder="123456" style="padding: 0.75rem; border-radius: 4px; border: 1px solid #444; background: #222; color: #fff; width: 150px;" autocomplete="off">
              <button id="btn-enable-2fa" class="gate-btn" style="background: #00e676; color: #000; padding: 0.75rem 1.5rem; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">Activar 2FA</button>
          </div>
        </div>
      `;
      container.classList.remove("hidden");
      document.getElementById("2fa-loading").classList.add("hidden");

      // Asegurarse de que QRCode existe (script cargado)
      if (typeof QRCode !== 'undefined') {
          new QRCode(document.getElementById("qrcode"), {
            text: data.qrCodeUrl,
            width: 150,
            height: 150,
          });
      } else {
          document.getElementById("qrcode").textContent = "Error: no se cargó la librería de QR.";
      }

      document.getElementById("btn-enable-2fa").onclick = async () => {
        const code = document.getElementById("2fa-verify-code").value.trim();
        if (!code) return showError("Ingresa el código primero.");
        try {
          const enableRes = await fetch("/api/auth/2fa-enable", { 
            method: "POST", 
            headers: buildHeaders(true),
            body: JSON.stringify({ codigo: code })
          });
          await handleResponse(enableRes);
          showError("✅ 2FA Activado correctamente.");
          renderSecurity(content);
        } catch (e) { showError("Error: " + e.message); }
      };
    }
  } catch (err) {
    document.getElementById("2fa-loading").textContent = "❌ Error: " + err.message;
  }
}

// ---------------- Init ----------------

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  refreshAuthUI();
  renderTab();
});
