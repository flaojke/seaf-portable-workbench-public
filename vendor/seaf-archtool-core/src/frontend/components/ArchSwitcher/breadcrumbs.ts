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

const IGNORED_QUERY = new Set(['_sfa-orgctx', '_sfa-origin-orgctx']);
const HAS_SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const BASE = 'http://local';
const BASE_HOST = new URL(BASE).host;

export interface CrumbRoute {
  fullPath?: string;
}

export interface MenuCrumb {
  location?: string;
  route?: string;
  title?: string;
}

export interface BuildBreadcrumbsArgs {
  menu?: readonly MenuCrumb[] | null;
  route?: CrumbRoute | null;
}

function samePath(left: string, right: string): boolean {
  try {
    return decodeURI(left) === decodeURI(right);
  } catch {
    return left === right;
  }
}

function relevantKeys(params: URLSearchParams): string[] {
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const key of params.keys()) {
    if (IGNORED_QUERY.has(key) || seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

function matchParamCount(menuRoute: unknown, route: CrumbRoute | null | undefined): number | null {
  if (!menuRoute || typeof menuRoute !== 'string') return null;
  if (!route?.fullPath || typeof route.fullPath !== 'string') return null;
  if (HAS_SCHEME.test(menuRoute)) return null;

  let menuUrl: URL;
  let currentUrl: URL;
  try {
    menuUrl = new URL(menuRoute, BASE);
    currentUrl = new URL(route.fullPath, BASE);
  } catch {
    return null;
  }

  // //host/docs не имеет схемы, но это чужой хост. Сравнение одних pathname приняло бы его за /docs.
  if (menuUrl.host !== BASE_HOST) return null;
  if (!samePath(menuUrl.pathname, currentUrl.pathname)) return null;

  const keys = relevantKeys(menuUrl.searchParams);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const expected = menuUrl.searchParams.getAll(key);
    const actual = currentUrl.searchParams.getAll(key);
    if (expected.length !== actual.length) return null;
    for (let j = 0; j < expected.length; j++) {
      if (expected[j] !== actual[j]) return null;
    }
  }
  return keys.length;
}

export function menuRouteMatches(menuRoute: unknown, route: CrumbRoute | null | undefined): boolean {
  return matchParamCount(menuRoute, route) !== null;
}

// Самый конкретный пункт: больше совпавших query-параметров побеждает более общий.
// При равенстве остаётся тот, что раньше в датасете. Пункты без location не кандидаты.
export function findBestMenuItem(menu: readonly MenuCrumb[] | null | undefined, route: CrumbRoute | null | undefined): MenuCrumb | null {
  if (!Array.isArray(menu) || !route) return null;
  let best: MenuCrumb | null = null;
  let bestCount = -1;
  for (let i = 0; i < menu.length; i++) {
    const item = menu[i];
    if (!item?.location) continue;
    const count = matchParamCount(item.route, route);
    if (count === null || count <= bestCount) continue;
    best = item;
    bestCount = count;
  }
  return best;
}

export function buildBreadcrumbs({ menu, route }: BuildBreadcrumbsArgs = {}): string[] {
  if (!route) return [];
  const item = findBestMenuItem(menu, route);
  if (!item?.location) return [];

  const segments = String(item.location).split('/').filter(Boolean);
  if (!segments.length) return [];
  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (title) segments[segments.length - 1] = title;
  return segments;
}
