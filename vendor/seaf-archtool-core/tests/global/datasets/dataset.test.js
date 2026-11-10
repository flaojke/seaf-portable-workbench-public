/**
 * Тест гоняет оба драйвера датасетов - бэкендовый и фронтовый. Фронтовый тянет helpers/env.ts ->
 * consts.js с обращением к window, поэтому файлу нужен jsdom; бэкендовая половина под ним работает
 * без изменений, node-API остаются на месте
 *
 * @jest-environment jsdom
 */

/*
  Copyright (C) 2023 Sber

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
      Navasardyan Suren, Sber

  Contributors:
      Navasardyan Suren, Sber - 2023
*/

import {describe, expect, it, jest} from '@jest/globals';

// @back/utils/logger/index.mjs тянет logger-factory.mjs с top-level await, невалидным под babel-jest -
// мокаем выключенным, как он и работает по умолчанию
jest.mock('@back/utils/logger/index.mjs', () => ({
    __esModule: true,
    performanceLogger: null,
    jsonataPerformanceLogger: null
}));

// env.mjs использует import.meta.url, что под babel-jest падает при любом require() -
// подставляем только то, что реально читается по цепочке
jest.mock('@back/helpers/env.mjs', () => {
    // Сайд-эффект: заполняет глобалы, которые читают request.mjs и utils/roles.mjs
    global.$httpRepeater = global.$httpRepeater || {};
    global.$roles = global.$roles || {MODE: undefined, URI: undefined};
    return {
        __esModule: true,
        hasStaticEtag: false,
        ROLES_MODE_V2_ENABLED: false,
        ROLES_MODE_V2_VALUE: 'n'
    };
});

// storage/cache.mjs тоже использует import.meta и тянет соединение с БД. Из него нужен ровно один
// метод: parseSource оборачивает в него разбор источника типа id
jest.mock('@back/storage/cache.mjs', () => ({
    __esModule: true,
    default: {
        pullFromDataCache: (prefix, key, resolver) => resolver()
    }
}));

// Фронтовый драйвер тянет requests -> gitlab -> config.js -> clickstream, который к разбору
// источников не относится - глушим его, а не расковыриваем вендорный пакет настройками резолвера
jest.mock('@front/clickstream/clickstream', () => ({
    __esModule: true,
    enableClickstream: () => Promise.resolve(),
    getClickstreamState: () => 'disabled'
}));

import backDataset from '@back/helpers/datasets.mjs';
import frontDataset from '@front/helpers/datasets';
import jsonata from '@global/jsonata/driver.mjs';
import data from '../__mocks__/dataset/dataset.json';
import fixturesData from '../__fixtures__/dataset/dataset.json';

describe('dataset', () => {

  describe('front', () =>
    it('[parseSource]: Должен обработать без ошибок', async() =>
      await expect(
        frontDataset().parseSource(data.context, data.data, data.subject)
      ).resolves.toEqual(fixturesData)
    )
  );

  describe('back', () =>
    it('[parseSource]: Должен обработать без ошибок', async() => {
      // getDatasetDriver принимает сам storage с уже построенной обвязкой (storage.jsonata) -
      // без неё упадёт с "jsonataDriver.expression is not a function"
      const storage = {manifest: data.context, jsonata, hash: 'test-hash'};

      await expect(
        backDataset(storage).parseSource(data.context, data.data, data.subject)
      ).resolves.toEqual(fixturesData);
    })
  );
});
