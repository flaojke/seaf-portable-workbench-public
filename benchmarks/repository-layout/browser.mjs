/** Real frontend measurements. Importing this module never starts Chrome.
 * Cold = fresh non-persistent context; warm = reload in the same context/cache.
 * Focus = full navigation to SmartAnts after those loads, with warm HTTP assets.
 */
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { createRequire } from "node:module";
import { performance } from "node:perf_hooks";

const require = createRequire(
  new URL("../../seaf-mcp/package.json", import.meta.url),
);
const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const localHost = (host) =>
  ["localhost", "127.0.0.1", "[::1]", "::1"].includes(host);
const isLocal = (value) => {
  try {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) && localHost(url.hostname)
    );
  } catch {
    return false;
  }
};
const readableUrl = (value) => {
  try {
    const url = new URL(value);
    url.username = "";
    url.password = "";
    for (const key of [...url.searchParams.keys()])
      if (/token|secret|password|authorization|^code$/i.test(key))
        url.searchParams.set(key, "[redacted]");
    return url.href.slice(0, 1600);
  } catch {
    return String(value).slice(0, 1600);
  }
};
const backendRequest = (value) => {
  try {
    return /\/(?:seaf-core\/api\/)?core\/|^\/api\//.test(
      new URL(value).pathname,
    );
  } catch {
    return false;
  }
};
const aggregate = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    middle = Math.floor(sorted.length / 2);
  return {
    samples: sorted.length,
    min: sorted[0],
    max: sorted.at(-1),
    median:
      sorted.length % 2
        ? sorted[middle]
        : (sorted[middle - 1] + sorted[middle]) / 2,
    mean: sorted.reduce((a, b) => a + b, 0) / sorted.length,
    p95: sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)],
  };
};

// This runs inside the page: a real model label must occupy visible screen space.
function visibleModelMarker({ marker }) {
  const normalized = (value) =>
    String(value || "")
      .replace(/\s+/g, " ")
      .trim();
  const wanted = normalized(marker),
    walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (normalized(node.nodeValue) !== wanted) continue;
    const element = node.parentElement;
    if (
      !element ||
      element.closest(
        "script,style,template,defs,[hidden],[aria-hidden='true']",
      )
    )
      continue;
    const rect = element.getBoundingClientRect(),
      style = getComputedStyle(element);
    if (
      style.visibility === "hidden" ||
      style.display === "none" ||
      Number(style.opacity) === 0 ||
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.bottom <= 0 ||
      rect.top >= innerHeight ||
      rect.right <= 0 ||
      rect.left >= innerWidth
    )
      continue;
    return {
      detectedMs: performance.now(),
      marker: wanted,
      tag: element.tagName,
      bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  }
  return false;
}

function smartantsReady({ marker, minimumNodes }) {
  const svg = document.querySelector(".smart-ants svg.dochub-schema");
  if (!svg) return false;
  const rect = svg.getBoundingClientRect(),
    style = getComputedStyle(svg),
    viewBox = svg.viewBox?.baseVal;
  if (
    rect.width <= 0 ||
    rect.height <= 0 ||
    style.display === "none" ||
    style.visibility === "hidden" ||
    !viewBox?.width ||
    !viewBox?.height
  )
    return false;
  const error = svg.querySelector("text.error");
  if (error?.textContent.trim()) return { failure: error.textContent.trim() };
  if (svg.querySelector(".building-overlay, .spinner")) return false;
  const nodes = [...svg.querySelectorAll("text.node-text")],
    labels = nodes.map((node) => node.textContent.replace(/\s+/g, " ").trim());
  if (nodes.length < minimumNodes) return false;
  if (
    marker &&
    !nodes.some(
      (node) =>
        node.textContent.replace(/\s/g, "") === marker.replace(/\s/g, ""),
    )
  )
    return false;
  return {
    detectedMs: performance.now(),
    leafNodeCount: nodes.length,
    boundaryCount: svg.querySelectorAll("text.box-text").length,
    pathCount: svg.querySelectorAll("path").length,
    marker: marker || null,
    sampleLabels: labels.slice(0, 6),
    viewBox: {
      x: viewBox.x,
      y: viewBox.y,
      width: viewBox.width,
      height: viewBox.height,
    },
  };
}

