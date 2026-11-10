import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const scannerPath = path.resolve(__dirname, '../../scripts/index-plugins.mjs');
let root;
let pluginsDirectory;

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), 'seaf-plugin-scanner-'));
  pluginsDirectory = path.join(root, 'public/plugins');
  mkdirSync(path.join(root, 'scripts'), { recursive: true });
  copyFileSync(scannerPath, path.join(root, 'scripts/index-plugins.mjs'));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const addPlugin = (directoryName, fields = {}) => {
  const directory = path.join(pluginsDirectory, directoryName);
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'plugin.js'), 'throw new Error("Plugin must not execute");');
  writeFileSync(path.join(directory, 'plugin.css'), '');
  writeFileSync(path.join(directory, 'plugin.json'), JSON.stringify({
    schemaVersion: 1,
    id: directoryName,
    version: '0.1.0',
    apiVersion: 1,
    documents: [directoryName],
    entry: 'plugin.js',
    styles: ['plugin.css'],
    ...fields
  }));
};

const executeScanner = (args = [], cwd = os.tmpdir()) => spawnSync(process.execPath, [path.join(root, 'scripts/index-plugins.mjs'), ...args], {
    cwd,
    encoding: 'utf8',
    timeout: 10000
  });

const runScanner = () => {
  const result = executeScanner();
  expect(result.error).toBeUndefined();
  expect(result.status).toBe(0);
  return {
    catalog: JSON.parse(readFileSync(path.join(pluginsDirectory, 'catalog.json'), 'utf8')),
    stderr: result.stderr
  };
};

