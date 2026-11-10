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

import { computeConnectionHandlePos } from "../computeConnectionHandlePositions";

import { Position } from "@/types/positions";

describe("compute connection handle positions", () => {
  test("return same position", () => {
    const input = {
      sourceW: 300,
      sourceX: 0,
      targetW: 300,
      targetX: 300,
    };
    expect(computeConnectionHandlePos(input)).toEqual([
      Position.Left,
      Position.Left,
      input.sourceX,
      input.targetX,
    ]);
  });

  test("source at right", () => {
    const input = {
      sourceW: 300,
      sourceX: 0,
      targetW: 300,
      targetX: 500,
    };
    expect(computeConnectionHandlePos(input)).toEqual([
      Position.Right,
      Position.Left,
      input.sourceX + input.sourceW,
      input.targetX,
    ]);
  });

  test("source at left", () => {
    const input = {
      sourceW: 300,
      sourceX: 500,
      targetW: 300,
      targetX: 0,
    };
    expect(computeConnectionHandlePos(input)).toEqual([
      Position.Left,
      Position.Right,
      input.sourceX,
      input.targetW + input.targetX,
    ]);
  });
});
