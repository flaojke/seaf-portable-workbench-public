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

import { filterByDetailLevel } from "./filterByDetailLevel";

import type { ColsIndexesMap } from "@/types//tablesInfoProviderValue";
import type { JSONTableTable } from "shared/types/tableSchema";

import { TableDetailLevel } from "@/types/tableDetailLevel";

export const computeColIndexes = (
  tables: JSONTableTable[],
  detailLevel: TableDetailLevel,
): ColsIndexesMap => {
  if (detailLevel === TableDetailLevel.HeaderOnly) {
    return {};
  }
  return tables.reduce<ColsIndexesMap>((acc, table) => {
    const currentTableColsIndexes = filterByDetailLevel(
      table.fields,
      detailLevel,
    ).reduce<ColsIndexesMap>((tableAcc, field, index) => {
      return {
        ...tableAcc,
        [computeColIndexesKey(table.name, field.name)]: index,
      };
    }, {});

    return {
      ...acc,
      ...currentTableColsIndexes,
    };
  }, {});
};

export const computeColIndexesKey = (
  tableName: string,
  attr: string,
): string => {
  return `${tableName}.${attr}`;
};