describe('Plugin scanner', () => {
  test('Создаёт пустой catalog при отсутствии plugins', () => {
    expect(runScanner().catalog).toEqual({ schemaVersion: 1, plugins: [] });
  });

  test.each(['relative', 'absolute'])('Индексирует отдельную папку по %s пути, сохраняя публичные URL', (kind) => {
    pluginsDirectory = path.join(root, 'delivery/plugins');
    addPlugin('example-doc');
    const argument = kind === 'relative' ? './delivery/plugins' : pluginsDirectory;
    const result = executeScanner([argument], kind === 'relative' ? root : os.tmpdir());
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    const catalog = JSON.parse(readFileSync(path.join(pluginsDirectory, 'catalog.json'), 'utf8'));
    expect(catalog.plugins).toHaveLength(1);
    expect(catalog.plugins[0].entry).toBe('/plugins/example-doc/plugin.js');
    expect(catalog.plugins[0].styles).toEqual(['/plugins/example-doc/plugin.css']);
    expect(existsSync(path.join(root, 'public/plugins/catalog.json'))).toBe(false);
  });

  test('Создаёт отсутствующую папку, переданную аргументом, и пустой catalog', () => {
    const directory = path.join(root, 'delivery/plugins');
    const result = executeScanner([directory]);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(JSON.parse(readFileSync(path.join(directory, 'catalog.json'), 'utf8')))
      .toEqual({ schemaVersion: 1, plugins: [] });
  });

  test('Лишние аргументы дают код 1 до создания папки или записи catalog', () => {
    const directory = path.join(root, 'delivery/plugins');
    const result = executeScanner([directory, 'extra']);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Usage: npm run plugins:index -- [directory]');
    expect(existsSync(directory)).toBe(false);
    expect(existsSync(path.join(root, 'public/plugins'))).toBe(false);
  });

  test('Аргумент папки не позволяет обойти защиту зарезервированных имён', () => {
    pluginsDirectory = path.join(root, 'delivery/plugins');
    addPlugin('plugins');
    const result = executeScanner([pluginsDirectory]);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Directory "plugins" is reserved for built-in plugin assets');
    expect(existsSync(path.join(pluginsDirectory, 'catalog.json'))).toBe(false);
  });

  test('npm run build создаёт пустой catalog до начала сборки', () => {
    const { scripts } = JSON.parse(readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
    expect(scripts.prebuild).toBe('npm run plugins:index');
    expect(scripts['plugins:index']).toBe('node scripts/index-plugins.mjs');

    writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      private: true,
      scripts: {
        prebuild: scripts.prebuild,
        'plugins:index': scripts['plugins:index'],
        build: 'node scripts/check-catalog.mjs'
      }
    }));
    // Вместо webpack проверяем результат hook непосредственно в момент запуска build.
    writeFileSync(path.join(root, 'scripts/check-catalog.mjs'), `
      import assert from 'node:assert/strict';
      import { readFileSync, writeFileSync } from 'node:fs';
      const catalog = JSON.parse(readFileSync('public/plugins/catalog.json', 'utf8'));
      assert.deepEqual(catalog, { schemaVersion: 1, plugins: [] });
      writeFileSync('build-started', 'ok');
    `);

    expect(existsSync(pluginsDirectory)).toBe(false);
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: root,
      encoding: 'utf8',
      timeout: 20000
    });

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(existsSync(path.join(root, 'build-started'))).toBe(true);
    expect(existsSync(path.join(pluginsDirectory, 'catalog.json.tmp'))).toBe(false);
  });

  test('Формирует metadata без исполнения plugin и кодирует URL', () => {
    addPlugin('web gl', { id: 'webgl', documents: ['example-webgl'] });
    const { catalog } = runScanner();
    expect(catalog).toEqual({
      schemaVersion: 1,
      plugins: [{
        id: 'webgl',
        version: '0.1.0',
        apiVersion: 1,
        documents: ['example-webgl'],
        entry: '/plugins/web%20gl/plugin.js',
        scripts: [],
        styles: ['/plugins/web%20gl/plugin.css']
      }]
    });
    expect(existsSync(path.join(pluginsDirectory, 'catalog.json.tmp'))).toBe(false);
  });

  test('Пропускает отсутствующий descriptor, неправильный JSON и отсутствующий asset', () => {
    addPlugin('missing-descriptor');
    rmSync(path.join(pluginsDirectory, 'missing-descriptor/plugin.json'));
    addPlugin('invalid-json');
    writeFileSync(path.join(pluginsDirectory, 'invalid-json/plugin.json'), '{');
    addPlugin('missing-style');
    rmSync(path.join(pluginsDirectory, 'missing-style/plugin.css'));
    addPlugin('valid');
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins.map((plugin) => plugin.id)).toEqual(['valid']);
    for (const name of ['missing-descriptor', 'invalid-json', 'missing-style']) {
      expect(stderr).toContain(`Skipping "${name}"`);
    }
  });

  test('При конфликтах сохраняет первый plugin и не резервирует types отклонённого plugin', () => {
    addPlugin('c', { documents: ['free'] });
    addPlugin('b', { documents: ['free', 'shared'] });
    addPlugin('a', { documents: ['shared'] });
    addPlugin('d', { id: 'a', documents: ['other'] });
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins.map((plugin) => plugin.id)).toEqual(['a', 'c']);
    expect(stderr).toContain('document type "shared" is already registered by "a"');
    expect(stderr).toContain('plugin id "a" is already registered');
  });

  test.each([
    [{ schemaVersion: 7 }, 'unsupported schemaVersion'],
    [{ schemaVersion: '1' }, 'unsupported schemaVersion'],
    [{ schemaVersion: undefined }, 'unsupported schemaVersion'],
    [{ id: undefined }, 'id has an invalid format'],
    [{ id: '' }, 'id has an invalid format'],
    [{ id: 'WebGL' }, 'id has an invalid format'],
    [{ id: 'web gl' }, 'id has an invalid format'],
    [{ id: '-webgl' }, 'id has an invalid format'],
    [{ version: undefined }, 'version is required'],
    [{ version: ' ' }, 'version is required'],
    [{ version: 1 }, 'version is required'],
    [{ apiVersion: undefined }, 'apiVersion must be a positive integer'],
    [{ apiVersion: '1' }, 'apiVersion must be a positive integer'],
    [{ apiVersion: 0 }, 'apiVersion must be a positive integer'],
    [{ apiVersion: -1 }, 'apiVersion must be a positive integer'],
    [{ apiVersion: 1.5 }, 'apiVersion must be a positive integer'],
    [{ documents: undefined }, 'documents must contain lowercase'],
    [{ documents: [] }, 'documents must contain lowercase'],
    [{ documents: 'webgl' }, 'documents must contain lowercase'],
    [{ documents: ['WebGL'] }, 'documents must contain lowercase'],
    [{ documents: ['web gl'] }, 'documents must contain lowercase'],
    [{ documents: [' webgl'] }, 'documents must contain lowercase'],
    [{ documents: ['webgl '] }, 'documents must contain lowercase'],
    [{ documents: [null] }, 'documents must contain lowercase'],
    [{ documents: ['webgl', 'webgl'] }, 'documents contains duplicate'],
    [{ styles: undefined }, 'styles must be an array'],
    [{ styles: 'plugin.css' }, 'styles must be an array'],
    [{ styles: [' '] }, 'styles must be an array'],
    [{ styles: [false] }, 'styles must be an array']
  ])('Пропускает некорректные поля %p, сохраняя корректный plugin', (fields, message) => {
    addPlugin('invalid', fields);
    addPlugin('valid');
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins.map((plugin) => plugin.id)).toEqual(['valid']);
    expect(stderr).toContain('Skipping "invalid"');
    expect(stderr).toContain(message);
  });

  test.each([null, [], 'invalid'])('Отклоняет описание, которое не является объектом: %p', (value) => {
    addPlugin('invalid');
    writeFileSync(path.join(pluginsDirectory, 'invalid/plugin.json'), JSON.stringify(value));
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toEqual([]);
    expect(stderr).toContain('plugin.json must contain an object');
  });

  test.each(['plugins', 'packages'])('Останавливает scanner при папке %s и сохраняет старый каталог', (name) => {
    addPlugin('valid');
    runScanner();
    const oldCatalog = readFileSync(path.join(pluginsDirectory, 'catalog.json'), 'utf8');
    addPlugin(name);
    const result = executeScanner();
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`Directory "${name}" is reserved for built-in plugin assets`);
    expect(readFileSync(path.join(pluginsDirectory, 'catalog.json'), 'utf8')).toBe(oldCatalog);
    expect(existsSync(path.join(pluginsDirectory, 'catalog.json.tmp'))).toBe(false);
  });

  test.each(['directory', 'symlink', 'file'])('Проверяет зарезервированное имя до чтения descriptor: %s', (kind) => {
    addPlugin('valid');
    const reservedPath = path.join(pluginsDirectory, 'plugins');
    if (kind === 'directory') mkdirSync(reservedPath);
    else if (kind === 'symlink') symlinkSync('valid', reservedPath, 'dir');
    else writeFileSync(reservedPath, 'conflicting file');

    const result = executeScanner();
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Directory "plugins" is reserved for built-in plugin assets');
    expect(existsSync(path.join(pluginsDirectory, 'catalog.json'))).toBe(false);
  });

  test.each(['plugins', 'packages'])('Ошибка prebuild при папке %s не запускает build', (name) => {
    addPlugin(name);
    const { scripts } = JSON.parse(readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
    writeFileSync(path.join(root, 'package.json'), JSON.stringify({
      private: true,
      scripts: {
        prebuild: scripts.prebuild,
        'plugins:index': scripts['plugins:index'],
        build: 'node scripts/build-marker.mjs'
      }
    }));
    writeFileSync(path.join(root, 'scripts/build-marker.mjs'), `
      import { writeFileSync } from 'node:fs';
      writeFileSync('build-started', 'unexpected');
    `);
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: root, encoding: 'utf8', timeout: 20000
    });
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`Directory "${name}" is reserved for built-in plugin assets`);
    expect(existsSync(path.join(root, 'build-started'))).toBe(false);
    expect(existsSync(path.join(pluginsDirectory, 'catalog.json'))).toBe(false);
  });

  test('Обычный example-doc индексируется без ограничений зарезервированных папок', () => {
    addPlugin('example-doc');
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins.map((plugin) => plugin.id)).toEqual(['example-doc']);
    expect(catalog.plugins[0].entry).toBe('/plugins/example-doc/plugin.js');
    expect(stderr).toBe('');
  });

  test('Принимает plugin без CSS и не проверяет совместимость apiVersion вместо портала', () => {
    addPlugin('valid', { styles: [], apiVersion: 99 });
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toHaveLength(1);
    expect(catalog.plugins[0].styles).toEqual([]);
    expect(catalog.plugins[0].apiVersion).toBe(99);
    expect(stderr).toBe('');
  });

  test.each(['entry', 'styles'])('Отклоняет каталог вместо файла: %s', (field) => {
    addPlugin('invalid', field === 'entry' ? { entry: 'asset' } : { styles: ['asset'] });
    mkdirSync(path.join(pluginsDirectory, 'invalid/asset'));
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toEqual([]);
    expect(stderr).toContain('does not point to a regular file');
  });

  test.each(['entry', 'styles'])('Отклоняет символическую ссылку вместо файла: %s', (field) => {
    addPlugin('invalid', field === 'entry' ? { entry: 'asset' } : { styles: ['asset'] });
    symlinkSync('plugin.js', path.join(pluginsDirectory, 'invalid/asset'));
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toEqual([]);
    expect(stderr).toContain('does not point to a regular file');
  });

  test('Предупреждает о папке-ссылке и сохраняет обычный plugin', () => {
    addPlugin('valid');
    symlinkSync('valid', path.join(pluginsDirectory, 'linked'), 'dir');
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins.map((plugin) => plugin.id)).toEqual(['valid']);
    expect(stderr).toContain('Skipping "linked": symbolic links are not supported');
  });

  test('Отклоняет отсутствующий входной JS', () => {
    addPlugin('invalid', { entry: 'missing.js' });
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toEqual([]);
    expect(stderr).toContain('Skipping "invalid"');
    expect(stderr).toContain('ENOENT');
  });

  test.each(['', ' ', null, '.', '../outside.css', '/outside.css', 'nested\\style.css'])('Отклоняет недопустимый CSS path: %p', (style) => {
    addPlugin('invalid', { styles: [style] });
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toEqual([]);
    expect(stderr).toContain('Skipping "invalid"');
  });

  test.each(['', ' ', null, '.'])('Отклоняет пустой или некорректный entry: %p', (entry) => {
    addPlugin('invalid', { entry });
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toEqual([]);
    expect(stderr).toContain('Skipping "invalid"');
  });

  test('Заменяет старый catalog, удаляя metadata отсутствующих plugins', () => {
    addPlugin('old');
    expect(runScanner().catalog.plugins.map((plugin) => plugin.id)).toEqual(['old']);
    rmSync(path.join(pluginsDirectory, 'old'), { recursive: true });
    addPlugin('new');
    expect(runScanner().catalog.plugins.map((plugin) => plugin.id)).toEqual(['new']);
    expect(existsSync(path.join(pluginsDirectory, 'catalog.json.tmp'))).toBe(false);
  });

  test('Возвращает код 1, если папку поставки невозможно создать', () => {
    mkdirSync(path.join(root, 'public'));
    writeFileSync(pluginsDirectory, 'not a directory');
    const result = executeScanner();
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Failed to generate catalog');
  });

  test('При ошибке записи возвращает код 1 и сохраняет прежний catalog', () => {
    addPlugin('valid');
    const oldCatalog = JSON.stringify({ schemaVersion: 1, plugins: [] });
    writeFileSync(path.join(pluginsDirectory, 'catalog.json'), oldCatalog);
    mkdirSync(path.join(pluginsDirectory, 'catalog.json.tmp'));
    const result = executeScanner();
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Failed to generate catalog');
    expect(readFileSync(path.join(pluginsDirectory, 'catalog.json'), 'utf8')).toBe(oldCatalog);
  });

  test.each(['../outside.js', '/outside.js', 'nested\\plugin.js'])('Отклоняет недопустимый entry: %s', (entry) => {
    addPlugin('invalid', { entry });
    const { catalog, stderr } = runScanner();
    expect(catalog.plugins).toEqual([]);
    expect(stderr).toContain('Skipping "invalid"');
  });
});