function plantumlReady({ marker, minimumNodes, expectedMarkers }) {
  const normalized = (value) => String(value || "").replace(/\s+/g, "");
  for (const svg of document.querySelectorAll(".plantuml-schema svg")) {
    const rect = svg.getBoundingClientRect(),
      style = getComputedStyle(svg),
      viewBox = svg.viewBox?.baseVal;
    if (
      rect.width <= 0 ||
      rect.height <= 0 ||
      rect.bottom <= 0 ||
      rect.top >= innerHeight ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      !viewBox?.width ||
      !viewBox?.height
    )
      continue;
    if (
      svg
        .closest(".plantuml-place")
        ?.querySelector(".v-progress-circular--indeterminate")
    )
      continue;
    const text = normalized(svg.textContent);
    if (/SyntaxError[?!]|Anerrorhasoccurr?ed|securityprofile/i.test(text))
      return {
        failure:
          "PlantUML rendered an error diagram: " +
          svg.textContent.slice(0, 500),
      };
    const groups = [...svg.querySelectorAll("g.entity,g[id^='elem_'],a")];
    const texts = [...svg.querySelectorAll("text")].map((element) =>
      normalized(element.textContent),
    );
    const candidates = [
      ...groups.map((group) => normalized(group.textContent)),
      ...texts,
    ];
    const matches = (wanted) => {
      const escaped = normalized(wanted).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        pattern = new RegExp(escaped + "(?![0-9])");
      return candidates.some((candidate) => pattern.test(candidate));
    };
    const links = [...svg.querySelectorAll("a")]
      .map(
        (link) =>
          link.getAttribute("href") || link.getAttribute("xlink:href") || "",
      )
      .map((href) => {
        try {
          const url = new URL(href, location.href);
          return url.pathname.startsWith("/architect/components/")
            ? decodeURIComponent(url.pathname.split("/").at(-1))
            : url.searchParams.get("dh-component-id");
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    const componentLinks = [...new Set(links)],
      matched = expectedMarkers.filter(matches);
    if (
      expectedMarkers.length
        ? matched.length !== expectedMarkers.length
        : componentLinks.length < minimumNodes
    )
      continue;
    if (marker && !matches(marker)) continue;
    return {
      detectedMs: performance.now(),
      presentation: "plantuml",
      systemLabelCount: matched.length,
      expectedLabelCount: expectedMarkers.length,
      componentLinkCount: componentLinks.length,
      componentLinks: componentLinks.slice(0, minimumNodes),
      sampleLabels: expectedMarkers.slice(0, 6),
      svgTextElements: texts.length,
      viewBox: {
        x: viewBox.x,
        y: viewBox.y,
        width: viewBox.width,
        height: viewBox.height,
      },
    };
  }
  return false;
}

async function navigationMetrics(page) {
  return page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const paint = Object.fromEntries(
      performance
        .getEntriesByType("paint")
        .map((entry) => [entry.name, entry.startTime]),
    );
    return {
      navigationType: navigation?.type || null,
      domContentLoadedMs: navigation?.domContentLoadedEventEnd || null,
      responseStartMs: navigation?.responseStart || null,
      documentTransferBytes: navigation?.transferSize || 0,
      resourceTransferBytes: resources.reduce(
        (sum, resource) => sum + resource.transferSize,
        0,
      ),
      resourceEncodedBodyBytes: resources.reduce(
        (sum, resource) => sum + resource.encodedBodySize,
        0,
      ),
      resourceDecodedBodyBytes: resources.reduce(
        (sum, resource) => sum + resource.decodedBodySize,
        0,
      ),
      paint,
      jsHeapUsedBytes: performance.memory?.usedJSHeapSize ?? null,
      observedMs: performance.now(),
    };
  });
}

/** Create one reusable browser; measurements are serialized, contexts are not reused across repetitions. */
export async function createBrowserBench(options = {}) {
  const moduleName =
    options.playwrightModule ||
    process.env.SEAF_PLAYWRIGHT_MODULE ||
    process.env.SEAF_PLAYWRIGHT ||
    "playwright";
  let chromium;
  try {
    ({ chromium } = require(moduleName));
  } catch (error) {
    throw Error(
      "Playwright is unavailable. Set SEAF_PLAYWRIGHT_MODULE to its module directory. " +
        error.message,
    );
  }
  const executablePath = path.resolve(
    options.executablePath ||
      process.env.SEAF_CHROME ||
      process.env.CHROME ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
  );
  await fs.access(executablePath);
  // Playwright routing disables HTTP caching. A deny-only proxy blocks external
  // traffic without interception, preserving honest warm-cache measurements.
  const denyProxy = http.createServer((request, response) => {
    request.resume();
    response.writeHead(403, {
      Connection: "close",
      "Content-Type": "text/plain",
    });
    response.end("External network blocked by SEAF benchmark");
  });
  denyProxy.on("connect", (_request, socket) =>
    socket.end(
      "HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Length: 0\r\n\r\n",
    ),
  );
  await new Promise((resolve, reject) =>
    denyProxy.once("error", reject).listen(0, "127.0.0.1", resolve),
  );
  let browser;
  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      proxy: {
        server: "http://127.0.0.1:" + denyProxy.address().port,
        bypass: "localhost,127.0.0.1,[::1]",
      },
      args: [
        "--disable-background-networking",
        "--no-first-run",
        "--no-default-browser-check",
      ],
    });
  } catch (error) {
    denyProxy.closeAllConnections();
    await new Promise((resolve) => denyProxy.close(resolve));
    throw error;
  }
  let busy = false,
    closed = false;
  async function measure(input) {
    if (busy || closed)
      throw Error(
        closed
          ? "Browser benchmark is closed"
          : "Browser measurements must run sequentially",
      );
    if (!input || !isLocal(input.url))
      throw Error("A loopback HTTP(S) portal URL is required");
    if (typeof input.markerTitle !== "string" || !input.markerTitle.trim())
      throw Error("markerTitle must identify an actual fixture system");
    if (
      typeof input.focusContextId !== "string" ||
      !input.focusContextId.trim()
    )
      throw Error("focusContextId is required");
    const repetitions = input.repetitions ?? 3,
      timeoutMs = input.timeoutMs ?? 90000,
      minimumGraphNodes = input.minimumGraphNodes ?? 50,
      graphPresentation = input.graphPresentation ?? "smartants";
    if (
      !Number.isInteger(repetitions) ||
      repetitions < 1 ||
      repetitions > 10 ||
      !Number.isInteger(timeoutMs) ||
      timeoutMs < 1000 ||
      timeoutMs > 300000 ||
      !["smartants", "plantuml"].includes(graphPresentation) ||
      !Number.isInteger(minimumGraphNodes) ||
      minimumGraphNodes < 1
    )
      throw Error("Invalid measurement limits");
    if (
      input.graphMarkers !== undefined &&
      (!Array.isArray(input.graphMarkers) ||
        input.graphMarkers.length < minimumGraphNodes ||
        input.graphMarkers.some(
          (marker) => typeof marker !== "string" || !marker.trim(),
        ))
    )
      throw Error("graphMarkers must contain expected system labels");
    const sequential = input.markerTitle.match(/^(.*?)([0-9]+)$/);
    const expectedGraphMarkers =
      input.graphMarkers ||
      (sequential
        ? Array.from(
            { length: minimumGraphNodes },
            (_, index) =>
              sequential[1] +
              String(Number(sequential[2]) + index).padStart(
                sequential[2].length,
                "0",
              ),
          )
        : []);
    const entryUrl = new URL(input.url),
      focusUrl = new URL("/entities/contexts/" + graphPresentation, entryUrl);
    focusUrl.searchParams.set("dh-context-id", input.focusContextId);
    const report = {
      format: "seaf-browser-benchmark-v1",
      status: "running",
      started: new Date().toISOString(),
      url: readableUrl(entryUrl.href),
      focusUrl: readableUrl(focusUrl.href),
      markerTitle: input.markerTitle,
      focusContextId: input.focusContextId,
      graphPresentation,
      repetitions,
      browser: {
        executablePath,
        version: browser.version(),
        headless: true,
        viewport: { width: 1600, height: 1000 },
        serviceWorkers: "blocked",
      },
      methodology: {
        cold: "Fresh non-persistent BrowserContext per repetition; browser process/OS caches are not cold and launch time is excluded.",
        warm: "Reload in the same context with normal HTTP caching enabled. No Playwright route interception is used because it disables HTTP caching.",
        focus:
          "Full navigation to the selected " +
          graphPresentation +
          " presentation with warm HTTP assets; not an SPA-click measurement. PlantUML uses local Graphviz, SmartAnts its configured computation mode.",
        ready:
          "Visible exact system title, then two animation frames. SmartAnts requires the requested node count and no spinner/error. PlantUML requires a visible SVG containing every expected system label (or component hyperlinks when no label sequence is available).",
        network:
          "CDP page traffic only; encodedWireBytes is loadingFinished.encodedDataLength, including protocol/header overhead as reported by Chrome. Cached resources can report zero. WebSocket/EventSource are excluded from quietness checks.",
        external:
          "A local deny-only HTTP/CONNECT proxy blocks non-loopback HTTP(S); loopback is bypassed. Page attempts are recorded. No results are fabricated when a marker or graph fails.",
      },
      runs: [],
      failures: [],
      pageErrors: [],
      consoleErrors: [],
      browserLogErrors: [],
      unexpectedExternalRequests: [],
    };
    busy = true;
    try {
      for (let repetition = 0; repetition < repetitions; repetition++) {
        const context = await browser.newContext({
          viewport: report.browser.viewport,
          deviceScaleFactor: 1,
          locale: "ru-RU",
          colorScheme: "light",
          serviceWorkers: "block",
        });
        let phase,
          closing = false;
        const run = {
          repetition: repetition + 1,
          phases: {},
          pageErrors: [],
          consoleErrors: [],
          browserLogErrors: [],
          unexpectedExternalRequests: [],
        };
        report.runs.push(run);
        const page = await context.newPage(),
          cdp = await context.newCDPSession(page),
          requests = new Map();
        page.setDefaultTimeout(timeoutMs);
        page.setDefaultNavigationTimeout(timeoutMs);
        await cdp.send("Network.enable");
        await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
        await cdp.send("Log.enable");
        page.on("console", (message) => {
          if (closing || message.type() !== "error") return;
          const item = {
            phase: phase?.name || "setup",
            message: message.text(),
            location: message.location(),
          };
          run.consoleErrors.push(item);
          report.consoleErrors.push({ repetition: repetition + 1, ...item });
        });
        cdp.on("Log.entryAdded", ({ entry }) => {
          if (closing || entry.level !== "error") return;
          const item = {
            phase: phase?.name || "setup",
            source: entry.source,
            message: entry.text,
            url: entry.url ? readableUrl(entry.url) : null,
            networkRequestId: entry.networkRequestId || null,
          };
          run.browserLogErrors.push(item);
          report.browserLogErrors.push({ repetition: repetition + 1, ...item });
        });
        page.on("pageerror", (error) => {
          if (closing) return;
          const item = {
            phase: phase?.name || "setup",
            message: error.message,
          };
          run.pageErrors.push(item);
          report.pageErrors.push({ repetition: repetition + 1, ...item });
        });
        cdp.on("Network.requestWillBeSent", (event) => {
          if (closing || !phase || !/^https?:/i.test(event.request.url)) return;
          if (!isLocal(event.request.url)) {
            const blocked = {
              phase: phase.name,
              url: readableUrl(event.request.url),
              method: event.request.method,
              resourceType: event.type,
              blockedBy: "local-deny-proxy",
            };
            run.unexpectedExternalRequests.push(blocked);
            report.unexpectedExternalRequests.push({
              repetition: repetition + 1,
              ...blocked,
            });
          }
          const item = {
            requestId: event.requestId,
            phase: phase.name,
            url: readableUrl(event.request.url),
            method: event.request.method,
            type: event.type,
            backend: backendRequest(event.request.url),
            encodedWireBytes: 0,
            finished: false,
            cached: false,
            origin:
              event.request.headers.Origin ||
              event.request.headers.origin ||
              null,
          };
          requests.set(event.requestId, item);
          phase.requests.push(item);
          phase.lastNetworkActivity = performance.now();
        });
        cdp.on("Network.requestServedFromCache", (event) => {
          const item = requests.get(event.requestId);
          if (item) item.cached = true;
        });
        cdp.on("Network.responseReceived", (event) => {
          const item = requests.get(event.requestId);
          if (!item || closing) return;
          item.status = event.response.status;
          item.mimeType = event.response.mimeType;
          item.corsHeaders = Object.fromEntries(
            Object.entries(event.response.headers).filter(([name]) =>
              /^(access-control-|cross-origin-)|^content-type$/i.test(name),
            ),
          );
          item.cached ||= !!(
            event.response.fromDiskCache ||
            event.response.fromServiceWorker ||
            event.response.fromPrefetchCache
          );
        });
        cdp.on("Network.responseReceivedExtraInfo", (event) => {
          const item = requests.get(event.requestId);
          if (!item || closing) return;
          item.networkStatus = event.statusCode;
          item.corsHeaders = Object.fromEntries(
            Object.entries(event.headers).filter(([name]) =>
              /^(access-control-|cross-origin-)|^content-type$/i.test(name),
            ),
          );
        });
        cdp.on("Network.loadingFinished", (event) => {
          const item = requests.get(event.requestId);
          if (item && !closing) {
            item.finished = true;
            item.encodedWireBytes = event.encodedDataLength;
            if (phase?.name === item.phase)
              phase.lastNetworkActivity = performance.now();
          }
        });
        cdp.on("Network.loadingFailed", (event) => {
          const item = requests.get(event.requestId);
          if (item && !closing) {
            item.finished = true;
            item.failure = event.errorText;
            item.blockedReason = event.blockedReason || null;
            item.corsErrorStatus = event.corsErrorStatus || null;
            item.canceled = !!event.canceled;
            if (phase?.name === item.phase)
              phase.lastNetworkActivity = performance.now();
          }
        });

        const navigate = async (
          name,
          destination,
          reload = false,
          graph = false,
        ) => {
          phase = {
            name,
            status: "running",
            requests: [],
            lastNetworkActivity: performance.now(),
          };
          if (graph) phase.graphPresentation = graphPresentation;
          run.phases[name] = phase;
          const start = performance.now();
          try {
            const response = reload
              ? await page.reload({ waitUntil: "domcontentloaded" })
              : await page.goto(destination, { waitUntil: "domcontentloaded" });
            if (!response || !response.ok())
              throw Error(
                "Portal navigation failed: " +
                  (response?.status() ?? "no response"),
              );
            phase.domContentLoadedObservedMs = performance.now() - start;
            const readyHandle = await page.waitForFunction(
              graph
                ? graphPresentation === "plantuml"
                  ? plantumlReady
                  : smartantsReady
                : visibleModelMarker,
              graph
                ? {
                    marker: input.graphMarker || null,
                    minimumNodes: minimumGraphNodes,
                    expectedMarkers: expectedGraphMarkers,
                  }
                : { marker: input.markerTitle },
              {
                timeout: Math.max(1, timeoutMs - (performance.now() - start)),
                polling: 50,
              },
            );
            phase.marker = await readyHandle.jsonValue();
            await readyHandle.dispose();
            if (phase.marker.failure)
              throw Error(
                graphPresentation + " renderer failed: " + phase.marker.failure,
              );
            const paintReadyMs = await page.evaluate(
              () =>
                new Promise((resolve) =>
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve(performance.now())),
                  ),
                ),
            );
            phase[graph ? "graphReadyMs" : "firstUiReadyMs"] = paintReadyMs;
            if (graph)
              phase[
                graphPresentation === "plantuml"
                  ? "plantumlReadyMs"
                  : "smartantsReadyMs"
              ] = paintReadyMs;
            phase.readyObservedMs = performance.now() - start;
            const quietDeadline = Math.min(
              start + timeoutMs,
              performance.now() + 10000,
            );
            while (true) {
              const inFlight = phase.requests.filter(
                (request) =>
                  !request.finished &&
                  !["WebSocket", "EventSource"].includes(request.type),
              );
              if (
                !inFlight.length &&
                performance.now() - phase.lastNetworkActivity >= 200
              )
                break;
              if (performance.now() >= quietDeadline)
                throw Error(
                  "Page network did not become quiet; unfinished: " +
                    inFlight
                      .map((request) => request.url)
                      .slice(0, 5)
                      .join(", "),
                );
              await pause(25);
            }
            phase.navigation = await navigationMetrics(page);
            const failures = phase.requests.filter(
              (request) => request.failure || request.status >= 400,
            );
            if (failures.length)
              throw Error(
                "Failed page resources: " +
                  failures
                    .slice(0, 4)
                    .map(
                      (request) =>
                        request.url + " " + (request.failure || request.status),
                    )
                    .join("; "),
              );
            if (run.pageErrors.some((error) => error.phase === name))
              throw Error(
                "Page JavaScript error: " +
                  run.pageErrors.find((error) => error.phase === name).message,
              );
            if (run.consoleErrors.some((error) => error.phase === name))
              throw Error(
                "Browser console error: " +
                  run.consoleErrors.find((error) => error.phase === name)
                    .message,
              );
            if (
              run.unexpectedExternalRequests.some(
                (request) => request.phase === name,
              )
            )
              throw Error("Unexpected external page requests were blocked");
            phase.status = "passed";
          } catch (error) {
            phase.status = "failed";
            phase.error = error.message;
            report.failures.push({
              repetition: repetition + 1,
              phase: name,
              message: error.message,
            });
            phase.urlAtFailure = readableUrl(page.url());
            phase.observedGraph = await page
              .evaluate(() => ({
                nodes: document.querySelectorAll(
                  ".smart-ants svg.dochub-schema text.node-text",
                ).length,
                error:
                  document.querySelector(
                    ".smart-ants svg.dochub-schema text.error",
                  )?.textContent || null,
                title: document.title,
                plantumlSvgs: document.querySelectorAll(".plantuml-schema svg")
                  .length,
                plantumlText: [
                  ...document.querySelectorAll(".plantuml-schema svg text"),
                ]
                  .slice(0, 12)
                  .map((node) => node.textContent),
              }))
              .catch(() => null);
          } finally {
            phase.totalObservedMs = performance.now() - start;
            const all = phase.requests,
              backend = all.filter((request) => request.backend);
            phase.network = {
              requestCount: all.length,
              backendRequestCount: backend.length,
              encodedWireBytes: all.reduce(
                (sum, request) => sum + request.encodedWireBytes,
                0,
              ),
              backendEncodedWireBytes: backend.reduce(
                (sum, request) => sum + request.encodedWireBytes,
                0,
              ),
              cachedRequestCount: all.filter((request) => request.cached)
                .length,
              failedRequestCount: all.filter(
                (request) => request.failure || request.status >= 400,
              ).length,
              unfinishedRequestCount: all.filter((request) => !request.finished)
                .length,
            };
            delete phase.lastNetworkActivity;
          }
          return phase.status === "passed";
        };
        try {
          if (!(await navigate("cold", entryUrl.href))) break;
          if (!(await navigate("warm", entryUrl.href, true))) break;
          if (!(await navigate("focus", focusUrl.href, false, true))) break;
        } finally {
          closing = true;
          phase = null;
          await cdp.detach().catch(() => {});
          await context.close();
        }
      }
      report.summary = Object.fromEntries(
        ["cold", "warm", "focus"].map((name) => {
          const phases = report.runs
              .map((run) => run.phases[name])
              .filter(Boolean),
            passed = phases.filter((value) => value.status === "passed"),
            key = name === "focus" ? "graphReadyMs" : "firstUiReadyMs";
          return [
            name,
            {
              passed: passed.length,
              failed: phases.length - passed.length,
              readyMs: aggregate(passed.map((value) => value[key])),
              domContentLoadedMs: aggregate(
                passed
                  .map((value) => value.navigation.domContentLoadedMs)
                  .filter((value) => value !== null),
              ),
              encodedWireBytes: aggregate(
                passed.map((value) => value.network.encodedWireBytes),
              ),
              backendRequests: aggregate(
                passed.map((value) => value.network.backendRequestCount),
              ),
            },
          ];
        }),
      );
      report.status =
        report.failures.length ||
        report.pageErrors.length ||
        report.consoleErrors.length ||
        report.browserLogErrors.length ||
        report.unexpectedExternalRequests.length ||
        report.runs.length !== repetitions
          ? "failed"
          : "passed";
      report.completed = new Date().toISOString();
      return report;
    } finally {
      busy = false;
    }
  }
  return {
    measure,
    async close() {
      if (!closed) {
        closed = true;
        try {
          await browser.close();
        } finally {
          denyProxy.closeAllConnections();
          await new Promise((resolve) => denyProxy.close(resolve));
        }
      }
    },
  };
}

export async function measureBrowser(options) {
  const benchmark = await createBrowserBench(options);
  try {
    return await benchmark.measure(options);
  } finally {
    await benchmark.close();
  }
}
