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

import {
  AI_FILL_ERROR_TITLE,
  AiFillDialogState,
  AiFillSession,
  fillColumnRows,
  formatAgentRequest,
  parseColumnAgent,
  runWithAiFillDialogs
} from '../../../plugins/editable-table/lib/aiColumnFill';

const quietLogger = () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() });

// Логгер проекта принимает сообщение функцией: (msgFn, error)
const loggedMessages = (fn: jest.Mock) => fn.mock.calls.map(([msgFn, error]) => [msgFn(), error]);

const session = (overrides: Partial<AiFillSession> = {}): AiFillSession => ({
  start: jest.fn(async() => 'session-1'),
  send: jest.fn(async(_id: string, message: string) => `ответ на ${message}`),
  end: jest.fn(async() => undefined),
  ...overrides
});

describe('parseColumnAgent', () => {
  const settings = { params: [], input_headers: ['name'], request: 'Опиши [name]' };

  test('Идентификатор агента разбирается на документ и сценарий', () => {
    expect(parseColumnAgent({ 'ai.scenarios.describe': settings }, 'Описание')).toEqual({
      agentPath: 'ai.scenarios.describe', docId: 'ai', scenarioId: 'describe', settings
    });
  });

  test('У столбца не настроен агент', () => {
    for (const agent of [undefined, null, 'ai.scenarios.describe']) {
      expect(() => parseColumnAgent(agent, 'Описание')).toThrow('Для столбца «Описание» не настроен агент (поле agent).');
    }
  });

  test('Пустые или неверные настройки агента дают причину, понятную пользователю', () => {
    const reason = 'Для столбца «Описание» не настроен агент «ai.scenarios.describe»: не задан запрос (поле request).';
    for (const value of [null, undefined, '', 'Опиши', 42, [], {}, { request: '' }, { request: '   ' }, { request: 7 }]) {
      expect(() => parseColumnAgent({ 'ai.scenarios.describe': value }, 'Описание')).toThrow(reason);
    }
  });

  test('Без params и input_headers настройки получают пустые списки', () => {
    expect(parseColumnAgent({ 'ai.scenarios.describe': { request: 'Опиши' } }, 'Описание').settings)
      .toEqual({ params: [], input_headers: [], request: 'Опиши' });
    expect(parseColumnAgent({ 'ai.scenarios.describe': { request: 'Опиши', params: 'x', input_headers: ['name', 3] } }, 'Описание').settings)
      .toEqual({ params: [], input_headers: ['name'], request: 'Опиши' });
  });

  test('Идентификатор агента не разбирается', () => {
    expect(() => parseColumnAgent({ 'ai-describe': settings }, 'Описание'))
      .toThrow('Не удалось разобрать идентификатор агента «ai-describe». Ожидается вид <документ>.scenarios.<сценарий>.');
    expect(() => parseColumnAgent({}, 'Описание')).toThrow('Не удалось разобрать идентификатор агента «»');
  });
});

describe('formatAgentRequest', () => {
  test('Поля строки подставляются во все места запроса, объекты — в виде JSON', () => {
    expect(formatAgentRequest('[name] / [name]: [tags]', ['name', 'tags'], { name: 'CRM', tags: ['a', 'b'] }))
      .toBe('CRM / CRM: ["a","b"]');
  });

  test('Поля, которых нет в input_headers, не подставляются', () => {
    expect(formatAgentRequest('[name] [owner]', ['name'], { name: 'CRM', owner: 'ИТ' })).toBe('CRM [owner]');
  });
});

