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

import { nextTick, reactive } from 'vue';

// Пункт меню. Формат { id, title, on } совместим с плагинами; icon и group необязательны.
export interface DocContextMenuItem {
  id: string;
  title: string;
  on: () => void;
  icon?: string;       // значок MDI, например mdi-download
  group?: string;      // подпись группы, например «Показать как»
}

// null в списке пунктов — разделитель
export type DocContextMenuEntry = DocContextMenuItem | null;

// Строка меню: пункт с подписью группы и разделителем перед ним
export interface DocContextMenuRow {
  key: string;
  item: DocContextMenuItem;
  caption: string | null;   // подпись группы — там, где group меняется
  divider: boolean;         // разделитель перед строкой; у первой строки его нет
}

export interface DocContextMenuState {
  show: boolean;
  x: number;
  y: number;
  items: DocContextMenuEntry[];
}

// Меню по правому клику у документов: одно на приложение, выводится в Root.vue (DocContextMenu) поверх
// страницы — Swagger UI и vis-network перерисовывают свой контейнер целиком.
export const docContextMenu = reactive<DocContextMenuState>({
  show: false,
  x: 0,
  y: 0,
  items: []
});

// Открывает меню с пунктами; без пунктов остается системное меню браузера.
// Вложенный документ или схема открывают свое меню первыми, внешний документ его не перебивает.
export function openDocContextMenu(event: MouseEvent, items?: DocContextMenuEntry[] | null): boolean {
  if (event.defaultPrevented || !items?.length) return false;
  event.preventDefault();
  docContextMenu.show = false;
  docContextMenu.x = event.clientX;
  docContextMenu.y = event.clientY;
  docContextMenu.items = items;
  nextTick(() => {
    docContextMenu.show = true;
  });
  return true;
}

// Плоский список строк меню. null в пунктах — разделитель; перед новой группой разделитель ставится сам.
// Подряд идущие разделители и разделители по краям схлопываются.
export function docContextMenuRows(items: DocContextMenuEntry[] | null | undefined): DocContextMenuRow[] {
  const rows: DocContextMenuRow[] = [];
  let group: string | undefined;
  let divider = false;
  (items || []).forEach((item, index) => {
    if (!item) {
      divider = true;
      return;
    }
    const caption = (item.group && (item.group !== group)) ? item.group : null;
    rows.push({
      key: item.id || `item-${index}`,
      item,
      caption,
      divider: !!rows.length && (divider || !!caption)
    });
    group = item.group;
    divider = false;
  });
  return rows;
}
