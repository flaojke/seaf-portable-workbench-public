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

import { TableNotExistError } from "../errors/TableNotExistError";
import { FieldNotExistsError } from "../errors/FieldNotExistsError";
import {
  computeNameWithSchemaName,
  getTableFullName,
} from "../utils/computeNameWithSchemaName";

import type Endpoint from "@dbml/core/types/model_structure/endpoint";
import type Ref from "@dbml/core/types/model_structure/ref";
import type Table from "@dbml/core/types/model_structure/table";

export const validateRefs = (refs: Ref[], tables: Table[]): void => {
  const tableMap = new Map<string, Table>();
  tables.forEach((table) => {
    const tableName = getTableFullName(table);
    tableMap.set(tableName, table);
  });

  refs.forEach((ref) => {
    ref.endpoints.forEach((endpoint) => {
      const relatedTableFullName = computeNameWithSchemaName(
        endpoint.tableName,
        endpoint.schemaName,
      );
      if (tableMap.has(relatedTableFullName)) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        validateEndpoint(endpoint, tableMap.get(relatedTableFullName)!);
        return;
      }

      throw new TableNotExistError(relatedTableFullName);
    });
  });
};

export const validateEndpoint = (endpoint: Endpoint, table: Table): void => {
  const endpointFieldName = endpoint.fieldNames[0];
  const colExists = table.fields.some(
    (field) => endpointFieldName === field.name,
  );
  if (!colExists) {
    throw new FieldNotExistsError(endpointFieldName, table.name);
  }
};