describe('fillColumnRows', () => {
  const rows: [string, { name: string }][] = [['r1', { name: 'A' }], ['r2', { name: 'B' }], ['r3', { name: 'C' }]];
  const build = (row: { name: string }) => row.name;

  test('Каждая строка отправляется агенту одной сессией, сессия завершается', async() => {
    const agent = session();
    const written: Record<string, unknown> = {};

    const result = await fillColumnRows(rows, agent, build, (rowId, response) => {
      written[rowId] = response;
      return true;
    }, quietLogger());

    expect(agent.start).toHaveBeenCalledTimes(1);
    expect(agent.send).toHaveBeenNthCalledWith(2, 'session-1', 'B');
    expect(written).toEqual({ r1: 'ответ на A', r2: 'ответ на B', r3: 'ответ на C' });
    expect(agent.end).toHaveBeenCalledWith('session-1');
    expect(result).toEqual({ processed: 3, total: 3 });
  });

  test('Агент не найден или не запустился — исключение с причиной, строки не обрабатываются', async() => {
    const agent = session({ start: jest.fn(async() => { throw new Error('Агент "ai.scenarios.x" не найден'); }) });

    await expect(fillColumnRows(rows, agent, build, () => true, quietLogger()))
      .rejects.toThrow('Не удалось запустить агента: Агент "ai.scenarios.x" не найден');
    expect(agent.send).not.toHaveBeenCalled();
    expect(agent.end).not.toHaveBeenCalled();
  });

  test('Ошибка отдельной строки пропускается с записью в журнал, остальные строки заполняются', async() => {
    const logger = quietLogger();
    const agent = session({
      send: jest.fn(async(_id: string, message: string) => {
        if (message === 'B') throw new Error('таймаут');
        return message;
      })
    });

    const result = await fillColumnRows(rows, agent, build, () => true, logger);

    expect(result).toEqual({ processed: 2, total: 3 });
    expect(loggedMessages(logger.error)).toEqual([['Ошибка при обработке строки r2', expect.any(Error)]]);
    expect(loggedMessages(logger.info)).toEqual([['Обработано строк: 2 из 3', undefined]]);
    expect(agent.end).toHaveBeenCalled();
  });

  test('Пустой ответ не считается записанным значением', async() => {
    const result = await fillColumnRows(rows, session(), build, (rowId) => rowId !== 'r1', quietLogger());

    expect(result).toEqual({ processed: 2, total: 3 });
  });

  test('Сбой завершения сессии не отменяет записанные значения и не считается ошибкой', async() => {
    const logger = quietLogger();
    const agent = session({ end: jest.fn(async() => { throw new Error('сессия уже закрыта'); }) });

    await expect(fillColumnRows(rows, agent, build, () => true, logger)).resolves.toEqual({ processed: 3, total: 3 });
    expect(loggedMessages(logger.warn)).toEqual([['Не удалось завершить сессию агента', expect.any(Error)]]);
  });
});

describe('runWithAiFillDialogs', () => {
  const dialogState = (): AiFillDialogState => ({ activeDialog: null });

  test('На время заполнения открыто окно ожидания, после успеха оно закрывается', async() => {
    const dialog = dialogState();
    let duringFill: string | null = null;

    await runWithAiFillDialogs(dialog, async() => {
      duringFill = dialog.activeDialog;
    }, quietLogger());

    expect(duringFill).toBe('loading');
    expect(dialog.activeDialog).toBeNull();
  });

  test('При неудаче окно ожидания сменяется окном ошибки с причиной', async() => {
    const dialog = dialogState();

    await runWithAiFillDialogs(dialog, async() => {
      throw new Error('Для столбца «Описание» не настроен агент (поле agent).');
    }, quietLogger());

    expect(dialog).toEqual({
      activeDialog: 'error',
      dialogTitle: AI_FILL_ERROR_TITLE,
      dialogMessage: 'Для столбца «Описание» не настроен агент (поле agent).'
    });
  });

  test('Ошибка не объектом Error тоже выводится', async() => {
    const dialog = dialogState();

    await runWithAiFillDialogs(dialog, () => Promise.reject('сеть недоступна'), quietLogger());

    expect(dialog.dialogMessage).toBe('сеть недоступна');
  });

  test('Окно, которое заполнение открыло само (например, ошибку сохранения), не закрывается', async() => {
    const dialog = dialogState();

    await runWithAiFillDialogs(dialog, async() => {
      dialog.activeDialog = 'error';
    }, quietLogger());

    expect(dialog.activeDialog).toBe('error');
  });

  test('Полный сценарий: у агента пустые настройки — окно ожидания закрыто, причина в окне ошибки', async() => {
    const dialog = dialogState();

    await runWithAiFillDialogs(dialog, async() => {
      parseColumnAgent({ 'ai.scenarios.describe': null }, 'Описание');
    }, quietLogger());

    expect(dialog.activeDialog).toBe('error');
    expect(dialog.dialogMessage).toBe('Для столбца «Описание» не настроен агент «ai.scenarios.describe»: не задан запрос (поле request).');
  });

  test('Полный сценарий: агент не запустился — окно ожидания закрыто, причина в окне ошибки', async() => {
    const dialog = dialogState();
    const agent = session({ start: jest.fn(async() => { throw new Error('нет связи'); }) });

    await runWithAiFillDialogs(dialog, () => fillColumnRows([['r1', {}]], agent, () => '', () => true, quietLogger()), quietLogger());

    expect(dialog.activeDialog).toBe('error');
    expect(dialog.dialogMessage).toBe('Не удалось запустить агента: нет связи');
  });
});
