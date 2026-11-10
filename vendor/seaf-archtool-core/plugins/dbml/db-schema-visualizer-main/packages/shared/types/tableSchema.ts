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

import type Endpoint from "@dbml/core/types/model_structure/endpoint";
import type Enum from "@dbml/core/types/model_structure/enum";
import type Field from "@dbml/core/types/model_structure/field";
import type IndexColumn from "@dbml/core/types/model_structure/indexColumn";
import type Index from "@dbml/core/types/model_structure/indexes";
import type Table from "@dbml/core/types/model_structure/table";
import type { PartialRequired } from "./utils";

export interface JSONTableSchema {
  refs: JSONTableRef[];
  enums: JSONTableEnum[];
  tables: JSONTableTable[];
}

export interface JSONTableEnum
  extends PartialRequired<Pick<Enum, "name">, "name"> {
  values: Array<{ name: string; note?: string }>;
}

export interface JSONTableRef {
  name?: string | null;
  endpoints: Array<Pick<Endpoint, "relation" | "tableName" | "fieldNames">>;
}

export interface JSONTableField
  extends PartialRequired<
    Pick<
      Field,
      "name" | "pk" | "unique" | "note" | "increment" | "not_null" | "dbdefault"
    >,
    "name"
  > {
  type: { type_name: string; is_enum: boolean };
  is_relation: boolean;
  relational_tables?: string[] | null;
}

export interface JSONTableIndexColumn
  extends Pick<IndexColumn, "type" | "value"> {}

export interface JSONTableIndex
  extends Partial<Pick<Index, "unique" | "type" | "name" | "note">> {
  // the parser return `pk` as boolean not string
  pk?: boolean;
  columns: JSONTableIndexColumn[];
}

export interface JSONTableTable
  extends PartialRequired<
    Pick<Table, "name" | "note" | "headerColor">,
    "name"
  > {
  fields: JSONTableField[];
  indexes: JSONTableIndex[];
}
