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

import {afterEach, beforeAll, describe, expect, it, jest} from '@jest/globals';

const mockEnv = {drawioServerUri: undefined, drawioUrlParams: undefined};
jest.mock('@front/helpers/env', () => ({__esModule: true, default: mockEnv}));
jest.mock('@global/logger/v2/logger.mjs', () => ({
    getLoggerWithTag: () => ({warn: () => {}})
}));

let buildDrawioUrl;

beforeAll(async() => {
    global.window = {location: {origin: 'https://portal.example'}};
    ({buildDrawioUrl} = await import('@front/helpers/drawioUrl'));
});

afterEach(() => {
    mockEnv.drawioServerUri = undefined;
    mockEnv.drawioUrlParams = undefined;
});

const baseOf = (url) => url.split('?')[0];

describe('buildDrawioUrl', () => {
    it('без настройки использует embed.diagrams.net', () => {
        expect(baseOf(buildDrawioUrl())).toBe('https://embed.diagrams.net/');
    });

    it('использует адрес из окружения', () => {
        mockEnv.drawioServerUri = 'https://static.corp/drawio';
        expect(baseOf(buildDrawioUrl())).toBe('https://static.corp/drawio/');
    });

    it('относительный путь считает от адреса портала', () => {
        mockEnv.drawioServerUri = '/drawio/';
        expect(baseOf(buildDrawioUrl())).toBe('https://portal.example/drawio/');
    });

    it('добавляет глобальные параметры из окружения', () => {
        mockEnv.drawioUrlParams = 'lang=ru';
        const params = new URL(buildDrawioUrl()).searchParams;
        expect(params.get('lang')).toBe('ru');
        expect(params.get('embed')).toBe('1');
    });
});
