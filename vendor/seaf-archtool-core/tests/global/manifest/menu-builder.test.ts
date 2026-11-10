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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber

  Contributors:
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
*/

import jsonata from 'jsonata';
import { buildUserMenu } from '@global/manifest/services/menu-builder.mjs';

// Пункт меню, который возвращает сборщик
interface MenuItem {
  route?: string;
  location?: string;
  icon?: string;
  order?: number;
  service?: boolean;
}

// Драйвер JSONata: сборщику нужен только expression(query).evaluate(manifest)
interface JsonataDriver {
  expression: (query: string) => { evaluate: (data?: unknown) => Promise<unknown> };
}

// Драйвер-заглушка: запрос меню сущности возвращает заранее заданные пункты
const driverReturning = (items: unknown): JsonataDriver => ({
  expression: () => ({ evaluate: async() => items })
});

const build = (manifest: unknown, driver: JsonataDriver): Promise<MenuItem[]> => buildUserMenu(manifest, driver);

describe('buildUserMenu: служебные пункты', () => {
  test('Поиск, Проблемы и JSONata помечены флагом service', async() => {
    const menu = await build({ entities: {} }, driverReturning(null));

    expect(menu.map((item) => item.route)).toEqual(['/search', '/problems', '/devtool']);
    expect(menu.every((item) => item.service === true)).toBe(true);
  });

  test('метамодель не может сделать пункт служебным: сборщик берет только route, location, icon, order', async() => {
    const manifest = {
      entities: {
        docs: { menu: '[{"link": "/search", "location": "Поиск", "service": true}, {"link": "entities/docs/blank", "location": "Документы/Пример"}]' }
      }
    };
    const menu = await build(manifest, { expression: (query) => jsonata(query) });

    const fromMetamodel = menu.filter((item) => !item.service);
    expect(fromMetamodel.map((item) => item.location)).toEqual(['Документы/Пример', 'Поиск']);
    expect(menu.filter((item) => item.service)).toHaveLength(3);
  });
});
