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

import { getTableFullName } from "../computeNameWithSchemaName";

import { dbmlFieldToJSONTableField } from "./dbmlFieldToJSONTableField";
import { dbmlIndexToJSONTableIndex } from "./dbmlIndexToJSONTableIndex";

import type Table from "@dbml/core/types/model_structure/table";

export const dbmlTableToJSONTableTable = (
  table: Table,
  relationalFieldMap: Map<string, string[]>,
  enumsMap: Set<string>,
): JSONTableTable => {
  const { name, note, headerColor, fields, indexes } = table;

  return {
    name: getTableFullName(table),
    headerColor,
    // the note returned by the dbml parser is not string
    // but an object there is an typing error in their package
    note: (note as any)?.value,
    fields: fields.map((field) =>
      dbmlFieldToJSONTableField({
        field,
        enumsSet: enumsMap,
        relationalFieldMap,
        ownerTable: name,
      }),
    ),
    indexes: indexes.map(dbmlIndexToJSONTableIndex),
  };
};
