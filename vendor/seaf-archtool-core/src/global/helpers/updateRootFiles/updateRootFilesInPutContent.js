/*
  Copyright (C) 2025 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber
*/

import parser, { isSourceItem } from '@global/manifest/parser3/index.mjs';
import yaml from 'yaml';
import {
  BITBUCKET_URI_PREFIX,
  DOCHUB_INDEX_FILE_NAME,
  GITLAB_URI_PREFIX,
  SEAF_INDEX_FILE_NAME,
  GIT_ROOT_URI_SEPARATOR
} from '@global/constants.mjs';

/**
 * @typedef {import('./updateRootFilesInPutContent.types.js').SourceItemLike} SourceItemLike
 * @typedef {import('./updateRootFilesInPutContent.types.js').ManifestParserLike} ManifestParserLike
 * @typedef {import('./updateRootFilesInPutContent.types.js').CommitData} CommitData
 */

/** Расширение файла манифеста. */
const YAML_FILE_EXTENSION = '.yaml';
const YML_FILE_EXTENSION = '.yml';

/**
 * Имя метассылки на корневой файл плагина (стандарт в проекте), например в составе
 * 'plugin:/idea/source/$root'. В отличие от portal (bitbucket:/gitlab:), в плагине не
 * существует seaf.yaml/dochub.yaml - $root ссылается на корневой файл, каким бы он ни был.
 */
const PLUGIN_ROOT_FILE_NAME = '$root';

/**
 * Суффикс, которым помечается файл при работе в плагине (стандарт в проекте)
 * 'plugin:/idea/source/$root'.
 */
const PLUGIN_ROOT_URI_SUFFIX = `/${PLUGIN_ROOT_FILE_NAME}`;

/** Сегмент пути "текущий каталог" (как в POSIX-путях). */
const CURRENT_DIR_SEGMENT = '.';

/** Сегмент пути "родительский каталог" (как в POSIX-путях). */
const PARENT_DIR_SEGMENT = '..';

/** Разделитель сегментов пути в URI. */
const PATH_SEGMENT_SEPARATOR = '/';

/** Один или несколько слэшей в конце строки. */
const TRAILING_SLASHES_PATTERN = /\/+$/;

/** Один или несколько слэшей в начале строки. */
const LEADING_SLASHES_PATTERN = /^\/+/;

/**
 * Резолвит относительный путь файла из коммита (`path`, ключ commitData) в абсолютный
 * URI, применяя сегменты `.` и `..` к каталогу `baseUri`. Подъём через `..` не может
 * увести выше `rootUri`.
 *
 * @param {string} path - относительный путь, например `'base_data.yaml'` или `'../base.test.yaml'`.
 * @param {string} baseUri - абсолютный URI файла, относительно которого резолвится `path`,
 *   например `'plugin:/idea/source/seaf-examples/base/base.yaml'`.
 * @param {string} rootUri - абсолютный root URI (до нормализации), нужен только чтобы не
 *   дать `..` подняться выше него, например `'plugin:/idea/source/$root'`.
 * @returns {string} абсолютный URI файла, например для `path = '../base_data.yaml'` и
 *   указанного выше `baseUri` вернёт `'plugin:/idea/source/seaf-examples/base_data.yaml'`.
 */
export function resolvePathInsideRoot(path, baseUri, rootUri) {
  const rootUriPathListLength = rootUri.split(PATH_SEGMENT_SEPARATOR).length;
  const uriPathList = baseUri.split(PATH_SEGMENT_SEPARATOR);
  const pathList = path.split(PATH_SEGMENT_SEPARATOR).filter(Boolean);

  return pathList
      .slice(0, -1)
      .reduce((accumulator, directory) => {
        if (directory === CURRENT_DIR_SEGMENT) {
          return accumulator;
        } else if (directory === PARENT_DIR_SEGMENT) {
          if (accumulator.length > rootUriPathListLength) {
            accumulator.splice(accumulator.length - 2, 1);
          }
          return accumulator;
        } else {
          accumulator.splice(accumulator.length - 1, 0, directory);
          return accumulator;
        }
      }, uriPathList.slice(0, -1).concat(pathList.at(-1)))
      .join(PATH_SEGMENT_SEPARATOR);
}

