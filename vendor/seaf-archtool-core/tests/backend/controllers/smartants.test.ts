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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2026
*/

import {describe, expect, jest, test} from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import md5 from 'md5';

// Контроллер при импорте читает global.$smartants и тянет кеш (соединение с БД) - для ключа кэша это лишнее
jest.mock('@back/storage/cache.mjs', () => ({__esModule: true, default: {}}));
(global as Record<string, unknown>).$smartants = {source: '/nonexistent/smartants.cjs', mode: 'frontend'};

// require, а не import: контроллер должен загрузиться после global.$smartants
const {smartantsCachePrefix} = require('@back/controllers/smartants.mjs') as
    {smartantsCachePrefix: (key: string | undefined, sourcePath: string) => string};

describe('smartantsCachePrefix', () => {
    const source = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'smartants-')), 'smartants.cjs');
    fs.writeFileSync(source, 'bundle v1');

    test('explicit key wins over the bundle hash', () => {
        expect(smartantsCachePrefix('jvm-1.22.0', source)).toBe('smartants.jvm-1.22.0');
    });

    test('without a key the prefix follows the bundle', () => {
        expect(smartantsCachePrefix(undefined, source)).toBe(`smartants.${md5('bundle v1')}`);
        expect(smartantsCachePrefix('', source)).toBe(`smartants.${md5('bundle v1')}`);
    });

    test('unreadable bundle and no key fall back to the bare prefix', () => {
        expect(smartantsCachePrefix(undefined, '/nonexistent/smartants.cjs')).toBe('smartants');
    });
});
