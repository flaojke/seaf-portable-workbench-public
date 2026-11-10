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

import { type CstNodeLocation, getSchema } from "@mrleebo/prisma-ast";
import { type JSONTableSchema } from "shared/types/tableSchema";
import { DiagnosticError } from "shared/types/diagnostic";

import { prismaASTToJSONTableSchema } from "./utils/transformers/prismaASTToJSONTableSchema";

export const parsePrismaToJSON = (prismaCode: string): JSONTableSchema => {
  try {
    const rawParsedSchema = getSchema(prismaCode);
    return prismaASTToJSONTableSchema(rawParsedSchema);
  } catch (error) {
    if ("token" in (error as any)) {
      const token = (error as any).token as CstNodeLocation;

      const endColumn = token.endColumn;
      const endLine = token.endLine;
      const startColumn = token.startColumn;
      const startLine = token.startLine;

      if (
        endColumn === undefined ||
        startColumn === undefined ||
        endLine === undefined ||
        startLine === undefined
      ) {
        throw error;
      }

      const locationEnd = { column: endColumn, line: endLine };
      const locationStart = {
        column: startColumn,
        line: startLine,
      };

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
        String((error as Error).message),
      );
    }

    throw error;
  }
};
