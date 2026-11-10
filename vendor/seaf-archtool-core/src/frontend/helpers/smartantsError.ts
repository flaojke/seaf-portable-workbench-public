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

const DEFAULT_TEXT = 'Не удалось построить схему SmartAnts';

type ErrorDetails = {text?: unknown; name?: unknown; message?: unknown};
type BackendError = {response?: {data?: {result?: {error?: unknown}; message?: unknown}}};

function describe(error: unknown): string | null {
  if (!error || typeof error !== 'object') return typeof error === 'string' && error ? error : null;
  const details = error as ErrorDetails;
  if (details.text) return `${details.text}`;
  if (details.name && details.name !== 'Error' && details.message) return `${details.name}: ${details.message}`;
  return details.message ? `${details.message}` : null;
}

// Текст ошибки построения схемы для отображения пользователю.
// Источники: ответ backend (axios, 503 {message, result: {result: 'ERROR', error}}), воркер браузера ({name, message}), Error
export function smartantsErrorText(e: unknown): string {
  const data = (e as BackendError | null | undefined)?.response?.data;
  const text = describe(data?.result?.error)
    || (typeof data?.message === 'string' ? data.message : null)
    || describe(e);
  return text ? `${DEFAULT_TEXT}. ${text}` : DEFAULT_TEXT;
}