/**
 * Строит `../`-относительный путь от `baseUri` до `targetUri`, сравнивая их каталоги
 * посегментно слева направо — по количеству `/`, без учёта смысла "root"
 * (в отличие от relativeImportPath).
 *
 * @param {string} baseUri - точка отсчёта, например `'plugin:/idea/source/base/base.yaml'`.
 * @param {string} targetUri - целевой файл, например `'plugin:/idea/source/root.yaml'`.
 * @returns {string} относительный путь, например `'../root.yaml'` для примеров выше.
 */
function createRelativePath(baseUri, targetUri) {
  const baseUriPathList = baseUri.split(PATH_SEGMENT_SEPARATOR).slice(0, -1);
  const targetUriPathList = targetUri.split(PATH_SEGMENT_SEPARATOR).slice(0, -1);

  const resultPathList = [];
  const maxLength = Math.max(baseUriPathList.length, targetUriPathList.length);
  for (let index = 0; index < maxLength; index++) {
    if (baseUriPathList[index] !== targetUriPathList[index]) {
      resultPathList.push(
          ...baseUriPathList.slice(index).fill(PARENT_DIR_SEGMENT),
          ...targetUriPathList.slice(index)
      );
      break;
    }
  }

  resultPathList.push(targetUri.split(PATH_SEGMENT_SEPARATOR).at(-1));
  return resultPathList.join(PATH_SEGMENT_SEPARATOR);
}

/**
 * Возвращает новый манифест источника `source` с добавленным в `imports` значением
 * `uri` (без дублей).
 *
 * `source` бывает двух видов:
 * - настоящий SourceItem (`isSourceItem(source) === true`) — тогда манифест берётся
 *   из `source.manifest`, например `{ manifest: { title: 'x' }, imports: [] }` даст
 *   манифест `{ title: 'x' }`;
 * - сырые данные файла или уже собранная запись content[...] — тогда манифестом
 *   является сам `source` целиком, например `{ title: 'x', imports: [] }` даст
 *   манифест `{ title: 'x', imports: [] }` (imports для такого источника — просто
 *   ещё один его атрибут, а не отдельная от манифеста сущность).
 *
 * @param {SourceItemLike|Object} source - источник, из которого берётся манифест и текущий imports.
 * @param {string} uri - абсолютный URI, который нужно добавить в imports.
 * @returns {Object} манифест с обновлённым imports, например
 *   `{ title: 'x', imports: ['plugin:/idea/source/data.yaml'] }`.
 */
function updateImportsInSource(source, uri) {
  let manifest;
  if (isSourceItem(source)) {
    manifest = { ...source?.manifest };
  } else {
    manifest = { ...source };
  }

  manifest.imports = source.imports
      ? source.imports.includes(uri)
          ? [...source.imports]
          : [...source.imports, uri]
      : [uri];
  return manifest;
}

/**
 * Приводит `rootUri` к "реальному" root — общему префиксу, от которого дальше считаются
 * все относительные уровни (см. getRelativeInfo). Поддерживает 3 формы rootUri:
 * - путь до `.yaml`/`.yml`-файла, например `'plugin:/idea/source/base/root.yaml'` -> `'plugin:/idea/source/base'`;
 * - суффикс PLUGIN_ROOT_URI_SUFFIX, например `'plugin:/idea/source/$root'` -> `'plugin:/idea/source'`;
 * - "склеенная" portal-схема git-репозитория (bitbucket:/gitlab:, см. example.env) с
 *   GIT_ROOT_URI_SEPARATOR внутри строки, например `'bitbucket:WORK:repo:branch@'`
 *   остаётся как есть.
 *
 * @param {string} rootUri - непустая строка в одном из поддерживаемых форматов.
 * @throws {Error} если `rootUri` пустой/не строка, формат не распознан, либо результат пуст.
 * @returns {string} нормализованный root без хвостовых слэшей.
 */
