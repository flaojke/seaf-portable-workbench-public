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

import { type RawDatabase } from "@dbml/core/types/model_structure/database";
import { type JSONTableSchema } from "shared/types/tableSchema";

import { createEnumsSet } from "../createEnumsSet";
import { createRelationalTalesMap } from "../createRelationalTalesMap";

import { dbmlEnumToJSONTableEnum } from "./dbmlEnumToJSONTableEnum";
import { dbmlRefToJSONTableRef } from "./dbmlRefToJSONTableRef";
import { dbmlTableToJSONTableTable } from "./dbmlTableToJSONTableTable";

export const dbmlSchemaToJSONTableSchema = ({
  refs,
  enums,
  tables,
}: RawDatabase): JSONTableSchema => {
  const relationalFieldMap = createRelationalTalesMap(refs);
  const enumsMap = createEnumsSet(enums);

  const jsonTableRefs = refs.map(dbmlRefToJSONTableRef);
  const jsonTableEnums = enums.map(dbmlEnumToJSONTableEnum);
  const jsonTableTables = tables.map((table) =>
    dbmlTableToJSONTableTable(table, relationalFieldMap, enumsMap),
  );

  return {
    refs: jsonTableRefs,
    enums: jsonTableEnums,
    tables: jsonTableTables,
  };
};
