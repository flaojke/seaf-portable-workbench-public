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

import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import type { UserRight } from '@front/store/userRight';

export const RECENT_ARCHITECTURES_KEY = 'seaf.archSwitcher.recent';

const logger = getLoggerWithTag('ArchSwitcher');
const RECENT_LIMIT = 4;

export interface RecentEntry {
  alias: string;
  usedAt: number;
}

interface RecentStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function defaultStorage(): RecentStorage | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function normalize(parsed: unknown): RecentEntry[] {
  if (!Array.isArray(parsed)) return [];
  const byAlias = new Map<string, RecentEntry>();
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { alias?: unknown; usedAt?: unknown };
    if (!row.alias || typeof row.alias !== 'string') continue;
    if (typeof row.usedAt !== 'number' || !Number.isFinite(row.usedAt)) continue;
    const prev = byAlias.get(row.alias);
    if (prev && prev.usedAt > row.usedAt) continue;
    byAlias.set(row.alias, {
      alias: row.alias,
      usedAt: row.usedAt
    });
  }
  return [...byAlias.values()]
    .sort((a, b) => b.usedAt - a.usedAt)
    .slice(0, RECENT_LIMIT);
}

export function readRecent(storage: RecentStorage | null = defaultStorage()): RecentEntry[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(RECENT_ARCHITECTURES_KEY);
    if (!raw) return [];
    return normalize(JSON.parse(raw));
  } catch {
    logger.warn(() => `Failed to get item ${RECENT_ARCHITECTURES_KEY} from storage`);
    return [];
  }
}

export function remember(
  alias: string,
  storage: RecentStorage | null = defaultStorage(),
  now: number = Date.now()
): RecentEntry[] {
  if (!alias || !storage) return readRecent(storage);
  const next = normalize([
    ...readRecent(storage).filter((item) => item.alias !== alias),
    {alias, usedAt: now}
  ]);
  try {
    storage.setItem(RECENT_ARCHITECTURES_KEY, JSON.stringify(next));
  } catch {
    logger.warn(() => `Failed to set item ${RECENT_ARCHITECTURES_KEY} in storage`);
  }
  return next;
}

export function recentSection<T extends UserRight>(
  rights: readonly T[] | null | undefined,
  currentAlias: string,
  storage: RecentStorage | null = defaultStorage()
): T[] {
  const list = Array.isArray(rights) ? rights : [];
  const byAlias = new Map<string, T>();
  for (const right of list) {
    if (right?.alias) byAlias.set(right.alias, right);
  }
  const matched: T[] = [];
  for (const item of readRecent(storage)) {
    if (item.alias === currentAlias) continue;
    const right = byAlias.get(item.alias);
    if (right) matched.push(right);
  }
  return matched;
}

function sortLabel(right: UserRight | null | undefined): string {
  return right?.title || right?.alias || '';
}

export function allSorted<T extends UserRight>(
  rights: readonly T[] | null | undefined
): T[] {
  if (!Array.isArray(rights)) return [];
  return [...rights].sort((a, b) => {
    const byLabel = sortLabel(a).localeCompare(sortLabel(b), 'ru');
    if (byLabel !== 0) return byLabel;
    return (a?.alias || '').localeCompare(b?.alias || '', 'ru');
  });
}
