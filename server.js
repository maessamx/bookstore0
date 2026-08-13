const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const RESOURCES = ["books", "supplies", "orders", "users", "authors"];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

function readJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name + ".json"), "utf8"));
  } catch {
    return [];
  }
}

function writeJson(name, list) {
  fs.writeFileSync(path.join(DATA_DIR, name + ".json"), JSON.stringify(list, null, 2));
}

function send(res, code, data) {
  const isText = typeof data === "string";
  res.writeHead(code, {
    "Content-Type": isText ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(isText ? data : JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function handleApi(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts[0] !== "api") return false;

  const name = parts[1];
  if (!RESOURCES.includes(name)) {
    send(res, 404, { error: "unknown resource" });
    return true;
  }

  const id = parts[2] || null;
  const method = req.method;

  if (method === "GET" && !id) {
    send(res, 200, readJson(name));
    return true;
  }

  if (method === "POST" && !id) {
    readBody(req)
      .then((item) => {
        const list = readJson(name);
        list.push(item);
        writeJson(name, list);
        send(res, 201, list);
      })
      .catch(() => send(res, 400, { error: "bad json" }));
    return true;
  }

  if (method === "PATCH" && id) {
    readBody(req)
      .then((patch) => {
        const list = readJson(name);
        const i = list.findIndex((x) => String(x.id) === id);
        if (i === -1) {
          send(res, 404, { error: "not found" });
          return;
        }
        list[i] = { ...list[i], ...patch };
        writeJson(name, list);
        send(res, 200, list);
      })
      .catch(() => send(res, 400, { error: "bad json" }));
    return true;
  }

  if (method === "DELETE" && id) {
    const list = readJson(name).filter((x) => String(x.id) !== id);
    writeJson(name, list);
    send(res, 200, list);
    return true;
  }

  send(res, 405, { error: "method not allowed" });
  return true;
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith("/")) pathname += "index.html";

  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) {
    send(res, 403, "forbidden");
    return;
  }

  fs.readFile(filePath, (err, buf) => {
    if (err) {
      send(res, 404, "not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
    });
    res.end(buf);
  });
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://" + req.headers.host);
    if (url.pathname === "/api") {
      send(res, 200, { ok: true });
      return;
    }
    if (!handleApi(req, res, url)) {
      serveStatic(req, res, url);
    }
  })
  .listen(PORT, () => {
    console.log("BookFox running on http://localhost:" + PORT);
  });
