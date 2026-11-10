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
      Zaznobin Saveliy <zaznobins@yandex.ru>

  Contributors:
      Zaznobin Saveliy <zaznobins@yandex.ru> - 2026
*/

import {buildBreadcrumbs, findBestMenuItem, menuRouteMatches} from '@front/components/ArchSwitcher/breadcrumbs';

const docRoute = {
  fullPath: '/entities/docs/blank?dh-doc-id=foo'
};

const docMenu = [
  {
    location: 'Документы/Раздел/Лист',
    route: '/entities/docs/blank?dh-doc-id=foo'
  }
];

describe('breadcrumbs', () => {
  test('совпавший пункт отдаёт сегменты location', () => {
    expect(buildBreadcrumbs({
      menu: docMenu,
      route: docRoute
    })).toEqual(['Документы', 'Раздел', 'Лист']);
  });

  test('страница не из меню даёт пустой след', () => {
    expect(buildBreadcrumbs({
      menu: [{location: 'Документы/Другой', route: '/entities/docs/blank?dh-doc-id=other'}],
      route: docRoute
    })).toEqual([]);

    expect(buildBreadcrumbs({
      menu: [],
      route: {fullPath: '/docs/legacy'}
    })).toEqual([]);
  });

  test('лишний параметр и другой порядок query всё равно находят пункт меню', () => {
    const menu = [{
      location: 'Документы/Раздел/Лист',
      route: '/entities/docs/blank?extra=1&dh-doc-id=foo'
    }];
    const route = {
      fullPath: '/entities/docs/blank?dh-doc-id=foo&extra=1&something=1'
    };

    expect(menuRouteMatches(menu[0].route, route)).toBe(true);
    expect(buildBreadcrumbs({menu, route})).toEqual(['Документы', 'Раздел', 'Лист']);
  });

  test('org-параметры не мешают совпадению', () => {
    const route = {
      fullPath: '/entities/docs/blank?_sfa-orgctx=acme&dh-doc-id=foo&_sfa-origin-orgctx=prev'
    };

    expect(menuRouteMatches('/entities/docs/blank?dh-doc-id=foo&_sfa-orgctx=stale', route)).toBe(true);
    expect(buildBreadcrumbs({
      menu: docMenu,
      route
    })).toEqual(['Документы', 'Раздел', 'Лист']);
  });

  test('пункт без query совпадает с тем же путём и любым query', () => {
    const route = {fullPath: '/entities/components/tree?x=1'};

    expect(menuRouteMatches('/entities/components/tree', route)).toBe(true);
    expect(buildBreadcrumbs({
      menu: [{location: 'Архитектура/Компоненты', route: '/entities/components/tree'}],
      route
    })).toEqual(['Архитектура', 'Компоненты']);

    expect(menuRouteMatches('/search', {fullPath: '/search?q=foo'})).toBe(true);
    expect(menuRouteMatches('http://example.test/docs', {fullPath: '/docs'})).toBe(false);
    expect(menuRouteMatches('//host/docs', {fullPath: '/docs'})).toBe(false);
  });

  test('нет совпадения — пустой след', () => {
    expect(buildBreadcrumbs({
      menu: docMenu,
      route: {fullPath: '/archChooser'}
    })).toEqual([]);
  });

  test('последний сегмент берётся из title пункта', () => {
    expect(buildBreadcrumbs({
      menu: [{location: 'devtool', route: '/devtool', title: 'JSONata'}],
      route: {fullPath: '/devtool'}
    })).toEqual(['JSONata']);

    expect(buildBreadcrumbs({
      menu: [{location: 'Документы/Раздел/Лист', route: '/entities/docs/blank?dh-doc-id=foo', title: 'Настоящее имя'}],
      route: docRoute
    })).toEqual(['Документы', 'Раздел', 'Настоящее имя']);

    expect(buildBreadcrumbs({
      menu: [{location: 'devtool', route: '/devtool', title: '   '}],
      route: {fullPath: '/devtool'}
    })).toEqual(['devtool']);
  });

  test('при равном числе параметров берётся первый в датасете', () => {
    expect(buildBreadcrumbs({
      menu: [
        {location: 'Документы/Первый', route: '/entities/docs/blank?dh-doc-id=foo'},
        {location: 'Документы/Второй', route: '/entities/docs/blank?dh-doc-id=foo'}
      ],
      route: docRoute
    })).toEqual(['Документы', 'Первый']);
  });

  test('пункт с большим числом query побеждает более общий, даже если тот раньше', () => {
    const route = {fullPath: '/entities/components/tree?dh-component-id=x'};
    const menu = [
      {location: 'Архитектура/Дерево', route: '/entities/components/tree'},
      {location: 'Архитектура/Карточка', route: '/entities/components/tree?dh-component-id=x'}
    ];

    expect(menuRouteMatches(menu[0].route, route)).toBe(true);
    expect(findBestMenuItem(menu, route)?.location).toBe('Архитектура/Карточка');
    expect(buildBreadcrumbs({menu, route})).toEqual(['Архитектура', 'Карточка']);
    expect(buildBreadcrumbs({menu: [menu[1], menu[0]], route})).toEqual(['Архитектура', 'Карточка']);
  });

  test('чужой id не перебивает общий пункт, org-параметр не увеличивает счёт', () => {
    const route = {fullPath: '/entities/components/tree?dh-component-id=other&_sfa-orgctx=acme'};

    expect(buildBreadcrumbs({
      menu: [
        {location: 'Архитектура/Дерево', route: '/entities/components/tree'},
        {location: 'Архитектура/Карточка', route: '/entities/components/tree?dh-component-id=x&_sfa-orgctx=stale'}
      ],
      route
    })).toEqual(['Архитектура', 'Дерево']);

    expect(buildBreadcrumbs({
      menu: [
        {location: 'Документы/С контекстом', route: '/entities/docs/blank?dh-doc-id=foo&_sfa-orgctx=acme'},
        {location: 'Документы/Без контекста', route: '/entities/docs/blank?dh-doc-id=foo'}
      ],
      route: docRoute
    })).toEqual(['Документы', 'С контекстом']);
  });
});
