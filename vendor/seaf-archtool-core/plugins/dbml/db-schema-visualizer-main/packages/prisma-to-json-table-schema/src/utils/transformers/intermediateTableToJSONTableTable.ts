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

import { intermediateFieldToJSONTableField } from "./intermediateFieldToJSONTableField";

import {
  type FieldRelationsMap,
  type IntermediateTable,
} from "@/types/intermediateFormattedNode";

export const intermediateTableToJSONTableTable = (
  { fields: intermediateFields, name, indexes }: IntermediateTable,
  enumsSet: Set<string>,
  fieldRelationTable: FieldRelationsMap,
  tablesSet: Set<string>,
): JSONTableTable => {
  const fields: JSONTableTable["fields"] = [];

  for (let index = 0; index < intermediateFields.length; index++) {
    const intermediateField = intermediateFields[index];

    /*
    VirtualReferenceField is field that not a column in the database
    but just a reference field for Prisma to allow navigation between
    relationships.
    */
    const isVirtualReferenceField = tablesSet.has(
      intermediateField.type.type_name,
    );
    if (isVirtualReferenceField) {
      continue;
    }

    const field = intermediateFieldToJSONTableField(
      name,
      intermediateField,
      enumsSet,
      fieldRelationTable,
    );
    fields.push(field);
  }

  return { name, fields, indexes };
};
