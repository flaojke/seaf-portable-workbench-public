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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber

  Contributors:
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
*/

// Ошибка запроса в песочнице JSONata (JSONata/DevTool.vue): текст, код и место ошибки в запросе.

// Ошибка JSONata: code (например, S0211), position — позиция после ошибочного токена, token — сам токен.
// Ошибки backend и прочие приходят без позиции или строкой.
export interface JsonataError {
  message?: string;
  code?: string;
  position?: number;
  token?: unknown;
}

export interface JsonataErrorInfo {
  message: string;
  code: string | null;
  position: number | null;   // null — место ошибки неизвестно, блок «Место ошибки» не выводится
  before: string;            // запрос до ошибочного токена
  at: string;                // ошибочный токен; пусто — на месте ошибки ставится отметка-курсор
  after: string;             // запрос после токена
}

const isJsonataError = (error: unknown): error is JsonataError =>
  !!error && (typeof error === 'object');

const errorMessage = (error: unknown): string => {
  if (typeof error === 'string') return error;
  if (isJsonataError(error) && error.message) return error.message;
  return String(error);
};

// Запрос выполняется обернутым в скобки: (запрос), поэтому позиция JSONata сдвинута на один символ.
// Токен обычно стоит прямо перед позицией; у ошибок выполнения (вызов функции) — чуть раньше.
export const jsonataErrorInfo = (error: unknown, query: string | null | undefined): JsonataErrorInfo => {
  const message = errorMessage(error);
  const code = (isJsonataError(error) && error.code) || null;
  if (!isJsonataError(error) || !Number.isInteger(error.position)) {
    return { message, code, position: null, before: '', at: '', after: '' };
  }

  const text = query || '';
  const end = Math.min(Math.max((error.position as number) - 1, 0), text.length);
  const token = typeof error.token === 'string' ? error.token : '';
  const start = token ? text.lastIndexOf(token, end - token.length) : -1;
  const found = start >= 0;
  return {
    message,
    code,
    position: end,
    before: text.slice(0, found ? start : end),
    at: found ? token : '',
    after: text.slice(found ? start + token.length : end)
  };
};
