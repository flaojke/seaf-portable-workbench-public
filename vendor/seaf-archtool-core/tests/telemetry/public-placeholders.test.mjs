import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

test('removed development endpoints return 501 with no proxy target', async () => {
  const source = (await fs.readFile(new URL('../../vue.config.cjs', import.meta.url), 'utf8')).replaceAll('\r\n', '\n');
  const body = source.match(/setupMiddlewares: \(middlewares, devServer\) => \{([\s\S]*?)\n        \},\n        proxy:/)[1];
  let routes, handler;
  const app = {post(paths, fn) {routes = paths; handler = fn;}};
  const stack = [];
  const result = vm.runInNewContext('(function(middlewares, devServer) {' + body + '})')(stack, {app});
  assert.equal(result, stack);
  assert.deepEqual(Array.from(routes), ['/oauth', '/chat/completions']);
  let status, payload;
  handler({}, {status(value) {status = value; return this;}, json(value) {payload = value;}});
  assert.equal(status, 501);
  assert.match(payload.error, /not included/);
});

test('import placeholder has no authentication or network lifecycle', async () => {
  const source = await fs.readFile(new URL('../../plugins/meta-integration/components/MetaImport.vue', import.meta.url), 'utf8');
  assert.match(source, /role="status"/);
  assert.doesNotMatch(source, /mounted\s*\(|fetch\s*\(|\$PAPI|https:\/\//);
});
