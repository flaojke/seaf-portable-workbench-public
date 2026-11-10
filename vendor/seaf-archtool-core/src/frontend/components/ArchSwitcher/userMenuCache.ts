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

import { getUserMenu } from '@front/helpers/menu.mjs';

export interface UserMenuItem {
  location?: string;
  route?: string;
  title?: string;
  icon?: string;
  order?: number;
}

// Меню кэшируется до следующей загрузки манифеста (state.moment): setManifest обновляет момент при каждой загрузке,
// в том числе после source/changed в VS Code, когда манифест обновляется на месте и объект остается прежним
interface MenuCache {
  moment: unknown;
  promise: Promise<UserMenuItem[]> | null;
  data: UserMenuItem[] | null;
}

let cache: MenuCache = {
  moment: null,
  promise: null,
  data: null
};

export function loadUserMenu(manifest: unknown, moment: unknown): Promise<UserMenuItem[]> {
  if (cache.moment === moment && cache.data) return Promise.resolve(cache.data);
  if (cache.moment === moment && cache.promise) return cache.promise;

  const promise: Promise<UserMenuItem[]> = getUserMenu(manifest)
    .then((data: unknown) => {
      const list = Array.isArray(data) ? data as UserMenuItem[] : [];
      if (cache.promise === promise) cache.data = list;
      return list;
    })
    .catch((error: unknown) => {
      if (cache.promise === promise) {
        cache.promise = null;
        cache.data = null;
      }
      throw error;
    });

  cache = { moment, promise, data: null };
  return promise;
}
