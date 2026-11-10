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

import { AppSessionStorage } from "@/storages/session";
import { type StageState } from "@/types/stage";

class StageStateStore extends PersistableStore<StageState> {
  private stageState: StageState | null = null;
  private currentStoreKey = "none";

  constructor() {
    super("stageState", new AppSessionStorage());
  }

  public getCurrentStageState(): StageState | null {
    return this.stageState;
  }

  public saveCurrentState(): void {
    if (this.stageState === null) {
      return;
    }
    this.persist(this.currentStoreKey, this.stageState);
  }

  public switchTo(newStoreKey: string): void {
    this.saveCurrentState();

    this.currentStoreKey = newStoreKey;
    const recoveredStore = this.retrieve(this.currentStoreKey) as StageState;
    if (recoveredStore === null) {
      this.stageState = null;
    }

    this.stageState = recoveredStore;
  }

  public set(newState: StageState): void {
    this.stageState = newState;
  }
}

export const stageStateStore = new StageStateStore();
