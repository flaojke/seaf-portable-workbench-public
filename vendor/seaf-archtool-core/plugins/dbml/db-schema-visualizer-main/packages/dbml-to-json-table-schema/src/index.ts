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

import { type CompilerDiagnostic } from "@dbml/core";
// @ts-ignore
import { parse } from "@dbml/core/lib/parse/dbmlParser";
import { DiagnosticError } from "shared/types/diagnostic";

import { dbmlSchemaToJSONTableSchema } from "./utils/transfomers/dbmlSchemaToJSONTableSchema";
import { validateSchema } from "./validators";

import type { JSONTableSchema } from "shared/types/tableSchema";

export const parseDBMLToJSON = (dbmlCode: string): JSONTableSchema => {
  try {
    const rawParsedSchema = parse(dbmlCode);
    validateSchema(rawParsedSchema);
    return dbmlSchemaToJSONTableSchema(rawParsedSchema);
  } catch (error) {
    if ("location" in (error as any) && "message" in (error as any)) {
      const _error = error as CompilerDiagnostic;

      const locationEnd = _error.location.end;
      const locationStart = _error.location.start;

      if (locationEnd === undefined || locationStart === undefined) {
        throw error;
      }

      throw new DiagnosticError(
        {
          end: {
            column: locationEnd.column - 1,
            line: locationEnd.line - 1,
          },
          start: {
            column: locationStart.column - 1,
            line: locationStart.line - 1,
          },
        },
        _error.message,
      );
    }
    throw error;
  }
};
