/*
  Copyright (C) 2026 Sber

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
      Vladislav Markin, Sber - 2026
*/

// Нумерация асинхронных построений: применять нужно только результат последнего запуска,
// ответы на более ранние запуски (пришедшие позже) - устаревшие
export class BuildSequence {
  private current = 0;

  // Начинает новое построение и делает все предыдущие устаревшими
  start(): number {
    return ++this.current;
  }

  isStale(seq: number): boolean {
    return seq !== this.current;
  }

  get last(): number {
    return this.current;
  }
}