function normalizeRootUri(rootUri) {
  if (typeof rootUri !== 'string' || !rootUri.trim()) {
    throw new Error(
        `updateRootFilesInPutContent: rootUri должен быть непустой строкой, получено: ${JSON.stringify(rootUri)}`
    );
  }

  const isGitRepositoryUri = rootUri.startsWith(BITBUCKET_URI_PREFIX) || rootUri.startsWith(GITLAB_URI_PREFIX);

  let normalized;
  if (rootUri.endsWith(YAML_FILE_EXTENSION) || rootUri.endsWith(YML_FILE_EXTENSION)) {
    normalized = rootUri.substring(0, rootUri.lastIndexOf(PATH_SEGMENT_SEPARATOR));
  } else if (rootUri.endsWith(PLUGIN_ROOT_URI_SUFFIX)) {
    normalized = rootUri.substring(0, rootUri.length - PLUGIN_ROOT_URI_SUFFIX.length);
  } else if (isGitRepositoryUri && rootUri.endsWith(GIT_ROOT_URI_SEPARATOR)) {
    // portal-схема git-репозитория: root приклеен к первому сегменту через
    // GIT_ROOT_URI_SEPARATOR, без слэша, оставляем как есть
    normalized = rootUri;
  } else {
    throw new Error(
        'updateRootFilesInPutContent: rootUri имеет нераспознанный формат ' +
        `(ожидается путь до .yaml/.yml файла, суффикс "${PLUGIN_ROOT_URI_SUFFIX}" или ` +
        `URI git-репозитория вида "${BITBUCKET_URI_PREFIX}${GIT_ROOT_URI_SEPARATOR}` +
        `"${GITLAB_URI_PREFIX}${GIT_ROOT_URI_SEPARATOR}"): ${JSON.stringify(rootUri)}`
    );
  }

  normalized = normalized.replace(TRAILING_SLASHES_PATTERN, '');

  if (!normalized) {
    throw new Error(
        `updateRootFilesInPutContent: rootUri резолвится в пустой root: ${JSON.stringify(rootUri)}`
    );
  }

  return normalized;
}

/**
 * вычисляется граница между `realRoot` и остальной частью `uri`.
 *
 * @param {string} uri - абсолютный URI, начинающийся с `realRoot`.
 * @param {string} realRoot - нормализованный root (результат normalizeRootUri).
 * @returns {{separator: string, segments: string[]}}
 * `separator` — '/' либо '' (чем `realRoot` соединяется с первым сегментом);
 * `segments` — реальные уровни (каталоги + имя файла) строго по смыслу, не по количеству `/`.
 * Например для `uri = 'plugin:/idea/source/base/data.yaml'` и `realRoot = 'plugin:/idea/source'`
 *   вернёт `{ separator: '/', segments: ['base', 'data.yaml'] }`.
 */
function getRelativeInfo(uri, realRoot) {
  const pathAfterRoot = uri.slice(realRoot.length);
  const separator = pathAfterRoot.startsWith(PATH_SEGMENT_SEPARATOR) ? PATH_SEGMENT_SEPARATOR : '';
  const segments = pathAfterRoot.replace(LEADING_SLASHES_PATTERN, '').split(PATH_SEGMENT_SEPARATOR).filter(Boolean);
  return { separator, segments };
}

/**
 * Строит URI индекс-файла на уровне `dirSegmentsToKeep` каталогов от `realRoot`"
 *
 * @param {string} realRoot - нормализованный root.
 * @param {string} separator - '/' либо '', см. getRelativeInfo.
 * @param {string[]} dirSegments - каталоги файла (без имени самого файла).
 * @param {number} dirSegmentsToKeep - сколько сегментов из начала `dirSegments` оставить;
 *   `0` соответствует индекс-файлу прямо в `realRoot`.
 * @param {string} indexFileName - имя индекс-файла, например `'root.yaml'`.
 * @returns {string} URI индекс-файла, например для `realRoot = 'plugin:/idea/source'`,
 *   `separator = '/'`, `dirSegments = ['base', 'nested']`, `dirSegmentsToKeep = 1`
 *   вернёт `'plugin:/idea/source/base/root.yaml'`.
 */
