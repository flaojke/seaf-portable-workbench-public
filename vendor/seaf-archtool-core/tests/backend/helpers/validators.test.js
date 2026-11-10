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
      Alexander Romashin <alexander.romashin@gmail.com>, Sber

  Contributors:
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {beforeEach, describe, expect, jest, test} from '@jest/globals';

// Проверяем связку backend-обёртки с настоящим global/rules/validators.mjs: гонка завершения
// возможна именно на их стыке. Мокаем только источник данных
const mockGetData = jest.fn();
jest.mock('@back/helpers/datasets.mjs', () => ({
    __esModule: true,
    default: () => ({getData: mockGetData})
}));

jest.mock('@back/utils/roles.mjs', () => ({
    __esModule: true,
    isRolesMode: () => false,
    DEFAULT_ROLE: 'default'
}));

const validators = require('@back/helpers/validators.mjs').default;

/** Данные приходят на следующем макротике - так гонка завершения становится наблюдаемой */
function resolveLater(items) {
    return new Promise((resolve) => setTimeout(() => resolve(items), 0));
}

describe('backend validators: ожидание завершения серии', () => {
    beforeEach(() => {
        mockGetData.mockReset();
    });

    test('единственный валидатор: результаты на месте к моменту возврата', async() => {
        mockGetData.mockImplementation(() => resolveLater([{uid: 'p1'}]));
        const storage = {manifest: {rules: {validators: {v1: {title: 'V1'}}}}};

        await validators(storage);

        // Стек пустеет в момент запуска последнего валидатора: наивная проверка "стек пуст" вернула бы
        // управление раньше, чем он успеет сложить найденное в problems
        expect(storage.problems).toHaveLength(1);
        expect(storage.problems[0]).toEqual(expect.objectContaining({id: 'v1', title: 'V1'}));
    });

    test('несколько валидаторов: дожидаемся всех', async() => {
        mockGetData.mockImplementation(() => resolveLater([{uid: 'p'}]));
        const storage = {manifest: {rules: {validators: {v1: {}, v2: {}, v3: {}}}}};

        await validators(storage);

        expect(storage.problems).toHaveLength(3);
        expect(mockGetData).toHaveBeenCalledTimes(3);
    });

    test('манифест без валидаторов: не виснет и не зовёт датасеты', async() => {
        const storage = {manifest: {}};

        await validators(storage);

        expect(storage.problems).toEqual([]);
        expect(mockGetData).not.toHaveBeenCalled();
    });

    test('упавший валидатор не обрывает серию и попадает в problems', async() => {
        mockGetData
            .mockImplementationOnce(() => Promise.reject(new Error('boom')))
            .mockImplementation(() => resolveLater([]));
        const storage = {manifest: {rules: {validators: {v1: {}, v2: {}}}}};

        await validators(storage);

        expect(mockGetData).toHaveBeenCalledTimes(2);
        expect(storage.problems).toHaveLength(2);
    });
});
