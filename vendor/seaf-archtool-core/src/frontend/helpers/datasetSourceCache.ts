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

// Кэш загружаемых источников datasets (файлы данных и вложенные манифесты) до следующей загрузки манифеста.
// Без него каждое обращение к dataset заново скачивает и разбирает файл, а для вложенного манифеста — все его файлы.
// Кэш привязан к моменту загрузки манифеста (state.moment): setManifest обновляет его при каждой загрузке,
// в том числе после изменения файла в IDE, когда манифест обновляется на месте и объект остается прежним.

interface DatasetSourceCache {
  moment: unknown;
  items: Map<string, Promise<unknown>>;
}

let cache: DatasetSourceCache = {
  moment: null,
  items: new Map()
};

// Тип источника входит в ключ: один и тот же .yaml может быть вложенным манифестом в одном dataset (type: manifest)
// и файлом данных в другом, а результаты у них разные
export function datasetSourceKey(type: string, baseURI: unknown, data: unknown): string {
  return JSON.stringify([type, baseURI, data]);
}

export function pullDatasetSource(moment: unknown, key: string, resolver: () => Promise<unknown>): Promise<unknown> {
  if (cache.moment !== moment) cache = { moment, items: new Map() };
  const cached = cache.items.get(key);
  if (cached) return cached;

  const promise = resolver().catch((error: unknown) => {
    // Ошибку не кэшируем: следующее обращение загрузит источник заново.
    // Если манифест уже перезагружен, в новом кэше этого promise нет и удалять нечего
    if (cache.items.get(key) === promise) cache.items.delete(key);
    throw error;
  });
  cache.items.set(key, promise);
  return promise;
}
