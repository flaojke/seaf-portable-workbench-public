/*
  Copyright (C) 2026 Sber

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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber
*/

/**
 * JSDoc-типы для updateRootFilesInPutContent.js. Файл не содержит рантайм-кода,
 * типы подключаются через `@typedef {import('./updateRootFilesInPutContent.types.js').X} X`.
 */

/**
 * @typedef {Object} SourceItemLike
 * @property {Object} [manifest] - содержимое манифеста без ключа imports
 *   (присутствует только у настоящего SourceItem, см. isSourceItem).
 * @property {string[]} [imports] - список абсолютных URI, уже импортированных этим файлом.
 */

/**
 * @typedef {Object} ManifestParserLike
 * @property {Object<string, SourceItemLike>} sources - карта "абсолютный URI файла" ->
 *   уже загруженный/собранный источник.
 */

/**
 * @typedef {Object<string, string>} CommitData
 * Карта "относительный путь файла из коммита" -> "содержимое файла" (YAML-текст).
 * В updateRootFilesInPutContent читаются только ключи (пути) — значения этой
 * функцией не используются.
 */

export {};
