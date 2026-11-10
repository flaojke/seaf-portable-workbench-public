import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { Engine } from "../engine.mjs";
import { Workbench, publicProject } from "./domain.mjs";
const here = path.dirname(fileURLToPath(import.meta.url)),
  base = path.dirname(here);
export async function createWorkbenchServer({
  port = 8091,
  engine = new Engine(
    process.env.SEAF_PROJECTS_CONFIG || path.join(base, "projects.json"),
    process.env.SEAF_MCP_STATE || path.join(base, "state"),
  ),
  state,
  editorUrl = process.env.SEAF_DRAWIO_URL,
  specRoot = process.env.SEAF_SPEC_ROOT || path.resolve(base, "../openspec"),
} = {}) {
  const workbench = await new Workbench(engine, { state, specRoot, ...(editorUrl ? {editorUrl} : {}) }).init(),
    csrf = crypto.randomBytes(32).toString("hex");
  const previewSweep = setInterval(
    () => workbench.restorePreviewTimers().catch(() => {}),
    15000,
  );
  previewSweep.unref();
  const server = http.createServer(async (req, res) => {
    const send = (status, data, headers = {}) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        ...headers,
      });
      res.end(typeof data === "string" ? data : JSON.stringify(data));
    };
    try {
      const host = req.headers.host || "",
        allowedHosts = new Set([
          "localhost:" + server.address().port,
          "127.0.0.1:" + server.address().port,
        ]);
      if (!allowedHosts.has(host))
        return send(403, { ok: false, error: "Localhost Host required" });
      const url = new URL(req.url, "http://" + host);
      if (req.method === "GET" && url.pathname === "/health")
        return send(200, { status: "ready", service: "seaf-workbench" });
      if (req.method === "GET" && url.pathname === "/api/session")
        return send(200, {
          csrf,
          projects: (await engine.projects()).map(publicProject),
          editorUrl: workbench.editorUrl,
          activeProject: engine.activeProject ? await engine.activeProject() : null,
        });
      if (req.method === "POST" && url.pathname === "/api/action") {
        const origin = req.headers.origin;
        if (
          origin &&
          ![
            "http://localhost:" + server.address().port,
            "http://127.0.0.1:" + server.address().port,
          ].includes(origin)
        )
          return send(403, { ok: false, error: "Origin rejected" });
        if (
          req.headers["x-seaf-csrf"] !== csrf ||
          !req.headers["content-type"]?.startsWith("application/json")
        )
          return send(403, {
            ok: false,
            error: "Session token and JSON required",
          });
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 6000000) throw Error("Request too large");
          chunks.push(chunk);
        }
        const a = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        const result = await workbench.action(a);
        return send(200, { ok: true, result });
      }
      if (
        req.method === "GET" &&
        /^\/api\/snapshot\/[a-f0-9]{64}\/archive.zip$/.test(url.pathname)
      ) {
        const id = url.pathname.split("/")[3],
          file = path.join(workbench.state, "snapshots", id, "archive.zip");
        const bytes = await fs.readFile(file);
        res.writeHead(200, {
          "Content-Type": "application/zip",
          "Content-Disposition":
            'attachment; filename="seaf-' + id.slice(0, 12) + '.zip"',
          "X-Content-Type-Options": "nosniff",
        });
        return res.end(bytes);
      }
      const files = {
        "/": "index.html",
        "/index.html": "index.html",
        "/app.js": "app.js",
        "/ux-tools.js": "ux-tools.js",
        "/diagram-composer.js": "diagram-composer.js",
        "/diagram-inspector.js": "diagram-inspector.js",
        "/diagram-composer.css": "diagram-composer.css",
        "/stack-views.js": "stack-views.js",
        "/projects.js": "projects.js",
        "/editor-fields.js": "editor-fields.js",
        "/style.css": "style.css",
        "/sw.js": "sw.js",
      };
      if (req.method === "GET" && files[url.pathname]) {
        const name = files[url.pathname],
          data = await fs.readFile(path.join(here, "public", name));
        res.writeHead(200, {
          "Content-Type": name.endsWith(".html")
            ? "text/html; charset=utf-8"
            : name.endsWith(".css")
              ? "text/css; charset=utf-8"
              : "text/javascript; charset=utf-8",
          "Cache-Control": "no-cache",
          "Content-Security-Policy":
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src " + new URL(workbench.editorUrl).origin + " http://localhost:8092 http://127.0.0.1:8092; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors http://localhost:* http://127.0.0.1:*",
          "X-Content-Type-Options": "nosniff",
        });
        return res.end(data);
      }
      send(404, { ok: false, error: "Not found" });
    } catch (e) {
      send(400, { ok: false, error: e.message });
    }
  });
  await new Promise((resolve, reject) =>
    server.once("error", reject).listen(port, "127.0.0.1", resolve),
  );
  server.on("close", () => clearInterval(previewSweep));
  return { server, workbench, csrf };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const { server } = await createWorkbenchServer({
    port: Number(process.env.SEAF_WORKBENCH_PORT || 8091),
  });
  process.stdout.write(
    "SEAF Workbench: http://localhost:" + server.address().port + "\n",
  );
}
