const store = {
  get(key, fb) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fb;
    } catch {
      return fb;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch {
      return false;
    }
  },
  del(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

const CONFIG = {
  mode: "json",
  apiBase: "/api",
};

function createStore(name, seedFile) {
  const key = "bk_" + name;
  let cache = null;

  async function fromLocal() {
    cache = store.get(key);
    if (Array.isArray(cache) && cache.length) return cache;
    try {
      const res = await fetch(seedFile);
      cache = await res.json();
    } catch {
      cache = [];
    }
    store.set(key, cache);
    return cache;
  }

  function url(id) {
    return CONFIG.apiBase + "/" + name + (id ? "/" + id : "");
  }

  async function call(method, id, body) {
    const res = await fetch(url(id), {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error("http " + res.status);
    return res.status === 204 ? null : res.json();
  }

  async function run(method, id, body, local) {
    try {
      const list = await call(method, id, body);
      cache = list;
      store.set(key, list);
      return list;
    } catch {
      const list = await local();
      cache = list;
      store.set(key, list);
      return list;
    }
  }

  return {
    async list() {
      if (cache) return cache;
      try {
        const list = await call("GET");
        cache = list;
        store.set(key, list);
        return list;
      } catch {
        return fromLocal();
      }
    },
    async add(item) {
      const base = await fromLocal();
      return run("POST", null, item, async () => {
        base.unshift(item);
        return base;
      });
    },
    async update(id, patch) {
      const base = await fromLocal();
      return run("PATCH", id, patch, async () => {
        const i = base.findIndex((x) => String(x.id) === String(id));
        if (i > -1) base[i] = { ...base[i], ...patch };
        return base;
      });
    },
    async remove(id) {
      const base = await fromLocal();
      return run("DELETE", id, null, async () => {
        return base.filter((x) => String(x.id) !== String(id));
      });
    },
    reset() {
      cache = null;
      store.del(key);
    },
  };
}

(function initData() {
  if (store.get("bk_datav") !== 5) {
    ["bk_books", "bk_supplies", "bk_orders", "bk_users", "bk_authors"].forEach((k) => store.del(k));
    store.set("bk_datav", 5);
  }
})();

window.Data = {
  books: createStore("books", "/data/books.json"),
  supplies: createStore("supplies", "/data/supplies.json"),
  orders: createStore("orders", "/data/orders.json"),
  users: createStore("users", "/data/users.json"),
  authors: createStore("authors", "/data/authors.json"),
};