function indexUriAtLevel(realRoot, separator, dirSegments, dirSegmentsToKeep, indexFileName) {
  const keptDirSegments = dirSegments.slice(0, dirSegmentsToKeep);
  return keptDirSegments.length
      ? `${realRoot}${separator}${keptDirSegments.join(PATH_SEGMENT_SEPARATOR)}${PATH_SEGMENT_SEPARATOR}${indexFileName}`
      : `${realRoot}${separator}${indexFileName}`;
}

/**
 * Находит для `fileUri` ближайший (снизу вверх — от каталога файла к `realRoot`) уже
 * существующий (в `manifestParser.sources`) или ранее собранный (в `content`) индекс-файл
 * `indexFileName` и дописывает в него импорт `fileUri`. Если ни на одном уровне
 * индекс-файла нет — создаёт цепочку новых индекс-файлов от файла до `realRoot`, а на
 * самом `realRoot` импортирует итог в технический корневой файл:
 * - для plugin (`realRoot` не начинается с BITBUCKET_URI_PREFIX/GITLAB_URI_PREFIX —
 *   normalizeRootUri сохраняет исходный префикс rootUri без изменений) — это сам исходный
 *   (ненормализованный) `rootUri`, каким его прислал вызывающий код: normalizeRootUri
 *   получает `realRoot` именно отрезая от `rootUri` либо суффикс `$root` (JetBrains,
 *   `'plugin:/idea/source/$root'`), либо имя файла `.yaml`/`.yml` (vscode, реальный путь
 *   к seaf.yaml/dochub.yaml) — то есть `rootUri` в обеих формах уже и есть точный URI
 *   технического корневого файла
 * - для portal (bitbucket:/gitlab:) — SEAF_INDEX_FILE_NAME/DOCHUB_INDEX_FILE_NAME
 *   (создавая seaf.yaml, если нет ни одного из них).
 *
 * Мутирует `content`, ничего не возвращает.
 *
 * @param {Object<string, Object>} content - аккумулятор "URI индекс/технического файла" ->
 *   "его новый манифест"; наполняется и читается по ходу вызовов для разных `fileUri`.
 * @param {ManifestParserLike} manifestParser - источник уже известных (загруженных) файлов.
 * @param {string} fileUri - абсолютный URI файла, для которого нужно найти/создать импорт.
 * @param {string} realRoot - нормализованный root.
 * @param {string} indexFileName - имя индекс-файла, например `'root.yaml'`.
 * @param {string} rootUri - исходный (ненормализованный) root URI, см. выше; для plugin-схемы
 *   используется как есть в качестве технического корневого файла.
 * @returns {void}
 */
