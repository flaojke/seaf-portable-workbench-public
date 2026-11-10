/** Adds a private CPU-profiler control around the frozen benchmark worker. */
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import inspector from "node:inspector";

if (!process.argv[2])
  throw Error("A benchmark worker configuration is required");
const configFile = path.resolve(process.argv[2]);
const config = JSON.parse(await fs.readFile(configFile, "utf8"));
if (typeof config.token !== "string" || !config.token)
  throw Error("A profiler control token is required");
const output = path.resolve(
  config.profileOutput ||
    path.join(path.dirname(configFile), "reload.cpuprofile"),
);
const relative = path.relative(path.dirname(configFile), output);
if (
  !relative ||
  relative === ".." ||
  relative.startsWith(".." + path.sep) ||
  path.isAbsolute(relative) ||
  !output.endsWith(".cpuprofile")
)
  throw Error(
    "CPU profile output must be a .cpuprofile inside this run directory",
  );
const samplingIntervalMicros = config.samplingIntervalMicros ?? 1000;
if (
  !Number.isInteger(samplingIntervalMicros) ||
  samplingIntervalMicros < 100 ||
  samplingIntervalMicros > 10000
)
  throw Error("Invalid CPU profiler sampling interval");
const session = new inspector.Session();
session.connect();
const post = (method, params = {}) =>
  new Promise((resolve, reject) =>
    session.post(method, params, (error, value) =>
      error ? reject(error) : resolve(value),
    ),
  );
await post("Profiler.enable");
await post("Profiler.setSamplingInterval", {
  interval: samplingIntervalMicros,
});
let state = "idle",
  written = false;
const send = (response, status, body) => {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
};
const control = http.createServer(async (request, response) => {
  const hosts = new Set([
    "127.0.0.1:" + control.address().port,
    "localhost:" + control.address().port,
  ]);
  if (
    !hosts.has(request.headers.host) ||
    request.headers["x-bench-token"] !== config.token
  )
    return send(response, 403, {
      error: "Profiler token and loopback Host required",
    });
  if (request.method === "GET" && request.url === "/status")
    return send(response, 200, { state, written, samplingIntervalMicros });
  if (request.method === "POST" && request.url === "/start") {
    if (state !== "idle" || written)
      return send(response, 409, {
        error:
          "Profiler is already active or this run already has a saved profile",
      });
    state = "starting";
    try {
      await post("Profiler.start");
      state = "profiling";
      return send(response, 200, { started: true, samplingIntervalMicros });
    } catch (error) {
      state = "idle";
      return send(response, 500, { error: error.message });
    }
  }
  if (request.method === "POST" && request.url === "/stop") {
    if (state !== "profiling")
      return send(response, 409, { error: "Profiler is not active" });
    state = "stopping";
    try {
      const { profile } = await post("Profiler.stop"),
        bytes = Buffer.from(JSON.stringify(profile));
      await fs.mkdir(path.dirname(output), { recursive: true });
      const temporary = output + ".tmp";
      await fs.writeFile(temporary, bytes, { flag: "wx" });
      await fs.rename(temporary, output);
      written = true;
      state = "idle";
      return send(response, 200, {
        path: output,
        bytes: bytes.length,
        samples: profile.samples?.length || 0,
      });
    } catch (error) {
      state = "idle";
      return send(response, 500, { error: error.message });
    }
  }
  return send(response, 404, { error: "Unknown profiler control route" });
});
await new Promise((resolve, reject) =>
  control.once("error", reject).listen(0, "127.0.0.1", resolve),
);
console.log("BENCH_PROFILE_CONTROL=" + control.address().port);
process.once("exit", () => session.disconnect());

// Keep argv unchanged: the existing worker reads the same configuration.
await import("./worker.mjs");
