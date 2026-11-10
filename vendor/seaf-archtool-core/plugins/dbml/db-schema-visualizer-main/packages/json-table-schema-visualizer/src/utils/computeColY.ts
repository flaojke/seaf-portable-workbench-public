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

import { computeColIndexesKey } from "./computeColIndexes";

import type { RelationItem } from "@/types/relation";
import type { ColsIndexesMap } from "@/types/tablesInfoProviderValue";

import { COLS_OFFSET_Y_TO_COL_MIDDLE, COLUMN_HEIGHT } from "@/constants/sizing";

export const computeColY = (
  colsIndexesMap: ColsIndexesMap,
  relation: RelationItem,
): number => {
  const indexKey = computeColIndexesKey(
    relation.tableName,
    relation.fieldNames[0],
  );

  const colIndex = colsIndexesMap[indexKey] ?? 0;

  const colY = COLS_OFFSET_Y_TO_COL_MIDDLE + COLUMN_HEIGHT * colIndex;

  return colY;
};
