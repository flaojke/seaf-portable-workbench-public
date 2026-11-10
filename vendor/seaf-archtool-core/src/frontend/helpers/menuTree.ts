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

// Логика главного меню (Layouts/Menu.vue): слова поиска, значки пунктов, путь к текущей странице.
// Подсветка совпадений — общая, в highlightMatches.ts.

// Слова запроса поиска по меню; запрос уже приведен к нижнему регистру
export const menuFilterTerms = (query: string | null | undefined): string[] =>
  query ? query.split(' ').filter(Boolean) : [];

// Метамодели задают значки в двух форматах: MDI (mdi-*) и Material Icons (description,
// location_searching). Второй Vuetify понимает только с префиксом набора md:.
// Значок с явным набором (md:..., mdi:...) не меняется.
export const menuIconName = (icon: string): string =>
  (icon.startsWith('mdi-') || icon.includes(':')) ? icon : `md:${icon}`;

// Пункт лежит на пути к текущей странице: он предок выбранного пункта (сам выбранный — нет)
export const isOnMenuTrail = (location: string, selectedLocation: string | null | undefined): boolean =>
  !!selectedLocation && selectedLocation.startsWith(`${location}/`);

// Пункт меню из сборщика (menu-builder.mjs): пункты метамодели и служебные пункты ядра (service)
export interface MenuDatasetItem {
  title?: string;
  route?: string;
  icon?: string;
  location?: string;
  service?: boolean;
}

// Узел дерева метамодели; ключ узла — сегмент location
export interface MenuNode {
  title: string;
  route?: string;
  icon?: string;
  items: Record<string, MenuNode>;
}

export interface MenuTree {
  items: Record<string, MenuNode>;
}

// Строка дерева в меню
export interface MenuRow {
  title: string;
  route?: string;
  icon?: string;
  level: number;
  location: string;
  isGroup?: boolean;
}

// Служебные пункты ядра выводятся отдельно, внизу меню. Пункты делятся до построения дерева, поэтому пункт
// метамодели с тем же location («Поиск», «Проблемы», devtool) остается в дереве отдельным узлом
// со всеми вложенными пунктами.
export const splitMenuItems = (items: MenuDatasetItem[] | null | undefined): { tree: MenuDatasetItem[]; service: MenuDatasetItem[] } => {
  const tree: MenuDatasetItem[] = [];
  const service: MenuDatasetItem[] = [];
  (items || []).forEach((item) => (item.service ? service : tree).push(item));
  return { tree, service };
};

// Дерево из пунктов метамодели. accept — фильтр поиска по location; isCurrent — пункт текущей страницы.
// expand — разделы, которые нужно раскрыть, чтобы был виден пункт текущей страницы.
export const buildMenuTree = (
  items: MenuDatasetItem[],
  accept: (location: string) => boolean = () => true,
  isCurrent: (route: string | undefined) => boolean = () => false
): { tree: MenuTree; expand: string[] } => {
  const tree: MenuTree = { items: {} };
  const expand: string[] = [];
  items.forEach((item) => {
    if (!item.location || !accept(item.location)) return;
    const location = item.location.split('/');
    let node: MenuTree | MenuNode = tree;
    location.forEach((key) => {
      if (!node.items[key]) node.items[key] = { title: key, items: {} };
      node = node.items[key];
    });
    const leaf = node as MenuNode;
    leaf.title = item.title ?? leaf.title;
    leaf.route = item.route;
    leaf.icon = item.icon;
    if (isCurrent(item.route)) {
      location.forEach((_, i) => expand.push(location.slice(0, i + 1).join('/')));
    }
  });
  return { tree, expand };
};

// Строки меню по дереву: раздел разворачивается, если isExpanded для его location вернул true
export const menuRows = (tree: MenuTree | null | undefined, isExpanded: (location: string) => boolean): MenuRow[] => {
  const rows: MenuRow[] = [];
  const walk = (node: MenuTree | MenuNode, path: string[]) => {
    Object.entries(node.items).forEach(([key, item]) => {
      const itemPath = path.concat(key);
      const row: MenuRow = {
        title: item.title,
        route: item.route,
        icon: item.icon,
        level: itemPath.length - 1,
        location: itemPath.join('/')
      };
      rows.push(row);
      if (Object.keys(item.items).length) {
        row.isGroup = true;
        if (isExpanded(row.location)) walk(item, itemPath);
      }
    });
  };
  tree && walk(tree, []);
  return rows;
};
