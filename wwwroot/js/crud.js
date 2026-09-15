// crud.js
// Mismo espíritu que tu clase Crud<T> de C# (GetAll, GetById, Create, Update,
// Delete apuntando a un EndPoint), pero corriendo en el navegador con fetch()
// y agregando el token JWT automáticamente cuando hay sesión iniciada.

const Auth = {
  KEY: "frankie_auth",

  get() {
    try {
      const raw = localStorage.getItem(this.KEY) || localStorage.getItem("frankie_customer");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  set(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
    localStorage.setItem("frankie_customer", JSON.stringify(data));
  },

  async clear() {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem("frankie_customer");
    try {
        await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) { }
  },

  token() {
    const data = this.get();
    return data ? data.token : null;
  },

  roles() {
    const data = this.get();
    return data ? data.roles || [] : [];
  },

  hasAnyRole(...required) {
    const roles = this.roles();
    return required.some((r) => roles.includes(r));
  },
};

function buildHeaders(withBody) {
  const h = {};
  if (withBody) h["Content-Type"] = "application/json";
  const token = Auth.token();
  if (token) {
    h["Authorization"] = `Bearer ${token}`;
  }
  return h;
}

async function handleResponse(res) {
  if (res.status === 204) return null;

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    let msg = `Error ${res.status}`;
    if (typeof data === "string" && data) msg = data;
    else if (Array.isArray(data)) msg = data.join(", ");
    else if (data?.title) msg = data.title;
    else if (data?.errors) msg = JSON.stringify(data.errors);
    throw new Error(msg);
  }

  return data;
}

// Fábrica: crea un cliente CRUD para un endpoint dado.
function makeCrud(endpoint) {
  return {
    endpoint,

    async getAll(query = "") {
      const res = await fetch(`${endpoint}${query}`, { headers: buildHeaders(false), credentials: "include" });
      return handleResponse(res);
    },

    async getById(id) {
      const res = await fetch(`${endpoint}/${id}`, { headers: buildHeaders(false), credentials: "include" });
      return handleResponse(res);
    },

    async create(item) {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: buildHeaders(true),
        body: JSON.stringify(item),
        credentials: "include",
      });
      return handleResponse(res);
    },

    async update(id, item) {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "PUT",
        headers: buildHeaders(true),
        body: JSON.stringify(item),
        credentials: "include",
      });
      return handleResponse(res);
    },

    // Para rutas tipo /api/orders/{id}/status (PATCH parcial)
    async patchAt(subPath, item) {
      const res = await fetch(`${endpoint}/${subPath}`, {
        method: "PATCH",
        headers: buildHeaders(true),
        body: JSON.stringify(item),
        credentials: "include",
      });
      return handleResponse(res);
    },

    async remove(id) {
      const res = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
        headers: buildHeaders(false),
        credentials: "include",
      });
      return handleResponse(res);
    },
  };
}