function attachToFirstReachable(content, manifestParser, fileUri, realRoot, indexFileName, rootUri) {
  const { separator, segments } = getRelativeInfo(fileUri, realRoot);
  const dirSegments = segments.slice(0, -1); // каталоги файла, без его собственного имени

  let importUri = fileUri; // начинаем импортировать с файла переданного как параметр, потом идем по пути вверх

  for (let dirSegmentsToKeep = dirSegments.length; dirSegmentsToKeep >= 0; dirSegmentsToKeep--) {
    const parentUri = indexUriAtLevel(realRoot, separator, dirSegments, dirSegmentsToKeep, indexFileName);

    if (parentUri === importUri) {
      // сам файл и есть этот индекс-файл (например commitData содержит файл,
      // названный так же, как indexFileName, ровно на этом уровне) - импортировать
      // файл в самого себя нельзя, и дальше подниматься тоже незачем: он уже на месте.
      return;
    }

    const parentRootFile = content[parentUri] || manifestParser.sources[parentUri];
    if (parentRootFile) {
      // если найден родительский файл с импортами, куда мы дописали новый файл, то дальше вверх идти не надо
      content[parentUri] = updateImportsInSource(parentRootFile, importUri);
      return;
    } else {
      // иначе создаем файл с импортами и переходит в родительский каталог
      content[parentUri] = updateImportsInSource(content[parentUri] || {}, importUri);
      importUri = parentUri;
    }
  }

  const isPortalRoot = realRoot.startsWith(BITBUCKET_URI_PREFIX) || realRoot.startsWith(GITLAB_URI_PREFIX);

  if (!isPortalRoot) {
    // plugin: между jetbrains и vscode нет договорённости об имени рут-файла, поэтому
    // используется сам rootUri as-is - он уже указывает на технический корневой файл
    // (см. normalizeRootUri: $root-суффикс для JetBrains либо путь до .yaml/.yml для vscode).
    const rootMetaUri = rootUri;

    if (rootMetaUri === importUri) {
      // для JetBrains ($root) совпасть с indexFileName не может (SAFE_FILENAME_RE запрещает "$"),
      // но для vscode rootUri указывает на реальный файл (например seaf.yaml) и может совпасть
      // с уже поднятым indexFileName на уровне realRoot - тогда самоимпорт не нужен.
      return;
    }
    const foundPluginRoot = content[rootMetaUri] || manifestParser.sources[rootMetaUri] || {};
    content[rootMetaUri] = updateImportsInSource(foundPluginRoot, importUri);
    return;
  }

  // portal: technical seaf.yaml / dochub.yaml — соседи корневого indexFileName
  const seafUri = `${realRoot}${separator}${SEAF_INDEX_FILE_NAME}`;
  const dochubUri = `${realRoot}${separator}${DOCHUB_INDEX_FILE_NAME}`;

  if (seafUri === importUri || dochubUri === importUri) {
    // indexFileName совпадает с "seaf.yaml"/"dochub.yaml" - последний шаг подъёма
    // уже создал/нашёл ровно этот технический файл, повторно импортировать его
    // в самого себя не нужно.
    return;
  }

  const foundSeaf = content[seafUri] || manifestParser.sources[seafUri];
  if (foundSeaf) { // если найден seaf.yaml используем его
    content[seafUri] = updateImportsInSource(foundSeaf, importUri);
    return;
  }
  const foundDochub = content[dochubUri] || manifestParser.sources[dochubUri];
  if (foundDochub) { // если нет seaf.yaml, но найден dochub.yaml используем его
    content[dochubUri] = updateImportsInSource(foundDochub, importUri);
    return;
  }
  // если нет ни seaf.yaml ни dochub.yaml то создаем seaf.yaml
  content[seafUri] = updateImportsInSource(content[seafUri] || {}, importUri);
}

/**
 * Root-aware относительный путь между двумя абсолютными URI: сравнивает их сегменты
 * (вычисленные через getRelativeInfo от realRoot), а не сами строки URI посимвольно
 * по `/`, как это делает createRelativePath.
 *
 * @param {string} fromUri - URI файла, из которого делается импорт (обычно индекс-файла).
 * @param {string} toUri - URI импортируемого файла.
 * @param {string} realRoot - нормализованный root.
 * @returns {string} относительный путь, например `'base/root.yaml'` (спуск) или
 *   `'../data.yaml'` (подъём на один уровень и спуск).
 */
function relativeImportPath(fromUri, toUri, realRoot) {
  const fromSegments = getRelativeInfo(fromUri, realRoot).segments.slice(0, -1);
  const toSegments = getRelativeInfo(toUri, realRoot).segments;

  let index = 0;
  while (index < fromSegments.length && index < toSegments.length - 1 && fromSegments[index] === toSegments[index]) index++;

  const climbCount = fromSegments.length - index;
  const descendSegments = toSegments.slice(index);
  return [...Array(climbCount).fill(PARENT_DIR_SEGMENT), ...descendSegments].join(PATH_SEGMENT_SEPARATOR);
}

