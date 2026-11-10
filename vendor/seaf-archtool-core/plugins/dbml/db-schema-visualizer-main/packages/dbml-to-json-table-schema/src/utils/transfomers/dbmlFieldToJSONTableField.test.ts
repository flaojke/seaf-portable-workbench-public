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

import { createEnumsSet } from "../createEnumsSet";
import { createRelationalTalesMap } from "../createRelationalTalesMap";

import { dbmlFieldToJSONTableField } from "./dbmlFieldToJSONTableField";

import { dbmlTestCodeInJSONTableFormat, parsedDBML } from "@/tests/data";

describe("transform dbml field to json table field", () => {
  const enumsSet = createEnumsSet(parsedDBML.enums);
    const relationalFieldMap = createRelationalTalesMap(parsedDBML.refs);
    const table = parsedDBML.tables[0];

  test("transform simple field", () => {
    const field = table.fields[0];

    expect(
      dbmlFieldToJSONTableField({
        field,
        enumsSet,
        ownerTable: table.name,
        relationalFieldMap,
      }),
    ).toEqual(dbmlTestCodeInJSONTableFormat.tables[0].fields[0]);
  });

  test("transform relational field", () => {
    const field = table.fields[2];

    expect(
      dbmlFieldToJSONTableField({
        field,
        enumsSet,
        ownerTable: table.name,
        relationalFieldMap,
      }),
    ).toEqual(dbmlTestCodeInJSONTableFormat.tables[0].fields[2]);
  });

  test("transform enum field", () => {
    const field = table.fields[4];

    expect(
      dbmlFieldToJSONTableField({
        field,
        enumsSet,
        ownerTable: table.name,
        relationalFieldMap,
      }),
    ).toEqual(dbmlTestCodeInJSONTableFormat.tables[0].fields[4]);
  });
});
