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

import type {
  JSONTableField,
  JSONTableSchema,
  JSONTableTable,
} from "shared/types/tableSchema";

export type RelationType = "one" | "many";
export type RelationMap = Map<string, RelationType>;
export type RawRelation = RawRelationInfo[];

/**
 * @property {string} key - a combination of the table and field concerned.
 * @property {string[]} value - list of tables with which it has a relationship
 */
export type FieldRelationsMap = Map<string, string[]>;

export interface RawRelationInfo {
  table: string;
  field: string;
  name?: string;
  referenceTable: string;
  referenceField: string;
}

// exclude the default `type` because before the first grouping, enums
// are enums not yet known
export interface IntermediateField
  extends Omit<JSONTableField, "is_relation" | "relational_tables" | "type"> {
  type: { type_name: string; many?: boolean };
}

export interface FieldConfig
  extends Omit<IntermediateField, "note" | "type" | "name" | "not_null"> {}

export interface IntermediateTable extends Omit<JSONTableTable, "fields"> {
  fields: IntermediateField[];
}

export interface IntermediateSchema
  extends Omit<JSONTableSchema, "refs" | "tables"> {
  tables: IntermediateTable[];
  enumsNames: Set<string>;
  rawRelations: RawRelation;
  inverseRelationMap: Map<string, RelationType>;
  tablesNames: Set<string>;
}
