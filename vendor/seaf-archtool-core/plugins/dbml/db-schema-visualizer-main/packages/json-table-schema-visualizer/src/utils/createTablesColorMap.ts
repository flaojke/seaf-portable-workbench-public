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

import { type JSONTableTable } from "shared/types/tableSchema";

import { getTableColorFromName } from "./colors/getTableColorFromName";
import { getContrastColor } from "./colors/getContrastColor";

import { type TableColors } from "@/types/tableColor";

export const createTablesColorMap = (
  tables: JSONTableTable[],
): Map<string, TableColors> => {
  const tableColors = new Map<string, TableColors>();
  tables.forEach((table) => {
    const tableColor = !!table.headerColor ? { regular: table.headerColor, lighter: getContrastColor(table.headerColor) } : getTableColorFromName(table.name);

    tableColors.set(table.name, tableColor);
  });

  return tableColors;
};
