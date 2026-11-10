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

import { StoreSignal } from "./StoreSignal";

class TableWidthStore extends StoreSignal<number> {
  private readonly tableWidths = new Map<string, number>();

  constructor() {
    super("tableWidth");
  }

  public getWidth(tableName: string): number | undefined {
    return this.tableWidths.get(tableName);
  }

  public setWidth(table: string, width: number): void {
    this.tableWidths.set(table, width);
    this.emit(table, width);
  }

  public remove(table: string): void {
    this.tableWidths.delete(table);
  }
}

export const tableWidthStore = new TableWidthStore();
