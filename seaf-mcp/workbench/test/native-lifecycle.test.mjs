/** Real Windows native acceptance. All writes use a private copied ShopFlow.
 * Run with SEAF_NATIVE_E2E=1 and SEAF_NATIVE_BUNDLE=<portable bundle root>.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Engine } from "../../engine.mjs";
import { Workbench } from "../domain.mjs";

const service = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const receiptFile = path.join(
  service,
  "state/acceptance/native-lifecycle.json",
);

test(
  "native lifecycle: real model validation, Git save/reload, stale protection and isolated revision/snapshot preview",
  {
    skip: process.env.SEAF_NATIVE_E2E !== "1",
    timeout: 180000,
  },
  async (t) => {
    const bundleRoot = path.resolve(
      process.env.SEAF_NATIVE_BUNDLE ||
        path.join(service, "../portable/state/SEAF Перенос v2"),
    );
    const testRoot = path.join(service, "state/test-native-lifecycle"),
      dir = path.join(testRoot, randomUUID());
    const workspace = path.join(dir, "Модель с пробелами"),
      root = path.join(workspace, "shopflow");
    const config = path.join(dir, "projects.json"),
      engine = new Engine(config, path.join(dir, "state"));
    await fs.mkdir(root, { recursive: true });
    await engine.copyArtifacts(
      path.join(bundleRoot, "examples/shopflow"),
      root,
    );
    await fs.writeFile(
      path.join(workspace, "root.yaml"),
      "imports:\n  - shopflow/root.yaml\n",
    );
    await fs.writeFile(
      config,
      JSON.stringify({
        projects: [
          {
            id: "native-fixture",
            root,
            manifest: "root.yaml",
            writable: true,
            source: { kind: "git" },
            validation: {
              runtime: "native",
              workspace,
              manifest: "workspace/root.yaml",
              native: {
                bundleRoot,
                node: path.join(bundleRoot, "runtime/node/node.exe"),
                coreRoot: path.join(bundleRoot, "app/core"),
                stateRoot: path.join(dir, "runtime"),
              },
            },
          },
        ],
      }),
    );
    const p = await engine.project("native-fixture"),
      wb = await new Workbench(engine, {
        state: path.join(dir, "workbench"),
        specRoot: null,
      }).init();
    const report = {
      status: "running",
      started: new Date().toISOString(),
      fixture: dir,
      runtime: "native",
      productionWrites: false,
      cases: [],
    };
    const save = () =>
      fs.writeFile(receiptFile, JSON.stringify(report, null, 2));
    await fs.mkdir(path.dirname(receiptFile), { recursive: true });
    t.after(async () => {
      for (const preview of [...wb.previews.values()])
        await wb.stopPreview(p.id, preview.id).catch(() => {});
      for (const runtime of engine.runtimes.values()) await runtime.closeAll();
      const relative = path.relative(testRoot, dir);
      assert.ok(
        relative && !relative.startsWith("..") && !path.isAbsolute(relative),
      );
      await fs.rm(dir, { recursive: true, force: true });
    });
    const observed = async (name, fn) => {
      const step = { name, status: "running" };
      report.cases.push(step);
      await save();
      try {
        step.result = await fn();
        step.status = "passed";
      } catch (error) {
        step.status = "failed";
        step.error = error.message;
        throw error;
      } finally {
        await save();
      }
    };
    const query = async (url, expression) => {
      const response = await fetch(
        url +
          "/core/storage/jsonata/" +
          encodeURIComponent("(" + expression + ")"),
        { signal: AbortSignal.timeout(10000) },
      );
      assert.equal(response.status, 200, await response.clone().text());
      return response.json();
    };
    try {
      await engine.git(p, ["init", "-b", "main"]);
      await engine.git(p, ["add", "."]);
      await engine.git(p, [
        "-c",
        "user.name=Native QA",
        "-c",
        "user.email=native-qa@localhost",
        "commit",
        "-m",
        "Private native baseline",
      ]);
      const baseline = await engine.git(p, ["rev-parse", "HEAD"]),
        before = await engine.entity(p.id, "components", "demo.shop.delivery"),
        runtime = await engine.runtime(p);
      assert.ok(before.value?.title && before.value.owner === "Logistics");
      const live = await runtime.start({
        workspace,
        manifest: "workspace/root.yaml",
      });
      await engine.updateProject(p.id, { portal: live.url });
      await observed(
        "actual ShopFlow baseline and all 15 validators",
        async () => {
          assert.equal(
            await query(live.url, '$count(components.*[kind="microservice"])'),
            7,
          );
          const result = await runtime.validate({
            workspace,
            manifest: "workspace/root.yaml",
          });
          assert.equal(result.ok, true, JSON.stringify(result));
          assert.equal(result.rules, 15);
          return { services: 7, rules: result.rules };
        },
      );
      await observed(
        "invalid owner is rejected before source writes",
        async () => {
          const invalid = await engine.upsert(
            p.id,
            "architecture/components.yaml",
            "components",
            "demo.shop.delivery",
            { ...before.value, owner: "" },
            "Invalid owner",
          );
          const validation = await engine.validate(invalid.proposalId);
          assert.equal(validation.ok, false);
          assert.equal(validation.rules, 15);
          assert.ok(
            validation.problems.some(
              (problem) => problem.id === "demo.shop.quality.owner",
            ),
          );
          await assert.rejects(engine.apply(invalid.proposalId), /Validate/);
          assert.equal(await engine.git(p, ["rev-parse", "HEAD"]), baseline);
          return { rules: validation.rules, rejected: true };
        },
      );
      const stale = await engine.upsert(
        p.id,
        "architecture/components.yaml",
        "components",
        "demo.shop.delivery",
        { ...before.value, description: "Stale edit" },
        "Stale edit",
      );
      await observed(
        "validated apply saves one commit and refreshes a real native portal",
        async () => {
          const valid = await engine.upsert(
            p.id,
            "architecture/components.yaml",
            "components",
            "demo.shop.delivery",
            {
              ...before.value,
              description: "Dispatches paid orders after native validation",
            },
            "Native architecture update",
          );
          const validation = await engine.validate(valid.proposalId);
          assert.equal(validation.ok, true);
          assert.equal(validation.rules, 15);
          const result = await engine.apply(valid.proposalId);
          assert.match(result.commit, /^[a-f0-9]{40}$/);
          assert.equal(result.reload.status, "updated");
          assert.equal(
            await query(
              live.url,
              'components."demo.shop.delivery".description',
            ),
            "Dispatches paid orders after native validation",
          );
          assert.equal(
            (await engine.apply(valid.proposalId)).commit,
            result.commit,
          );
          assert.equal(
            await engine.git(p, ["rev-list", "--count", "HEAD"]),
            "2",
          );
          await assert.rejects(engine.validate(stale.proposalId), /Stale/);
          await engine.clean(p);
          return {
            commit: result.commit,
            reload: result.reload.status,
            exactlyOneCommit: true,
            staleRejected: true,
          };
        },
      );
      await observed(
        "Git revision preview and verified snapshot remain isolated",
        async () => {
          const current = await engine.fingerprint(root),
            preview = await wb.preview(p.id, { ref: baseline });
          assert.equal(
            await query(
              preview.url,
              'components."demo.shop.delivery".description',
            ),
            before.value.description,
          );
          assert.equal(await engine.fingerprint(root), current);
          await wb.stopPreview(p.id, preview.id);
          const first = await wb.snapshot(p.id, "Native state"),
            second = await wb.snapshot(p.id, "Same content");
          assert.equal(first.id, second.id);
          assert.equal(first.runtime.kind, "native");
          assert.equal((await wb.snapshotVerify(p.id, first.id)).ok, true);
          const restored = await wb.preview(p.id, { snapshotId: first.id });
          assert.equal(
            await query(
              restored.url,
              'components."demo.shop.delivery".description',
            ),
            "Dispatches paid orders after native validation",
          );
          await wb.stopPreview(p.id, restored.id);
          assert.equal(await engine.fingerprint(root), current);
          assert.equal((await fetch(live.url + "/health")).ok, true);
          return {
            snapshot: first.id,
            runtimeIdentity: first.runtime.identity.id,
            liveUnchanged: true,
          };
        },
      );
      report.status = "passed";
      report.completed = new Date().toISOString();
      await save();
    } catch (error) {
      report.status = "failed";
      report.error = error.stack || error.message;
      await save();
      throw error;
    }
  },
);
