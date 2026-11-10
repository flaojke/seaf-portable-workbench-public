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

// Выбор способа расчёта схемы SmartAnts и разбор ответа.
// Зависимости внедряются: компонент передаёт env, запросы и воркер, тесты - заглушки

// Ответ сервиса и воркера: {result, queryID, graph|error}
export interface SmartantsResponse {
  result?: string;
  queryID?: string;
  graph?: unknown;
  error?: unknown;
}

export interface SmartantsWorker {
  postMessage(message: unknown): void;
  onmessage: ((message: { data: SmartantsResponse }) => void) | null;
}

export type SmartantsParams = Record<string, unknown>;

export interface SmartantsComputeDeps {
  isPlugin(): boolean;
  isSmartantsInPlugin(): boolean;
  smartantsMode(): string;
  // Расчёт в плагине ($PAPI.computeSmartAnts)
  computeInPlugin(params: SmartantsParams): Promise<SmartantsResponse>;
  // Расчёт в backend; отдаёт тело ответа
  computeInBackend(params: SmartantsParams): Promise<{ graph?: unknown }>;
  // Воркер с легаси-библиотекой smartants.js; в сборке для плагинов его нет
  worker: SmartantsWorker | null;
  // Готовый результат из кэша браузера
  readCache(params: SmartantsParams): unknown;
  newQueryId(): string;
}

// Отказ плагина: {response: {data, status}}, data - обычно строка
export function pluginErrorOf(err: unknown): Error {
  if (err instanceof Error) return err;
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  const text = (typeof data === 'string' && data)
    || (typeof (data as { message?: unknown })?.message === 'string' && (data as { message: string }).message)
    || (typeof err === 'string' && err);
  return new Error(text || 'SmartAnts plugin request failed');
}

export function createSmartantsCompute(deps: SmartantsComputeDeps) {
  // The renderer mutates presentation objects (selection/opacity). Keep snapshots.
  const cache = new Map<string, {snapshot: string; bytes: number}>();
  const pending = new Map<string, Promise<unknown>>();
  let cacheBytes = 0;
  const maxBytes = 8 * 1024 * 1024;
  // Слушатели ответов воркера
  const listeners: Record<string, (message: SmartantsResponse) => void> = {};
  if (deps.worker) {
    deps.worker.onmessage = (message) => {
      const queryID = message.data?.queryID;
      queryID && listeners[queryID]?.(message.data);
    };
  }

  return (params: SmartantsParams, availableWidth: number): Promise<unknown> => {
    if (deps.isPlugin()) {
      // В плагинах схемы считает только плагин (JetBrains - в процессе IDE, VS Code - JVM-сервисом);
      // расчёта в браузере в плагинах нет
      if (!deps.isSmartantsInPlugin()) {
        return Promise.reject(new Error('Плагин не поддерживает расчёт схем SmartAnts, обновите плагин'));
      }
      return deps.computeInPlugin({ ...params, availableWidth })
        .catch((err) => Promise.reject(pluginErrorOf(err)))
        .then((response) => response?.result === 'OK' ? response.graph : Promise.reject(response?.error));
    }
    if (deps.smartantsMode() !== 'front') {
      return deps.computeInBackend({ ...params, availableWidth }).then((data) => data.graph);
    }
    const worker = deps.worker;
    if (!worker) {
      return Promise.reject(new Error('SmartAnts: в этой сборке нет расчёта в браузере (smartants.js)'));
    }
    // Full input + viewport form the versioned layout key; changed model data misses.
    const key = JSON.stringify({...params, availableWidth});
    const entry = cache.get(key);
    if (entry) {
      cache.delete(key);
      cache.set(key, entry);
      return Promise.resolve(JSON.parse(entry.snapshot));
    }
    if (pending.has(key)) return pending.get(key).then(graph => JSON.parse(JSON.stringify(graph)));
    const cached = deps.readCache({...params, availableWidth});
    if (cached) return Promise.resolve(cached);
    // Keep layouts in bounded memory; localStorage is not used.
    const result = new Promise((success, reject) => {
      const queryID = deps.newQueryId();
      listeners[queryID] = (message) => {
        delete listeners[queryID];
        message.result === 'OK' ? success(message.graph) : reject(message.error);
      };
      worker.postMessage({
        queryID,
        params: JSON.parse(JSON.stringify({ ...params, availableWidth }))
      });
    }).then(graph => {
      const snapshot = JSON.stringify(graph);
      const bytes = 2 * (key.length + snapshot.length);
      if (bytes <= maxBytes) {
        cache.set(key, {snapshot, bytes});
        cacheBytes += bytes;
        while (cacheBytes > maxBytes || cache.size > 32) {
          const oldest = cache.keys().next().value;
          cacheBytes -= cache.get(oldest).bytes;
          cache.delete(oldest);
        }
      }
      return graph;
    }).finally(() => pending.delete(key));
    pending.set(key, result);
    return result.then(graph => JSON.parse(JSON.stringify(graph)));
  };
}
