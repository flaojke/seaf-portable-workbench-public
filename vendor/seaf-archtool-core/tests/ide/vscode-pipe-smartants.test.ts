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
import compress from '@global/compress/compress.mjs';

jest.mock('@front/helpers/plantuml', () => ({__esModule: true, default: {}}));
jest.mock('@front/helpers/html', () => ({prepareHTMLForPrint: () => ''}));
jest.mock('@ide/gateway', () => ({__esModule: true, default: {initVsCodeGateway: () => undefined}}));
jest.mock('@ide/papiLifeCycle', () => ({papiSettingUpdated: () => undefined}));

const posted: { command: string, content: any }[] = [];

// Сжатие параметров асинхронное: ждём, пока команда уйдёт в расширение
const waitPosted = async(count: number) => {
  for (let i = 0; i < 100 && posted.filter((m) => m.command === 'smartants').length < count; i++) {
    await new Promise((r) => setTimeout(r, 10));
  }
  return posted.filter((m) => m.command === 'smartants').pop() as { command: string, content: any };
};
let listeners: Record<string, any>;

beforeAll(async() => {
  (global as any).vscode = {postMessage: (message: { command: string, content: any }) => posted.push(message)};
  (global as any).window = {DochubVsCodeExt: {settings: {smartants: true}}};
  const pipe = await import('@ide/vscode/pipe');
  listeners = pipe.listeners;
  pipe.default();
});

describe('VS Code PAPI: computeSmartAnts', () => {
  it('отправляет команду smartants с сжатыми параметрами и отдаёт data ответа', async() => {
    const params = {nodes: {a: {}}, availableWidth: 640};
    const response = (global as any).window.$PAPI.computeSmartAnts(params);
    const message = await waitPosted(1);
    expect(message.content.uuid).toEqual(expect.any(String));
    const decoded = JSON.parse(await compress().decodeBase64(message.content.query));
    expect(decoded).toEqual(params);

    listeners[message.content.uuid].res({data: {result: 'OK', graph: {layers: {}}}});
    await expect(response).resolves.toEqual({result: 'OK', graph: {layers: {}}});
  });

  it('ошибка расширения пробрасывается', async() => {
    const response = (global as any).window.$PAPI.computeSmartAnts({});
    const message = await waitPosted(2);
    listeners[message.content.uuid].rej({response: {status: 500, data: 'no jar'}});
    await expect(response).rejects.toEqual({response: {status: 500, data: 'no jar'}});
  });
});
