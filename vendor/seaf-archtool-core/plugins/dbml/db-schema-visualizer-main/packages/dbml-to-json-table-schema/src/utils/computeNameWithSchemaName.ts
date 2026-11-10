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

import { DEFAULT_SCHEMA_NAME } from "../constants/schema";

import type Enum from "@dbml/core/types/model_structure/enum";
import type Table from "@dbml/core/types/model_structure/table";

export const computeNameWithSchemaName = (
  objectName: string,
  schemaName?: string,
): string => {
  if (
    schemaName !== undefined &&
    schemaName !== null &&
    schemaName !== DEFAULT_SCHEMA_NAME
  ) {
    return `${schemaName}.${objectName}`;
  }

  return objectName;
};

export const getTableFullName = (table: Table): string => {
  // unfortunately the Table type from dbml package not define the schemaName property
  // while it exists
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return computeNameWithSchemaName(table.name, (table as any).schemaName);
};

export const getEnumFullName = (_enum: Enum): string => {
  // unfortunately the Enum type from dbml package not define the schemaName property
  // while it exists
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return computeNameWithSchemaName(_enum.name, (_enum as any).schemaName);
};
