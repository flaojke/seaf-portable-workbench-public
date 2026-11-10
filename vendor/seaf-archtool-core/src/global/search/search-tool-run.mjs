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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
*/

import { SEARCH_ALL_KEY } from './constants.mjs';
import {
    getFiltersForEntity,
    getSearchEntitiesList,
    performInEntitySearch,
    performSearchAll
} from './search-perform.mjs';
import { collectRelFields, parseRelTarget } from './search-utils.mjs';

function collectRelEntityIds(fullSchema, choice, manifest) {
    return collectRelFields(fullSchema, choice, manifest)
        .map(rel => parseRelTarget(rel.relTarget)?.entityId)
        .filter(Boolean);
}

/**
 * Executes a datalake search tool action using shared search helpers.
 * Typical order of calls:
 *   1. action=entities — get the list of available entities.
 *   2. action=filters — get the filters for the selected entity (choice).
 *   3. action=run — perform a search with filters and/or text query.
 *
 * @param {'entities'|'filters'|'run'} action
 * @param {{ choice?: string, filters?: Array, searchQuery?: string }} params
 * @param {{
*   manifest: object,
*   fullSchema: object,
*   provider: { getEntityDataMap: (ids: string[]) => Promise<object> }
* }} context
* @returns {Promise<unknown>}
*/
export async function executeSearchToolAction(action, params, { manifest, fullSchema, provider }) {
    if (action === 'entities') {
        return getSearchEntitiesList(manifest);
    }

    if (action === 'filters') {
        const choice = params.choice;
        if (choice === SEARCH_ALL_KEY) {
            return [];
        }
        const chosenEntitySchema =
            fullSchema?.properties?.[choice] ?? manifest.entities?.[choice]?.schema;
        if (!chosenEntitySchema) {
            throw new Error(`Can't get schema for entity ${choice}.`);
        }
        return getFiltersForEntity(manifest, choice, fullSchema, chosenEntitySchema);
    }

    if (action === 'run') {
        const choice = params.choice;
        const filters = Array.isArray(params.filters) ? params.filters : [];
        const queryWords = (params.searchQuery || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(w => w.trim());

        if (choice === SEARCH_ALL_KEY) {
            const searchableIds = getSearchEntitiesList(manifest).entities
                .map(e => e.key)
                .filter(k => k !== SEARCH_ALL_KEY);
            const entityDataMap = await provider.getEntityDataMap(searchableIds);
            return performSearchAll(manifest, queryWords, entityDataMap);
        }

        const entityDef = manifest.entities?.[choice];
        if (!entityDef) {
            throw new Error(`Chosen entity ${choice} is not found.`);
        }
        const chosenEntitySchema =
            fullSchema?.properties?.[choice] ?? entityDef?.schema;
        if (!chosenEntitySchema) {
            throw new Error(`Can't get schema for entity ${choice}.`);
        }

        const relEntityIds = collectRelEntityIds(fullSchema, choice, manifest);
        const entityDataMap = await provider.getEntityDataMap([choice, ...relEntityIds]);
        return performInEntitySearch(
            manifest,
            fullSchema,
            chosenEntitySchema,
            choice,
            filters,
            queryWords,
            entityDataMap[choice],
            entityDataMap
        );
    }

    throw new Error(`Unknown search action: ${action}`);
}
