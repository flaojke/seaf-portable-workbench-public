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

import { type Model } from "@mrleebo/prisma-ast";

import { isField } from "../../isTypeOf";

import { formatIntermediateTableField } from "./formatIntermediateField";
import { lookForRelation } from "./lookForRelation";

import {
  type IntermediateTable,
  type RawRelationInfo,
  type RelationType,
} from "@/types/intermediateFormattedNode";

export const formatIntermediateTable = (
  node: Model,
  registerRawRelation: (info: RawRelationInfo) => void,
  registerInverseRelation: (name: string, info: RelationType) => void,
): IntermediateTable => {
  const fields: IntermediateTable["fields"] = [];

  for (const mayAField of node.properties) {
    if (!isField(mayAField)) continue;

    const field = formatIntermediateTableField(mayAField);
    lookForRelation(
      mayAField,
      node.name,
      registerRawRelation,
      registerInverseRelation,
    );

    fields.push(field);
  }

  return {
    fields,
    name: node.name,
    indexes: [], // TODO : also format indexes,
  };
};
