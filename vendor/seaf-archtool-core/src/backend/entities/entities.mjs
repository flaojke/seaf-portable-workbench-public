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
*/

import {BaseEntities} from '@global/entities/entities.mjs';
import queries from '../../global/jsonata/queries.mjs';
import yaml from 'yaml';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import path from 'path';
import fs from 'fs';
import {fileURLToPath} from 'url';

const logger = getLoggerWithTag('b/e/entities');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadFromAssets(filename) {
    const source = path.resolve(__dirname, '../../assets/' + filename);

    logger.info(() => `Import base metamodel from  [${source}].`);
    return fs.readFileSync(source, {encoding: 'utf8', flag: 'r'});
}

class BackendEntities extends BaseEntities {
    #jsonata = null;

    constructor(jsonataDriver) {
        super();
        this.#jsonata = jsonataDriver;
    }

    // Подключает мастер-схему для подсказок и валидации метамодели
    getMasterSchema() {
        return yaml.parse(loadFromAssets('master-schema.yaml'));
    }

    async queryEntitiesJSONSchema(manifest) {
        const query = queries.makeQuery(queries.QUERIES[queries.IDS.JSONSCHEMA_ENTITIES]);
        let result = null;
        try {
            result = await this.#jsonata
                .expression(query)
                .evaluate(manifest);
        } catch (e) {
            logger.error(() => 'Ошибка выполнения JSONata выражения', e);
            throw e;
        }
        return result;
    }
}

// Регистрирует кастомные сущности
export default function(jsonataDriver, manifest, schema) {
    const entities = new BackendEntities(jsonataDriver);
    entities.setManifest(manifest);
    if (schema) {
        entities.updateSchema(schema);
    } else {
        void entities.reloadSchema();
    }
    return entities;
}
