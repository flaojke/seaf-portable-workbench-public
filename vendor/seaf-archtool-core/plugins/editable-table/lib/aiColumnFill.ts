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

// Заполнение столбца редактируемой таблицы агентом ИИ (mixins/GigaChatMixin.vue): разбор настройки агента,
// обход строк и исходы — окно ожидания закрывается всегда, при неудаче выводится окно ошибки с причиной.

import type { SeafTaggedLogger } from '@global/logger/v2/logger.types';

// Настройка агента в заголовке столбца: { "<документ>.scenarios.<сценарий>": { params, input_headers, request } }.
// После разбора params и input_headers — всегда массивы, request — непустой текст запроса.
export interface AgentColumnSettings {
  params: unknown[];
  input_headers: string[];
  request: string;
}

export interface ColumnAgent {
  agentPath: string;
  docId: string;
  scenarioId: string;
  settings: AgentColumnSettings;
}

// Состояние окон таблицы: окно ожидания ('loading') и окно ошибки ('error') с заголовком и текстом
export interface AiFillDialogState {
  activeDialog: string | null;
  dialogTitle?: string;
  dialogMessage?: string;
}

// Сессия агента. start бросает исключение, если агент не найден или не запустился
export interface AiFillSession {
  start: () => Promise<string>;
  send: (sessionId: string, message: string) => Promise<unknown>;
  end: (sessionId: string) => Promise<unknown>;
}

// Логгер плагина (logger из plugins/editable-table/index.js); передается явно, чтобы модуль не зависел от DocHub
export type AiFillLogger = Pick<SeafTaggedLogger, 'error' | 'warn' | 'info'>;

export interface AiFillResult {
  processed: number;
  total: number;
}

export const AI_FILL_ERROR_TITLE = 'Не удалось заполнить столбец';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && (typeof value === 'object') && !Array.isArray(value);

// Агент столбца или исключение с причиной, понятной пользователю
export const parseColumnAgent = (agent: unknown, columnTitle: string): ColumnAgent => {
  if (!isRecord(agent)) {
    throw new Error(`Для столбца «${columnTitle}» не настроен агент (поле agent).`);
  }
  const agentPath = Object.keys(agent)[0] || '';
  const [docId, , scenarioId] = agentPath.split('.');
  if (!docId || !scenarioId) {
    throw new Error(`Не удалось разобрать идентификатор агента «${agentPath}». Ожидается вид <документ>.scenarios.<сценарий>.`);
  }
  const settings = agent[agentPath];
  const request = isRecord(settings) ? settings.request : undefined;
  if (!isRecord(settings) || (typeof request !== 'string') || !request.trim()) {
    throw new Error(`Для столбца «${columnTitle}» не настроен агент «${agentPath}»: не задан запрос (поле request).`);
  }
  return {
    agentPath,
    docId,
    scenarioId,
    settings: {
      params: Array.isArray(settings.params) ? settings.params : [],
      input_headers: Array.isArray(settings.input_headers)
        ? settings.input_headers.filter((header): header is string => typeof header === 'string')
        : [],
      request
    }
  };
};

// Запрос к агенту для строки: [поле] заменяется значением поля строки, объекты — в виде JSON
export const formatAgentRequest = (request: string, inputHeaders: string[], row: Record<string, unknown>): string =>
  inputHeaders.reduce((result, inputHeader) => {
    const value = row[inputHeader];
    return result.replace(
      new RegExp(`\\[${inputHeader}\\]`, 'g'),
      typeof value === 'object' ? JSON.stringify(value) : String(value)
    );
  }, request);

// Обход строк одной сессией агента. Не запустился агент — исключение с причиной; ошибка отдельной строки
// пропускается с записью в журнал; сбой завершения сессии не отменяет уже записанные значения.
// applyResponse записывает ответ в строку и возвращает true, если значение записано.
export async function fillColumnRows<Row>(
  rows: [string, Row][],
  session: AiFillSession,
  buildRequest: (row: Row) => string,
  applyResponse: (rowId: string, response: unknown) => boolean,
  logger: AiFillLogger
): Promise<AiFillResult> {
  let sessionId: string;
  try {
    sessionId = await session.start();
  } catch (e) {
    logger.warn(() => 'Инициализация агента прошла не успешно', e);
    throw new Error(`Не удалось запустить агента: ${(e as Error)?.message || e}`);
  }

  let processed = 0;
  try {
    for (const [rowId, row] of rows) {
      try {
        const response = await session.send(sessionId, buildRequest(row));
        if (applyResponse(rowId, response)) processed++;
      } catch (error) {
        logger.error(() => `Ошибка при обработке строки ${rowId}`, error);
      }
    }
  } finally {
    try {
      await session.end(sessionId);
    } catch (e) {
      logger.warn(() => 'Не удалось завершить сессию агента', e);
    }
    logger.info(() => `Обработано строк: ${processed} из ${rows.length}`);
  }
  return { processed, total: rows.length };
}

// Заполнение с окнами: на время работы — окно ожидания (закрыть его нельзя), по итогу оно закрывается
// при любом исходе, а при неудаче открывается окно ошибки с причиной
export async function runWithAiFillDialogs(
  dialog: AiFillDialogState,
  fill: () => Promise<unknown>,
  logger: AiFillLogger
): Promise<void> {
  dialog.activeDialog = 'loading';
  try {
    await fill();
  } catch (error) {
    logger.error(() => 'Ошибка при заполнении столбца с помощью ИИ', error);
    dialog.dialogTitle = AI_FILL_ERROR_TITLE;
    dialog.dialogMessage = (error as Error)?.message || String(error);
    dialog.activeDialog = 'error';
  } finally {
    if (dialog.activeDialog === 'loading') dialog.activeDialog = null;
  }
}
