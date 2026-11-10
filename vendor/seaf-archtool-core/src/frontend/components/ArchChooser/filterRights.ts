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

import type { UserRight } from '@front/store/userRight';

export interface RightFilters {
  title?: string | null;
  alias?: string | null;
  ra?: string | null;
}

export interface AccessOption {
  title: string;
  value: string | null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function accessOptionsFromRights(
  rights: readonly UserRight[] | null | undefined
): AccessOption[] {
  const levels = new Set<string>();
  if (Array.isArray(rights)) {
    for (let i = 0; i < rights.length; i++) {
      const value = text(rights[i]?.ra).trim().toLowerCase();
      if (value) levels.add(value);
    }
  }
  const options: AccessOption[] = [{title: 'Все уровни', value: null}];
  for (const level of [...levels].sort()) {
    options.push({title: level, value: level});
  }
  return options;
}

export function filterRights<T extends UserRight>(
  rights: readonly T[] | null | undefined,
  filters: RightFilters = {}
): T[] {
  if (!Array.isArray(rights)) return [];
  const titleNeedle = (filters.title ?? '').trim().toLowerCase();
  const aliasNeedle = (filters.alias ?? '').trim().toLowerCase();
  const raNeedle = (filters.ra ?? '').trim().toLowerCase();
  if (!titleNeedle && !aliasNeedle && !raNeedle) return rights as T[];

  const matched: T[] = [];
  for (let i = 0; i < rights.length; i++) {
    const right = rights[i];
    if (!right) continue;
    if (titleNeedle && !text(right.title).toLowerCase().includes(titleNeedle)) continue;
    if (aliasNeedle && !text(right.alias).toLowerCase().includes(aliasNeedle)) continue;
    if (raNeedle && text(right.ra).trim().toLowerCase() !== raNeedle) continue;
    matched.push(right);
  }
  return matched;
}
