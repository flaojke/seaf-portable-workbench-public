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

import { nextTick } from 'vue';
import {
  DocContextMenuItem,
  docContextMenu,
  docContextMenuRows,
  openDocContextMenu
} from '@front/components/Docs/docContextMenuState';

const item = (id: string, group?: string): DocContextMenuItem => ({ id, title: id, on: () => undefined, group });

const mouseEvent = (init: Partial<MouseEvent> = {}) => {
  const event = { defaultPrevented: false, clientX: 10, clientY: 20, ...init } as MouseEvent;
  event.preventDefault = jest.fn(() => {
    (event as { defaultPrevented: boolean }).defaultPrevented = true;
  });
  return event;
};

const shape = (rows: ReturnType<typeof docContextMenuRows>) =>
  rows.map(({ key, caption, divider }) => ({ key, caption, divider }));

describe('docContextMenuRows', () => {
  test('Подпись группы выводится там, где группа меняется, перед новой группой — разделитель', () => {
    const rows = docContextMenuRows([
      item('md', 'Показать как'),
      item('table', 'Показать как'),
      item('svg', 'Схема'),
      item('png', 'Схема')
    ]);

    expect(shape(rows)).toEqual([
      { key: 'md', caption: 'Показать как', divider: false },
      { key: 'table', caption: null, divider: false },
      { key: 'svg', caption: 'Схема', divider: true },
      { key: 'png', caption: null, divider: false }
    ]);
  });

  test('null — разделитель; подряд идущие и крайние разделители схлопываются', () => {
    const rows = docContextMenuRows([null, item('a'), null, null, item('b'), null]);

    expect(shape(rows)).toEqual([
      { key: 'a', caption: null, divider: false },
      { key: 'b', caption: null, divider: true }
    ]);
  });

  test('Пункты плагинов без group выводятся без подписей и разделителей', () => {
    expect(shape(docContextMenuRows([item('a'), item('b')]))).toEqual([
      { key: 'a', caption: null, divider: false },
      { key: 'b', caption: null, divider: false }
    ]);
  });

  test('Пункт без id получает ключ по позиции; пустой список и null дают пустое меню', () => {
    const noId = { title: 'Без id', on: () => undefined } as DocContextMenuItem;

    expect(docContextMenuRows([item('a'), noId])[1].key).toBe('item-1');
    expect(docContextMenuRows([])).toEqual([]);
    expect(docContextMenuRows(null)).toEqual([]);
  });
});

describe('openDocContextMenu', () => {
  beforeEach(() => {
    docContextMenu.show = false;
    docContextMenu.items = [];
  });

  test('Открывает меню в точке щелчка и подавляет системное меню браузера', async() => {
    const event = mouseEvent({ clientX: 120, clientY: 340 });
    const items = [item('a')];

    expect(openDocContextMenu(event, items)).toBe(true);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(docContextMenu).toMatchObject({ x: 120, y: 340, items });

    await nextTick();
    expect(docContextMenu.show).toBe(true);
  });

  test('Без пунктов остается системное меню браузера', () => {
    const event = mouseEvent();

    expect(openDocContextMenu(event, [])).toBe(false);
    expect(openDocContextMenu(event, null)).toBe(false);
    expect(openDocContextMenu(event)).toBe(false);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(docContextMenu.show).toBe(false);
  });

  test('Внешний документ не перебивает меню, которое уже открыл вложенный документ или схема', () => {
    const inner = [item('inner')];
    const event = mouseEvent();

    expect(openDocContextMenu(event, inner)).toBe(true);
    expect(openDocContextMenu(event, [item('outer')])).toBe(false);
    expect(docContextMenu.items).toEqual(inner);
  });

  test('Повторное открытие переоткрывает меню в новой точке', async() => {
    openDocContextMenu(mouseEvent({ clientX: 1, clientY: 1 }), [item('a')]);
    await nextTick();

    openDocContextMenu(mouseEvent({ clientX: 50, clientY: 60 }), [item('b')]);
    expect(docContextMenu.show).toBe(false);
    expect(docContextMenu).toMatchObject({ x: 50, y: 60 });

    await nextTick();
    expect(docContextMenu.show).toBe(true);
  });
});
