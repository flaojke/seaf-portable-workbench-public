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

import {describe, expect, it, jest} from '@jest/globals';
import {
  createSmartantsCompute,
  pluginErrorOf,
  SmartantsComputeDeps,
  SmartantsResponse,
  SmartantsWorker
} from '@front/helpers/smartantsCompute';

const PARAMS = {nodes: {a: {}}, links: []};
const GRAPH = {layers: {}, tracks: []};

class FakeWorker implements SmartantsWorker {
  onmessage: ((message: { data: SmartantsResponse }) => void) | null = null;
  posted: any[] = [];
  postMessage(message: unknown) {
    this.posted.push(message);
  }
  reply(data: SmartantsResponse) {
    this.onmessage?.({data});
  }
}

const deps = (over: Partial<SmartantsComputeDeps> = {}): SmartantsComputeDeps => ({
  isPlugin: () => false,
  isSmartantsInPlugin: () => false,
  smartantsMode: () => 'front',
  computeInPlugin: jest.fn(async() => ({result: 'OK', graph: GRAPH})),
  computeInBackend: jest.fn(async() => ({graph: GRAPH})),
  worker: null,
  readCache: () => null,
  newQueryId: () => 'q1',
  ...over
});

describe('createSmartantsCompute: плагин', () => {
  it('плагин с поддержкой считает сам и получает ширину', async() => {
    const d = deps({isPlugin: () => true, isSmartantsInPlugin: () => true, smartantsMode: () => 'service'});
    await expect(createSmartantsCompute(d)(PARAMS, 800)).resolves.toBe(GRAPH);
    expect(d.computeInPlugin).toHaveBeenCalledWith({...PARAMS, availableWidth: 800});
    expect(d.computeInBackend).not.toHaveBeenCalled();
  });

  it('плагин без поддержки - «обновите плагин»', async() => {
    const d = deps({isPlugin: () => true});
    await expect(createSmartantsCompute(d)(PARAMS, 800)).rejects.toThrow('обновите плагин');
    expect(d.computeInPlugin).not.toHaveBeenCalled();
  });

  it('ответ ERROR отдаёт ошибку сервиса', async() => {
    const error = {name: 'LayoutError', message: 'cycle'};
    const d = deps({
      isPlugin: () => true,
      isSmartantsInPlugin: () => true,
      computeInPlugin: async() => ({result: 'ERROR', error})
    });
    await expect(createSmartantsCompute(d)(PARAMS, 800)).rejects.toBe(error);
  });

  it('отказ плагина превращается в Error с текстом', async() => {
    const d = deps({
      isPlugin: () => true,
      isSmartantsInPlugin: () => true,
      computeInPlugin: () => Promise.reject({response: {status: 504, data: 'timeout'}})
    });
    await expect(createSmartantsCompute(d)(PARAMS, 800)).rejects.toThrow('timeout');
  });
});

describe('pluginErrorOf', () => {
  it('Error не оборачивает', () => {
    const e = new Error('x');
    expect(pluginErrorOf(e)).toBe(e);
  });

  it('берёт message из объекта в data, а не [object Object]', () => {
    expect(pluginErrorOf({response: {data: {message: 'no jar'}}}).message).toBe('no jar');
  });

  it('строка', () => {
    expect(pluginErrorOf('boom').message).toBe('boom');
  });

  it('неизвестный отказ - общий текст', () => {
    expect(pluginErrorOf({response: {data: {code: 1}}}).message).toBe('SmartAnts plugin request failed');
  });
});

describe('createSmartantsCompute: backend', () => {
  it('режим не front - расчёт в backend', async() => {
    const d = deps({smartantsMode: () => 'service', worker: new FakeWorker()});
    await expect(createSmartantsCompute(d)(PARAMS, 700)).resolves.toBe(GRAPH);
    expect(d.computeInBackend).toHaveBeenCalledWith({...PARAMS, availableWidth: 700});
  });

  it('ошибка backend пробрасывается как есть', async() => {
    const err = Object.assign(new Error('503'), {response: {status: 503}});
    const d = deps({smartantsMode: () => 'thread', computeInBackend: () => Promise.reject(err)});
    await expect(createSmartantsCompute(d)(PARAMS, 700)).rejects.toBe(err);
  });
});

describe('createSmartantsCompute: воркер', () => {
  it('без воркера - ошибка сборки', async() => {
    await expect(createSmartantsCompute(deps())(PARAMS, 600)).rejects.toThrow('нет расчёта в браузере');
  });

  it('результат из кэша без обращения к воркеру', async() => {
    const worker = new FakeWorker();
    const compute = createSmartantsCompute(deps({worker, readCache: () => GRAPH}));
    await expect(compute(PARAMS, 600)).resolves.toBe(GRAPH);
    expect(worker.posted).toHaveLength(0);
  });

  it('отправляет запрос воркеру и принимает ответ OK', async() => {
    const worker = new FakeWorker();
    const result = createSmartantsCompute(deps({worker}))(PARAMS, 600);
    expect(worker.posted).toEqual([{queryID: 'q1', params: {...PARAMS, availableWidth: 600}}]);
    worker.reply({queryID: 'other', result: 'OK', graph: {}});
    worker.reply({queryID: 'q1', result: 'OK', graph: GRAPH});
    // Cached layouts are private snapshots: rendering must not mutate another view.
    await expect(result).resolves.toEqual(GRAPH);
  });

  it('ответ ERROR от воркера', async() => {
    const worker = new FakeWorker();
    const error = {name: 'Error', message: 'bad'};
    const result = createSmartantsCompute(deps({worker}))(PARAMS, 600);
    worker.reply({queryID: 'q1', result: 'ERROR', error});
    await expect(result).rejects.toBe(error);
  });
});
