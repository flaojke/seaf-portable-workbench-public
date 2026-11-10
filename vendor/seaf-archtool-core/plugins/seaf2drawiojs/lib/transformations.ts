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

  Contributors:
      Aksinenko Anatoly <aiaksinenko@sberbnak.ru>, Sber - 2026
*/

import yaml from 'yaml';

const DIFF_PATH_EXTENSION = /\.(yaml|json)$/i;

export type DiffRecord = {
  id: string;
  [key: string]: unknown;
};

export type Diff = Record<string, DiffRecord[]>;

export function manualRouteIds(records: DiffRecord[] | undefined): Set<string> {
  return new Set((records ?? []).filter((record) => {
    const diff = record.diff as Record<string, unknown> | undefined;
    const geometry = diff?.geometry_attr_key as Record<string, unknown> | undefined;
    const cell = diff?.cell_attr_key as Record<string, unknown> | undefined;
    return geometry?.pointsArray !== undefined || cell?.style !== undefined;
  }).map((record) => record.id));
}

type DiffResponse = {
  data?: unknown;
};

type ContentGetter = (path: string) => unknown | Promise<unknown>;
type PluginContentPutter = (path: string, content: string) => unknown | Promise<unknown>;
type BackendContentPutter = (content: Record<string, string>) => unknown | Promise<unknown>;
type BackendPutResult = {
  success?: boolean;
  message?: string;
};

export function normalizeDiffPath(path: unknown): string | null {
  if (path === undefined || path === null || path === '') return null;
  if (typeof path !== 'string') throw new TypeError('diff_path must be a string');
  const normalizedPath = path.trim();
  if (!normalizedPath) return null;
  if (!DIFF_PATH_EXTENSION.test(normalizedPath)) {
    throw new TypeError('diff_path must end with .yaml or .json');
  }
  return normalizedPath;
}

export function stringifyDiffContent(diff: unknown, path: string): string {
  return path.toLowerCase().endsWith('.json')
    ? `${JSON.stringify(diff, null, 2)}\n`
    : yaml.stringify(diff);
}

export function mergeDiffs(
  loadedDiff: Diff | null | undefined,
  currentDiff: Diff | null | undefined,
  visibleIndices: Record<string, Record<string, unknown>> | null | undefined
): Diff {
  const merged = structuredClone(loadedDiff ?? {});
  for (const [diagramId, visibleElements] of Object.entries(visibleIndices ?? {})) {
    const currentRecords = new Map(
      (currentDiff?.[diagramId] ?? []).map((record) => [record.id, record])
    );
    const mergedRecords = new Map(
      (merged[diagramId] ?? []).map((record) => [record.id, record])
    );
    if (diagramId === 'common_location_page'
      && !Object.prototype.hasOwnProperty.call(merged, diagramId)
      && currentRecords.size === 0) continue;
    for (const id of Object.keys(visibleElements)) {
      if (currentRecords.has(id)) {
        mergedRecords.set(id, currentRecords.get(id) as DiffRecord);
      } else {
        mergedRecords.delete(id);
      }
    }
    merged[diagramId] = [...mergedRecords.values()];
  }
  return merged;
}

export function parseDiffContent(response: unknown): Diff | null {
  const content = response && typeof response === 'object' && Object.prototype.hasOwnProperty.call(response, 'data')
    ? (response as DiffResponse).data
    : response;
  const diff = typeof content === 'string' ? yaml.parse(content) : content;
  if (diff === undefined || diff === null) return null;
  if (typeof diff !== 'object' || Array.isArray(diff)) {
    throw new TypeError('diff_path must contain a YAML object');
  }
  return diff as Diff;
}

export async function getDiffContent(getContent: ContentGetter, path: string): Promise<Diff | null> {
  try {
    return parseDiffContent(await getContent(path));
  } catch (error) {
    const status = error?.response?.status ?? error?.status;
    if (status === 404) return null;
    throw error;
  }
}

export async function putDiffContent(
  putContent: PluginContentPutter | BackendContentPutter,
  path: string,
  content: string,
  isPlugin: boolean
): Promise<unknown> {
  const result = isPlugin
    ? await (putContent as PluginContentPutter)(path, content)
    : await (putContent as BackendContentPutter)({ [path]: content });
  if (!isPlugin && !(result as BackendPutResult | undefined)?.success) {
    throw new Error((result as BackendPutResult | undefined)?.message || `Failed to save transformations to ${path}`);
  }
  return result;
}