/**
 * Для набора закоммиченных файлов (commitData), ещё не связанных с манифестом
 * (см. `manifestParser.sources`), достраивает/обновляет ближайшие индекс-файлы
 * (indexFileName) и технические seaf.yaml/dochub.yaml так, чтобы каждый новый файл
 * оказался кем-то импортирован.
 *
 * @param {Object} params
 * @param {string} params.rootUri - абсолютный root URI, см. normalizeRootUri.
 * @param {string} params.baseUri - абсолютный URI файла, относительно которого заданы
 *   ключи (пути) в `commitData`.
 * @param {string} params.indexFileName - имя индекс-файла для текущей схемы, например `'root.yaml'`.
 * @param {CommitData} params.commitData - карта "путь" -> "содержимое файла";
 *   здесь читаются только ключи.
 * @param {ManifestParserLike} [params.manifestParser=parser] - парсер с уже известными
 *   файлами sources.
 * @returns {Object<string, string>} карта "ключ файла для записи" (относительный путь —
 *   для "директорной" plugin-схемы, либо абсолютный URI — для "склеенной" portal-схемы)
 *   -> YAML-строка нового содержимого, например
 *   `{ 'root.yaml': 'imports:\n  - base_data.yaml\n' }`.
 */
export function updateRootFilesInPutContent({
                                              rootUri,
                                              baseUri,
                                              indexFileName,
                                              commitData,
                                              manifestParser = parser
                                            }) {
  const realRoot = normalizeRootUri(rootUri);

  const filesURIList = Object.keys(commitData).map((path) =>
      resolvePathInsideRoot(path, baseUri, rootUri)
  );

  const notConnectedFilesURIList = filesURIList.filter(
      (uri) => !manifestParser.sources[uri]
  );

  const content = {};
  for (const fileUri of notConnectedFilesURIList) {
    attachToFirstReachable(content, manifestParser, fileUri, realRoot, indexFileName, rootUri);
  }

  const result = Object.keys(content).reduce((accumulator, connectUri) => {
    const manifestData = { ...content[connectUri] };
    manifestData.imports = manifestData.imports.map((uri) => relativeImportPath(connectUri, uri, realRoot));

    // legacy: relativePath к baseUri считаем только для "директорной" схемы root (plugin),
    // где separator === PATH_SEGMENT_SEPARATOR. Для "склеенной" схемы (portal, root +
    // GIT_ROOT_URI_SEPARATOR + путь без слэша) ключ остаётся абсолютным — так и должно
    // быть, менять этот легаси-путь для plugin не нужно и опасно.
    // DocHubDoc.putContentForPlugin сам проставляет полные пути, возможно позже будет смысл объединить поведение
    const { separator } = getRelativeInfo(connectUri, realRoot);
    const key = separator === PATH_SEGMENT_SEPARATOR ? createRelativePath(baseUri, connectUri) : connectUri;

    accumulator[key] = yaml.stringify(manifestData);
    return accumulator;
  }, {});

  return result;
}

// Проверяет, что строка является "безопасным" именем файла:
// - разрешены только латинские буквы (a-z, A-Z), цифры (0-9), точка (.) и нижнее подчёркивание (_)
// - строка должна состоять из одного или более таких символов (+), пустая строка не пройдёт
// - запрещено любое вхождение подряд идущих двух точек (..) в любом месте строки —
//   это блокирует классический path traversal (../../etc/passwd и подобное),
//   даже несмотря на то, что слэшей в разрешённых символах нет
// - не разрешены: слэши (/ \), пробелы, спецсимволы (?, *, :, <, >, |, "), юникод-буквы других алфавитов
const SAFE_FILENAME_RE = /^(?!.*\.\.)[A-Za-z0-9._]+$/;

/**
 * Проверяет, что `fileName` — "безопасное" имя файла (см. SAFE_FILENAME_RE): только
 * латиница/цифры/`.`/`_`, непустое, без `..` (без path traversal).
 *
 * @param {string} fileName - проверяемое имя файла, например `'root.yaml'`.
 * @returns {boolean} например `isIndexFileNameValid('root.yaml') === true`,
 *   `isIndexFileNameValid('../root.yaml') === false`.
 */
export function isIndexFileNameValid(fileName) {
  return fileName && SAFE_FILENAME_RE.test(fileName);
}
