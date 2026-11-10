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

type DatasetSourceCacheModule = typeof import('@front/helpers/datasetSourceCache');

// Моменты загрузки манифеста (state.moment)
const MOMENT_A = 1761120000000;
const MOMENT_B = 1761120005000;
const KEY = '["bitbucket:P:repo:main@root.yaml","KA/root.yaml"]';

let pullDatasetSource: DatasetSourceCacheModule['pullDatasetSource'];
let datasetSourceKey: DatasetSourceCacheModule['datasetSourceKey'];

beforeEach(async() => {
  jest.resetModules();
  ({pullDatasetSource, datasetSourceKey} = await import('@front/helpers/datasetSourceCache'));
});

describe('datasetSourceCache', () => {
  test('источник загружается один раз за загрузку манифеста, в том числе при параллельных обращениях', async() => {
    const submanifest = {entities: {}};
    const resolver = jest.fn().mockResolvedValue(submanifest);

    const [first, second] = await Promise.all([
      pullDatasetSource(MOMENT_A, KEY, resolver),
      pullDatasetSource(MOMENT_A, KEY, resolver)
    ]);
    const third = await pullDatasetSource(MOMENT_A, KEY, resolver);

    expect(resolver).toHaveBeenCalledTimes(1);
    expect(first).toBe(submanifest);
    expect(second).toBe(submanifest);
    expect(third).toBe(submanifest);
  });

  test('разные источники кэшируются по своим ключам', async() => {
    const resolver = jest.fn((value: string) => Promise.resolve({value}));

    const a = await pullDatasetSource(MOMENT_A, 'a', () => resolver('a'));
    const b = await pullDatasetSource(MOMENT_A, 'b', () => resolver('b'));

    expect(resolver).toHaveBeenCalledTimes(2);
    expect(a).toEqual({value: 'a'});
    expect(b).toEqual({value: 'b'});
  });

  test('новая загрузка манифеста сбрасывает кэш', async() => {
    const resolver = jest.fn()
      .mockResolvedValueOnce({version: 1})
      .mockResolvedValueOnce({version: 2});

    await pullDatasetSource(MOMENT_A, KEY, resolver);
    const result = await pullDatasetSource(MOMENT_B, KEY, resolver);

    expect(resolver).toHaveBeenCalledTimes(2);
    expect(result).toEqual({version: 2});
  });

  test('ошибка не кэшируется: следующее обращение загружает источник заново', async() => {
    const resolver = jest.fn()
      .mockRejectedValueOnce('Ошибка загрузки')
      .mockResolvedValueOnce({entities: {}});

    await expect(pullDatasetSource(MOMENT_A, KEY, resolver)).rejects.toBe('Ошибка загрузки');
    await expect(pullDatasetSource(MOMENT_A, KEY, resolver)).resolves.toEqual({entities: {}});
    expect(resolver).toHaveBeenCalledTimes(2);
  });

  test('ошибка запроса прежней загрузки не удаляет запись новой', async() => {
    let rejectOld: (error: unknown) => void = () => undefined;
    const oldResolver = jest.fn(() => new Promise((_, reject) => { rejectOld = reject; }));
    const newResolver = jest.fn().mockResolvedValue({version: 2});

    const old = pullDatasetSource(MOMENT_A, KEY, oldResolver);
    await pullDatasetSource(MOMENT_B, KEY, newResolver);
    rejectOld('Ошибка загрузки');
    await expect(old).rejects.toBe('Ошибка загрузки');

    await pullDatasetSource(MOMENT_B, KEY, newResolver);
    expect(newResolver).toHaveBeenCalledTimes(1);
  });

  test('один и тот же файл как вложенный манифест и как файл данных кэшируется раздельно', async() => {
    const BASE = 'bitbucket:P:repo:main@datasets/root.yaml';
    const manifestKey = datasetSourceKey('data-manifest', BASE, 'KA/root.yaml');
    const fileKey = datasetSourceKey('data-file', BASE, 'KA/root.yaml');
    const manifestResolver = jest.fn().mockResolvedValue({entities: {}});
    const fileResolver = jest.fn().mockResolvedValue({imports: ['business.yaml']});

    expect(manifestKey).not.toBe(fileKey);
    expect(datasetSourceKey('data-file', BASE, 'KA/root.yaml')).toBe(fileKey);
    await expect(pullDatasetSource(MOMENT_A, manifestKey, manifestResolver)).resolves.toEqual({entities: {}});
    await expect(pullDatasetSource(MOMENT_A, fileKey, fileResolver)).resolves.toEqual({imports: ['business.yaml']});
    expect(manifestResolver).toHaveBeenCalledTimes(1);
    expect(fileResolver).toHaveBeenCalledTimes(1);
  });
});
