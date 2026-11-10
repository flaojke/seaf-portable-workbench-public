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

import computeTablesPositions from "../computeTablesPositions";
import { getColsNumber } from "../getColsNumber";

import {
  COLUMN_HEIGHT,
  TABLE_HEADER_HEIGHT,
  TABLE_DEFAULT_MIN_WIDTH,
  TABLES_GAP_X,
  TABLES_GAP_Y,
} from "@/constants/sizing";
import { createBookingsTableClone, exampleData } from "@/fake/fakeJsonTables";

jest.mock("../getColsNumber", () => ({
  getColsNumber: jest.fn(),
}));

const TABLE_WIDTH_WITH_GAP = TABLE_DEFAULT_MIN_WIDTH + TABLES_GAP_X;

describe("compute tables positions", () => {
  test("less than 6 tables positions", () => {
    (getColsNumber as jest.Mock).mockReturnValue(3);

    const tablesPositions = computeTablesPositions([
      ...exampleData.tables,
      createBookingsTableClone("1"),
    ]);

    expect(tablesPositions).toEqual(
      new Map<string, [number, number]>([
        ["follows", [0, 0]],
        ["users", [TABLE_WIDTH_WITH_GAP, 0]],
        ["bookings", [TABLE_WIDTH_WITH_GAP * 2, 0]],
        [
          "bookings_1",
          [0, TABLE_HEADER_HEIGHT + COLUMN_HEIGHT * 5 + TABLES_GAP_Y],
        ],
      ]),
    );
  });

  test("more than 6 tables positions", () => {
    (getColsNumber as jest.Mock).mockReturnValue(4);

    const tablesPositions = computeTablesPositions([
      ...exampleData.tables,
      createBookingsTableClone("1"),
    ]);

    expect(tablesPositions).toEqual(
      new Map<string, [number, number]>([
        ["follows", [0, 0]],
        ["users", [TABLE_WIDTH_WITH_GAP, 0]],
        ["bookings", [TABLE_WIDTH_WITH_GAP * 2, 0]],
        ["bookings_1", [TABLE_WIDTH_WITH_GAP * 3, 0]],
      ]),
    );
  });
});
