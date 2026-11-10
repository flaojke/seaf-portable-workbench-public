import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { exportDrawio } from "./drawio.mjs";
const here = path.dirname(fileURLToPath(import.meta.url)),
  base = path.dirname(here),
  out = path.join(base, "state", "workbench-release");
await fs.mkdir(out, { recursive: true });
const client = new Client({ name: "seaf-workbench-release", version: "1.0.0" });
const call = async (name, args) => {
  const r = await client.callTool({ name, arguments: args }, undefined, {
    timeout: 120000,
  });
  if (r.isError) throw Error(r.content[0].text);
  return JSON.parse(r.content[0].text);
};
try {
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [path.join(base, "server.mjs")],
      stderr: "inherit",
    }),
  );
  const mode = process.argv[2] || "propose";
  if (mode === "propose") {
    await call("list_projects", {});
    const docsRead = await call("read_artifact", {
        project: "shopflow",
        path: "docs.yaml",
      }),
      componentsRead = await call("read_artifact", {
        project: "shopflow",
        path: "architecture/components.yaml",
      }),
      rootRead = await call("read_artifact", {
        project: "shopflow",
        path: "root.yaml",
      }),
      overviewRead = await call("read_artifact", {
        project: "shopflow",
        path: "docs/lsv/overview.md",
      });
    const docs = YAML.parseDocument(docsRead.content),
      components = YAML.parseDocument(componentsRead.content),
      root = YAML.parseDocument(rootRead.content),
      manifest = JSON.parse(
        await fs.readFile(
          path.join(here, "documentation", "docs-manifest.json"),
          "utf8",
        ),
      ),
      changes = [];
    docs.setIn(["docs", "local.lsv.workbench"], {
      title: "Рабочее пространство SEAF",
      location: "Доработки LSV/03. Рабочее пространство",
      type: "lsv-workbench",
    });
    for (const page of manifest) {
      docs.setIn(["docs", page.id], {
        title: page.title,
        location: page.location,
        type: "markdown",
        toc: true,
        source: page.source,
      });
      changes.push({
        path: page.source,
        content: await fs.readFile(
          path.join(here, "documentation", page.relativeMarkdown),
          "utf8",
        ),
      });
    }
    const assignments = {
      "demo.shop.web": "public",
      "demo.shop.gateway": "edge",
      "demo.shop.orders": "internal",
      "demo.shop.events": "internal",
      "demo.shop.delivery": "logistics",
      "demo.shop.delivery_db": "logistics",
      "demo.shop.orders_db": "internal",
      "demo.shop.notifications": "internal",
    };
    for (const [id, zone] of Object.entries(assignments))
      components.setIn(["components", id, "trustZone"], zone);
    for (const id of [
      "demo.shop.orders",
      "demo.shop.delivery",
      "demo.shop.delivery_db",
    ])
      components.setIn(
        ["components", id, "dataClassification"],
        "confidential",
      );
    const delivery = components
      .getIn(["components", "demo.shop.delivery"])
      .toJSON();
    delivery.links = delivery.links.map((l) => ({
      ...l,
      ...(l.id === "demo.shop.orders"
        ? {
            protocol: "HTTPS",
            dataClassification: "confidential",
            encrypted: true,
          }
        : l.id === "demo.shop.events"
          ? {
              protocol: "AMQP/TLS",
              dataClassification: "internal",
              encrypted: true,
            }
          : l.id === "demo.shop.delivery_db"
            ? {
                protocol: "PostgreSQL/TLS",
                dataClassification: "confidential",
                encrypted: true,
              }
            : {}),
    }));
    components.setIn(["components", "demo.shop.delivery"], delivery);
    const policies = {
      trustPolicies: {
        "logistics-to-internal": {
          title: "Адрес и подтверждённый заказ между Logistics и Commerce",
          classification: "confidential",
          fromZone: "logistics",
          toZone: "internal",
          requireEncryption: true,
          allowedProtocols: ["HTTPS"],
        },
      },
    };
    const imports = root.get("imports").toJSON();
    if (!imports.includes("architecture/trust.yaml"))
      root.set("imports", [...imports, "architecture/trust.yaml"]);
    const full = components.toJSON().components,
      positions = {
        "demo.shop.orders": { x: 80, y: 80 },
        "demo.shop.orders_db": { x: 80, y: 350 },
        "demo.shop.events": { x: 430, y: 80 },
        "demo.shop.delivery": { x: 780, y: 80 },
        "demo.shop.delivery_db": { x: 780, y: 350 },
        "demo.shop.notifications": { x: 430, y: 350 },
      },
      ids = Object.keys(positions),
      selected = {};
    for (const id of ids)
      selected[id] = {
        ...full[id],
        links: (full[id].links || []).filter((l) => ids.includes(l.id)),
        drawio: {
          geometry: { ...positions[id], width: 220, height: 95 },
          style:
            "rounded=1;whiteSpace=wrap;html=0;fillColor=" +
            (id === "demo.shop.delivery"
              ? "#d5e8d4"
              : id.includes("_db")
                ? "#fff2cc"
                : "#dae8fc") +
            ";strokeColor=#6c8ebf;",
        },
      };
    const xml = exportDrawio(
      { components: selected },
      { pageId: "shopflow-delivery", name: "ShopFlow — оформление и доставка" },
    );
    changes.push(
      { path: "docs.yaml", content: docs.toString() },
      { path: "architecture/components.yaml", content: components.toString() },
      { path: "architecture/trust.yaml", content: YAML.stringify(policies) },
      { path: "root.yaml", content: root.toString() },
      { path: "diagrams/shopflow-delivery.drawio", content: xml },
    );
    const catalog =
      "\n\n## Рабочее пространство и новые функции\n\n[Открыть рабочее пространство](/entities/docs/blank?dh-doc-id=local.lsv.workbench). Здесь доступны редактор объектов и черновики, снимки, preview веток, сравнение архитектуры, фокус графа, данные и доверие, ассистент с источниками и локальный draw.io.\n\n" +
      manifest
        .map(
          (p) =>
            "- [" + p.title + "](/entities/docs/blank?dh-doc-id=" + p.id + ")",
        )
        .join("\n") +
      "\n\nВ каждом разделе приведены шаги и пример ShopFlow. Учебная схема доставки: `diagrams/shopflow-delivery.drawio` — откройте её в разделе draw.io рабочего пространства. Аннотации зон и TLS в модели — учебные архитектурные декларации, не настройки работающих микросервисов.\n";
    changes.push({
      path: "docs/lsv/overview.md",
      content:
        overviewRead.content.split(
          "\n\n## Рабочее пространство и новые функции",
        )[0] + catalog,
    });
    const proposal = await call("propose_change", {
      project: "shopflow",
      message:
        "Add architecture workbench documentation, draw.io example and trust model",
      changes,
    });
    await fs.writeFile(
      path.join(out, "proposal.json"),
      JSON.stringify(proposal, null, 2),
    );
    await fs.writeFile(path.join(out, "changes.diff"), proposal.diff);
    console.log(
      JSON.stringify({
        proposalId: proposal.proposalId,
        files: changes.map((c) => c.path),
        diffLines: proposal.diff.split("\n").length,
      }),
    );
  } else if (mode === "sync-docs") {
    await call("list_projects", {});
    const manifest = JSON.parse(
        await fs.readFile(
          path.join(here, "documentation", "docs-manifest.json"),
          "utf8",
        ),
      ),
      changes = [];
    for (const page of manifest) {
      const current = await call("read_artifact", {
          project: "shopflow",
          path: page.source,
        }),
        content = await fs.readFile(
          path.join(here, "documentation", page.relativeMarkdown),
          "utf8",
        );
      if (current.content !== content)
        changes.push({ path: page.source, content });
    }
    if (!changes.length) throw Error("Documentation is already synchronized");
    const proposal = await call("propose_change", {
      project: "shopflow",
      message:
        "Update OpenSpec delivery status and draw.io roundtrip instructions",
      changes,
    });
    await fs.writeFile(
      path.join(out, "proposal.json"),
      JSON.stringify(proposal, null, 2),
    );
    await fs.writeFile(path.join(out, "changes.diff"), proposal.diff);
    console.log(
      JSON.stringify({
        proposalId: proposal.proposalId,
        files: changes.map((c) => c.path),
        diff: proposal.diff,
      }),
    );
  } else {
    const p = JSON.parse(
      await fs.readFile(path.join(out, "proposal.json"), "utf8"),
    );
    if (mode === "validate") {
      const result = await call("validate_change", {
        proposal_id: p.proposalId,
      });
      await fs.writeFile(
        path.join(out, "validation.json"),
        JSON.stringify(result, null, 2),
      );
      console.log(JSON.stringify(result));
    } else if (mode === "apply") {
      const result = await call("apply_change", { proposal_id: p.proposalId });
      await fs.writeFile(
        path.join(out, "applied.json"),
        JSON.stringify(result, null, 2),
      );
      console.log(JSON.stringify(result));
    } else throw Error("Use propose, validate or apply");
  }
} finally {
  await client.close();
}
