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

import type Storage from "@/types/storage";

import { AppLocalStorage } from "@/storages/local";

export class PersistableStore<T> {
  private readonly storeName: string;
  private readonly storage: Storage<T>;

  constructor(storeName: string, storage?: Storage<T>) {
    this.storeName = storeName;
    this.storage = storage ?? new AppLocalStorage<T>();
  }

  createPersistanceKey(key: string): string {
    return `${this.storeName}:${key}`;
  }

  persist(name: string, value: T): void {
    const persistanceKey = this.createPersistanceKey(name);

    this.storage.setItem(persistanceKey, value);
  }

  retrieve(name: string): object | null {
    const persistanceKey = this.createPersistanceKey(name);

    return this.storage.getItem(persistanceKey);
  }

  clear(name: string): void {
    const persistanceKey = this.createPersistanceKey(name);

    this.storage.removeItem(persistanceKey);
  }
}
