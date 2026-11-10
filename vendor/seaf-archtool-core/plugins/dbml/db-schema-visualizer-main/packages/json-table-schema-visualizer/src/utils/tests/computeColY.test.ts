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

import { computeColY } from "../computeColY";

import { COLS_OFFSET_Y_TO_COL_MIDDLE } from "@/constants/sizing";
describe("computing col y", () => {
  test("computing col y", () => {
    expect(
      computeColY(
        { "users.email": 0 },
        { fieldNames: ["email"], relation: "1", tableName: "users" },
      ),
    ).toBe(COLS_OFFSET_Y_TO_COL_MIDDLE);
  });

  test("computing col y while index is missing in map", () => {
    expect(
      computeColY(
        { "users.email": 0 },
        { fieldNames: ["not-email"], relation: "1", tableName: "users" },
      ),
    ).toBe(COLS_OFFSET_Y_TO_COL_MIDDLE);
  });
});
