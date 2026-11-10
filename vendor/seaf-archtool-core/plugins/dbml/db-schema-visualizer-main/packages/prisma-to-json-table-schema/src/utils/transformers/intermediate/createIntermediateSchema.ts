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

import { type JSONTableEnum } from "shared/types/tableSchema";

import { isEnumNode, isModelNode, isTypeNode } from "../../isTypeOf";
import { enumNodeToJSONTableEnum } from "../enumNodeToJSONTableEnum";

import { formatIntermediateTable } from "./formatIntermediateTable";

import type { Schema } from "@mrleebo/prisma-ast";

import {
  type RawRelationInfo,
  type IntermediateSchema,
  type IntermediateTable,
  type RelationType,
} from "@/types/intermediateFormattedNode";

export const createIntermediateSchema = (
  nodes: Schema["list"],
): IntermediateSchema => {
  const enums: JSONTableEnum[] = [];
  const tables: IntermediateTable[] = [];
  const enumsNames = new Set<string>();
  const types = new Set<string>();
  const rawRelations: RawRelationInfo[] = [];
  const inverseRelationMap = new Map<string, RelationType>();
  const tablesNames = new Set<string>();

  const registerInverseRelation = (name: string, type: RelationType): void => {
    inverseRelationMap.set(name, type);
  };

  const registerRawRelation = (info: RawRelationInfo): void => {
    rawRelations.push(info);
  };

  for (const node of nodes) {
    if (isEnumNode(node)) {
      const _enum = enumNodeToJSONTableEnum(node);
      enumsNames.add(_enum.name);
      enums.push(_enum);
    }

    if (isModelNode(node)) {
      tablesNames.add(node.name);
      tables.push(
        formatIntermediateTable(
          node,
          registerRawRelation,
          registerInverseRelation,
        ),
      );
    }

    if (isTypeNode(node)) {
      types.add(node.name);
    }
  }

  return {
    enums,
    tables,
    enumsNames,
    rawRelations,
    inverseRelationMap,
    tablesNames,
  };
};
