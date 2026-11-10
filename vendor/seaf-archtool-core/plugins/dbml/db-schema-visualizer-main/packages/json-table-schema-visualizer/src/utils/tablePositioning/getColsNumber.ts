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

export const getColsNumber = (tableCount: number): number => {
  // display tables in 3 columns if the number of tables is less than 6
  // and 4 columns if the number of tables is greater than 6
  const MINIMAL_COLS_COUNT = 3;
  const MAXIMAL_COLS_COUNT = 4;

  return tableCount > 6 ? MAXIMAL_COLS_COUNT : MINIMAL_COLS_COUNT;
};
