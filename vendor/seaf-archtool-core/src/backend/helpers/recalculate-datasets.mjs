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
      Vladislav Markin <markinvy@yandex.ru>, Sber

  Contributors:
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2024
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import generateDatasetErrorDesc from '@global/helpers/generate-dataset-error-desc.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import { v4 as uuidv4 } from 'uuid';

const LOG_TAG = 'datasets-calculate';
const logger = getLoggerWithTag(LOG_TAG);

function datasetOriginsAsArray(datasetDefinition) {
    const origin = datasetDefinition.origin;
    if (typeof origin === 'object') {
        return Object.values(origin);
    } else {
        return [origin];
    }
}

export default async function recalculateDatasetsBackend(manifest, driver, processedDatasets) {
    logger.debug(() => 'Datasets warm up started');
    const problems = {
        id: 'dataset--problems',
        title: 'Datasets',
        items: []
    };
    const registeredProblems = new Set();
    let recalculateCounter = 0;
    const datasetsWithError = {};

    function registerProblem(datasetKey, description) {
        registeredProblems.add(datasetKey);
        problems.items.push({
            uid: datasetKey,
            description: description
        });
    }

    async function calcDataset(key) {
        recalculateCounter++;
        return await driver.getData(manifest, { origin: key, source: '($)' }, undefined, undefined, datasetsWithError)
            .catch((err) => {
                if(!datasetsWithError[key]) {
                    datasetsWithError[key] = {error: err};
                }
                if (!registeredProblems.has(key)) {
                    registerProblem(key, generateDatasetErrorDesc(key, err, datasetsWithError, manifest));
                }
                logger.error(() => `Dataset ${key} warm up failed`, err);
            });
    }
    
    async function handleDataset(processedDatasets, key) {
        if (processedDatasets[key]) {
            return;
        }
        await calcDataset(key);
        processedDatasets[key] = true;
    }
    for (const key of Object.keys(manifest.datasets)) {
        logger.debug(() => `Processing dataset ${key}`);

        const datasetDefinition = manifest.datasets[key];
        const datasetOrigins = datasetOriginsAsArray(datasetDefinition);
        const originsWithError = [];
        for (const origin of datasetOrigins) {
            if (registeredProblems.has(origin)) {
                originsWithError.push(origin);
            }
        }
        if (originsWithError.length !== 0) {
            if(!datasetsWithError[key]) {
                datasetsWithError[key] = {error: {message: 'Ошибки в датасетах, указанных в origin'}};
            }
            registerProblem(key, generateDatasetErrorDesc(key, 'Ошибки в датасетах, указанных в origin', datasetsWithError, manifest));
            continue;
        }
        try {
            await handleDataset(processedDatasets, key);
        } catch (err) {
            let customMessage = '';
            if (err.name === 'RangeError') {
                customMessage = 'The calculated dataset result is too large to process (RangeError)';
            }
            const errorUuid = uuidv4();
            logger.error(() => `${errorUuid}: Failed handleDataset of dataset: ${key}. ${customMessage}`, err);
            registerProblem(key, `Датасет ${key} не удалось рассчитать из-за ошибки. uuid = ${errorUuid}`);
        }
    }

    logger.debug(() => `Пересчитано ${recalculateCounter} датасетов из ${Object.keys(manifest.datasets).length}.`);

    return problems;
}
