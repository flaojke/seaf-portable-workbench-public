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

import { type JSONTableField } from "shared/types/tableSchema";

import { TableDetailLevel } from "@/types/tableDetailLevel";

export function filterByDetailLevel(
  fields: JSONTableField[],
  detailLevel: TableDetailLevel,
): JSONTableField[] {
  function isFullDetail(): boolean {
    return detailLevel === TableDetailLevel.FullDetails;
  }
  function isKeyOnly(): boolean {
    return detailLevel === TableDetailLevel.KeyOnly;
  }
  function hasRelations(field: JSONTableField): boolean {
    if (!Array.isArray(field.relational_tables)) {
      return false;
    }
    return field.relational_tables.length > 0;
  }
  return fields.filter(
    (f) => isFullDetail() || (isKeyOnly() && hasRelations(f)),
  );
}
