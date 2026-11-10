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
import validator from '@global/rules/validators.mjs';
import datasetDriver from '@global/datasets/driver.mjs';
import jsonata from '@global/jsonata/driver.mjs';
import pathTool from '@global/manifest/tools/path.mjs';
import manifest from '../__mocks__/manifest.json';

/**
 * Драйвер датасетов сам по себе - заготовка: jsonataDriver и pathResolver в нём заглушки, которые
 * бросают исключение. В приложении их подставляют backend/helpers/datasets.mjs и frontend-аналог,
 * здесь собираем тот же минимум - без этого все jsonata-валидаторы падают с "jsonataDriver is not
 * implemented in the dataset module"
 */
const datasets = Object.assign({}, datasetDriver, {
  pathResolver: (path) => ({context: manifest, subject: pathTool.get(manifest, path), baseURI: '/'}),
  jsonataDriver: {...jsonata, getDatasetDriver: () => datasets}
});
datasets.parentParseSource = datasetDriver.parseSource.bind(datasets);

async function runValidators() {
  const problems = [];
  const push = (result) => problems.push(result);
  const context = validator(datasets, manifest, push, push);
  await new Promise((resolve) => context.events.on('stackEmpty', resolve));
  return problems;
}

describe('rules', () => {
  it('отрабатывают все валидаторы манифеста', async() => {
    const problems = await runValidators();

    expect(problems.map((p) => p.id).sort())
      .toEqual(Object.keys(manifest.rules.validators).sort());
  });

  it('ни один валидатор не падает', async() => {
    const problems = await runValidators();

    // Упавший валидатор виден по полю error и подставному item "Критическая ошибка валидатора!".
    // Это и есть главная защита: именно так проявляется потеря глобального jsonata-драйвера
    const crashed = problems.filter((p) => p.error);
    expect(crashed.map((p) => `${p.id}: ${p.error}`)).toEqual([]);
  });

  it('находит заготовленные в моке проблемы', async() => {
    const problems = await runValidators();

    // В демо-манифесте намеренно есть нарушения; сверяем, кто их нашёл, а не полный дамп находок -
    // их состав завязан на содержимое мока и ломался бы от любой его правки
    const withFindings = problems.filter((p) => p.items.length).map((p) => p.id).sort();
    expect(withFindings).toEqual([
      'dochub.fields.experts',
      'dochub.fields.source',
      'dochub.metamodel.aspects.no_define_parent',
      'dochub.metamodel.contexts.outof'
    ]);
  });

  it('исключения из манифеста доезжают до найденных проблем', async() => {
    const problems = await runValidators();

    const outOfContext = problems.find((p) => p.id === 'dochub.metamodel.contexts.outof');
    expect(outOfContext.items.some((item) => item.exception)).toBe(true);
  });
});

describe('манифест без валидаторов', () => {
    // На пустом стеке pop() отдаёт undefined: обращение к validators[undefined].title уронило бы
    // воркер загрузки манифеста уже после записи содержимого в кеш
    const makeDatasets = () => ({getData: jest.fn(() => Promise.resolve([]))});

    it.each([
        ['нет секции rules', {}],
        ['rules без validators', {rules: {}}],
        ['validators пуст', {rules: {validators: {}}}]
    ])('%s: не падает и не зовёт датасеты', (_name, manifestWithoutValidators) => {
        const datasets = makeDatasets();
        const reject = jest.fn();

        const context = validator(datasets, manifestWithoutValidators, jest.fn(), reject);

        expect(context.stack).toEqual([]);
        expect(datasets.getData).not.toHaveBeenCalled();
        expect(reject).not.toHaveBeenCalled();
    });

    it('вызывающий не зависает: stackEmpty приходит и без единого валидатора', async() => {
        const context = validator(makeDatasets(), {}, jest.fn(), jest.fn());

        await new Promise((resolve) => context.events.on('stackEmpty', resolve));
    });

    it('stop() завершает серию, а не подвешивает ожидающего', async() => {
        const manifestWithValidators = {rules: {validators: {v1: {}, v2: {}}}};
        const context = validator(makeDatasets(), manifestWithValidators, jest.fn(), jest.fn());
        context.stop();

        await new Promise((resolve) => context.events.on('stackEmpty', resolve));
    });

    it('манифест с валидатором по-прежнему их выполняет', async() => {
        const datasets = makeDatasets();
        const success = jest.fn();
        const manifestWithValidator = {rules: {validators: {v1: {title: 'V1', source: 'x'}}}};

        const context = validator(datasets, manifestWithValidator, success, jest.fn());

        expect(context.stack).toEqual([]);
        await new Promise((resolve) => setTimeout(resolve, 0));
        expect(datasets.getData).toHaveBeenCalledTimes(1);
        expect(success).toHaveBeenCalledWith(expect.objectContaining({id: 'v1', title: 'V1'}));
    });
});
