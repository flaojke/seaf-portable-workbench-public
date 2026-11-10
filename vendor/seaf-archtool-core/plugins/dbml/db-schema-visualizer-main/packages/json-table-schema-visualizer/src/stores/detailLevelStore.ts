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

import { PersistableStore } from "./PersitableStore";

import { AppLocalStorage } from "@/storages/local";
import { TableDetailLevel } from "@/types/tableDetailLevel";

class DetailLevelStore extends PersistableStore<TableDetailLevel> {
  private detailLevel: TableDetailLevel = TableDetailLevel.FullDetails;
  private currentStoreKey = "none";

  constructor() {
    super("detailLevel", new AppLocalStorage());
  }

  public getCurrentDetailLevel(): TableDetailLevel {
    return this.detailLevel;
  }

  public saveCurrentState(): void {
    if (this.detailLevel === null) {
      this.persist(this.currentStoreKey, TableDetailLevel.FullDetails);
    } else {
      this.persist(this.currentStoreKey, this.detailLevel);
    }
  }

  public switchTo(newStoreKey: string): void {
    this.currentStoreKey = newStoreKey;
    const recoveredStore = this.retrieve(this.currentStoreKey);
    if (recoveredStore === null) {
      this.detailLevel = TableDetailLevel.FullDetails;
    }
    for (const val of Object.values(TableDetailLevel)) {
      if (val.toString() === String(recoveredStore)) {
        this.detailLevel = val;
      }
    }
  }

  public set(newState: TableDetailLevel): void {
    this.detailLevel = newState;
  }
}

export const detailLevelStore = new DetailLevelStore();
