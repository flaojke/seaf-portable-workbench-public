/*
  Copyright (C) 2023 Sber

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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2025
*/

import { computeRelationalFieldKey } from "shared/utils/computeRelationalFieldKey";

import type Ref from "@dbml/core/types/model_structure/ref";

export const createRelationalTalesMap = (
  refs: Ref[],
): Map<string, string[]> => {
  let map = new Map<string, string[]>();

  refs.forEach((ref) => {
    const [sourceEndpoint, targetEndpoint] = ref.endpoints;
    const sourceFieldKey = computeRelationalFieldKey(
      sourceEndpoint.tableName,
      sourceEndpoint.fieldNames[0],
    );
    map = appendRelationalTablesMap(
      map,
      sourceFieldKey,
      targetEndpoint.tableName,
    );

    const targetFieldKey = computeRelationalFieldKey(
      targetEndpoint.tableName,
      targetEndpoint.fieldNames[0],
    );
    map = appendRelationalTablesMap(
      map,
      targetFieldKey,
      sourceEndpoint.tableName,
    );
  });

  return map;
};

const appendRelationalTablesMap = (
  map: Map<string, string[]>,
  fieldKey: string,
  tableToAdd: string,
): Map<string, string[]> => {
  const newMap = new Map<string, string[]>(map);

  if (newMap.has(fieldKey)) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const tablesSet = newMap.get(fieldKey)!;
    tablesSet.push(tableToAdd);
  } else {
    const tablesSet = [tableToAdd];
    newMap.set(fieldKey, tablesSet);
  }

  return newMap;
};
