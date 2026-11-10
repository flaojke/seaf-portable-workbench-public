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

import {beforeAll, describe, expect, it, jest} from '@jest/globals';

jest.mock('@global/logger/v2/logger.mjs', () => ({
  getLoggerWithTag: () => ({info: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined})
}));
jest.mock('@global/logger/v2/logger', () => ({
  getLoggerWithTag: () => ({info: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined})
}));
jest.mock('@ide/gateway', () => ({__esModule: true, default: {initIdeaGateway: () => undefined}}));

type CefRequest = { request: string, onSuccess: (r: string) => void, onFailure: (code: number, info: string) => void };

// Запросы к плагину; ответ на настройки откладывается, чтобы проверить порядок событий
const requests: CefRequest[] = [];
let papi: any;
let addCallbacks: (cb: { funcName: string, func: () => void }) => void;

beforeAll(async() => {
  (global as any).document = {location: {search: '?$dochub-api-interface-func=cefQueryTest'}};
  (global as any).alert = () => undefined;
  (global as any).window = {
    location: {protocol: 'jcef:'},
    cefQueryTest: (req: CefRequest) => requests.push(req)
  };
  process.env.VUE_APP_DOCHUB_IDE_IDEA_API = ['1'] as any;
  ({addPapiSettingUpdateCallbacks: addCallbacks} = await import('@ide/papiLifeCycle'));
  papi = (await import('@ide/idea/papi')).default;
});

const lastRequest = () => {
  const req = requests[requests.length - 1];
  return {req, body: JSON.parse(req.request)};
};

describe('IDEA PAPI: настройки и SmartAnts', () => {
  it('колбэки настроек срабатывают после прихода настроек, а не на заглушке', async() => {
    const fired: unknown[] = [];
    addCallbacks({funcName: 'test', func: () => fired.push((global as any).window.DocHubIDEACodeExt.settings.smartants)});
    // Пока плагин не ответил, действует заглушка без smartants
    expect((global as any).window.DocHubIDEACodeExt.settings.smartants).toBeUndefined();
    expect(fired).toEqual([]);

    const settings = requests.find((r) => JSON.parse(r.request).url === 'plugin:/idea/settings/get') as CefRequest;
    settings.onSuccess(JSON.stringify({api: '1', smartants: true}));
    await new Promise((r) => setTimeout(r, 0));
    expect(fired).toEqual([true]);
  });

  it('computeSmartAnts отправляет параметры в plugin:/idea/smartants и отдаёт ответ', async() => {
    const response = papi.computeSmartAnts({nodes: {a: {}}, availableWidth: 640});
    const {req, body} = lastRequest();
    expect(body.url).toBe('plugin:/idea/smartants');
    expect(JSON.parse(body.params)).toEqual({nodes: {a: {}}, availableWidth: 640});
    req.onSuccess(JSON.stringify({result: 'OK', queryID: 'q', graph: {layers: {}}}));
    await expect(response).resolves.toEqual({result: 'OK', queryID: 'q', graph: {layers: {}}});
  });

  it('отказ плагина приходит как {response: {status, data}}', async() => {
    const response = papi.computeSmartAnts({});
    lastRequest().req.onFailure(504, 'timeout');
    await expect(response).rejects.toEqual({response: {status: 504, data: 'timeout', headers: {}}});
  });
});
