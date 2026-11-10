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

// Ширина главного меню (Root.vue): меняется перетаскиванием правой границы и запоминается в браузере.

export const MIN_DRAWER_WIDTH = 200;
export const MAX_DRAWER_WIDTH = 640;
export const DEFAULT_DRAWER_WIDTH = 300;
export const DRAWER_WIDTH_KEY = 'dochub.menu.width';

type StorageGetter = () => Pick<Storage, 'getItem' | 'setItem'>;

// Обращение к localStorage само может бросить исключение (приватный режим, webview), поэтому — через функцию
const browserStorage: StorageGetter = () => window.localStorage;

// Ширина в допустимых пределах, целым числом
export const clampDrawerWidth = (value: number): number =>
  Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, Math.round(value)));

// Сохраненная ширина; без сохраненного значения, с испорченным значением или без хранилища — ширина по умолчанию
export const readDrawerWidth = (storage: StorageGetter = browserStorage): number => {
  try {
    const saved = Number(storage().getItem(DRAWER_WIDTH_KEY));
    return Number.isFinite(saved) && (saved > 0) ? clampDrawerWidth(saved) : DEFAULT_DRAWER_WIDTH;
  } catch {
    return DEFAULT_DRAWER_WIDTH;
  }
};

// Без хранилища ширина просто не запомнится
export const saveDrawerWidth = (value: number, storage: StorageGetter = browserStorage): void => {
  try {
    storage().setItem(DRAWER_WIDTH_KEY, String(value));
  } catch {
    // ширина просто не запомнится
  }
};
