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
import { computeRelationalFieldKey } from "shared/utils/computeRelationalFieldKey";

import { computeNameWithSchemaName } from "../computeNameWithSchemaName";

import type Field from "@dbml/core/types/model_structure/field";

interface DbmlToJSONTableFieldParams {
  field: Field;
  relationalFieldMap: Map<string, string[]>;
  enumsSet: Set<string>;
  ownerTable: string;
}
export const dbmlFieldToJSONTableField = ({
  field: {
    name,
    pk,
    unique,
    note,
    dbdefault,
    increment,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    not_null,
    type,
  },
  relationalFieldMap,
  enumsSet: enumsMap,
  ownerTable,
}: DbmlToJSONTableFieldParams): JSONTableField => {
  const fieldKey = computeRelationalFieldKey(ownerTable, name);

  const hasRelation = relationalFieldMap.has(fieldKey);
  const typeName = computeNameWithSchemaName(
    type.type_name as string,
    type.schemaName as string | undefined,
  );

  return {
    name,
    pk,
    unique,
    // the note returned by the dbml parser is not string
    // but an object there is an typing error in their package
    note: (note as any)?.value,
    not_null,
    type: {
      type_name: typeName,
      is_enum: enumsMap.has(typeName),
    },
    is_relation: hasRelation,
    relational_tables: hasRelation ? relationalFieldMap.get(fieldKey) : null,
    increment,
    dbdefault,
  };
};
