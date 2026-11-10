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

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
*/

import { describe, expect, it } from '@jest/globals';
import { executeSearchToolAction } from '@global/search/search-tool-run.mjs';
import { SEARCH_ALL_KEY } from '@global/search/constants.mjs';

const manifest = {
    entities: {
        systems: {
            title: 'Systems',
            schema: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    status: { type: 'string', enum: ['active', 'retired'] }
                }
            }
        }
    },
    datasets: {
        ds_systems: {}
    },
    search: {
        entities: [
            { id: 'systems', dataset: 'ds_systems' }
        ]
    }
};

const entityData = {
    s1: { title: 'Alpha System', description: 'First', status: 'active' },
    s2: { title: 'Beta System', description: 'Second', status: 'retired' }
};

function createProvider(dataByEntity = { systems: entityData }) {
    return {
        async getEntityDataMap(ids) {
            const map = {};
            for (const id of ids) {
                map[id] = dataByEntity[id] ?? {};
            }
            return map;
        }
    };
}

describe('executeSearchToolAction', () => {
    it('entities returns searchable entities list', async() => {
        const result = await executeSearchToolAction('entities', {}, {
            manifest,
            fullSchema: manifest,
            provider: createProvider()
        });
        expect(result.entities).toEqual([
            { key: '__all__', title: 'Все' },
            { key: 'systems', title: 'Systems', dataset: 'ds_systems' }
        ]);
    });

    it('filters returns filter fields for entity', async() => {
        const result = await executeSearchToolAction('filters', { choice: 'systems' }, {
            manifest,
            fullSchema: {
                properties: {
                    systems: manifest.entities.systems.schema
                }
            },
            provider: createProvider()
        });
        expect(Array.isArray(result)).toBe(true);
        expect(result.some(f => f.key === 'title')).toBe(true);
        expect(result.some(f => f.key === 'status')).toBe(true);
    });

    it('filters returns empty array for SEARCH_ALL_KEY', async() => {
        const result = await executeSearchToolAction('filters', { choice: SEARCH_ALL_KEY }, {
            manifest,
            fullSchema: manifest,
            provider: createProvider()
        });
        expect(result).toEqual([]);
    });

    it('filters throws when entity schema is missing', async() => {
        await expect(
            executeSearchToolAction('filters', { choice: 'missing' }, {
                manifest,
                fullSchema: manifest,
                provider: createProvider()
            })
        ).rejects.toThrow('Can\'t get schema for entity missing.');
    });

    it('run performs in-entity search', async() => {
        const result = await executeSearchToolAction(
            'run',
            { choice: 'systems', filters: [], searchQuery: 'Alpha' },
            {
                manifest,
                fullSchema: {
                    properties: {
                        systems: manifest.entities.systems.schema
                    }
                },
                provider: createProvider()
            }
        );
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Alpha System');
    });

    it('run throws for unknown entity', async() => {
        await expect(
            executeSearchToolAction(
                'run',
                { choice: 'nope', filters: [], searchQuery: '' },
                {
                    manifest,
                    fullSchema: manifest,
                    provider: createProvider()
                }
            )
        ).rejects.toThrow('Chosen entity nope is not found.');
    });

    it('throws for unknown action', async() => {
        await expect(
            executeSearchToolAction('nope', {}, {
                manifest,
                fullSchema: manifest,
                provider: createProvider()
            })
        ).rejects.toThrow('Unknown search action: nope');
    });
});
