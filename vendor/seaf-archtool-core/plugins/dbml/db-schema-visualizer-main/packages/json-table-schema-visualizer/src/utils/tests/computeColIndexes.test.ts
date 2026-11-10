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

import { computeColIndexes } from "../computeColIndexes";

import { exampleData } from "@/fake/fakeJsonTables";

describe("compute cols index map", () => {
  test("compute cols index map", () => {
    expect(computeColIndexes(exampleData.tables)).toEqual({
      "users.id": 0,
      "users.email": 1,
      "bookings.booking_date": 2,
      "bookings.country": 1,
      "bookings.id": 0,
      "follows.created_at": 3,
      "follows.following_user_id": 2,
      "follows.id": 0,
      "follows.status": 4,
      "follows.view": 1,
    });
  });
});
