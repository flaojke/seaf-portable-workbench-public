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
      Zaznobin Saveliy <zaznobins@yandex.ru>

  Contributors:
      Zaznobin Saveliy <zaznobins@yandex.ru> - 2026
*/

jest.mock('@front/helpers/menu.mjs', () => ({
  getUserMenu: jest.fn()
}));

type LoadUserMenu = typeof import('@front/components/ArchSwitcher/userMenuCache').loadUserMenu;

const menuA = [{location: 'Документы', route: '/docs', title: 'Документы'}];
const menuB = [{location: 'Поиск', route: '/search', title: 'Поиск'}];
const manifestA = {id: 'a'};
const manifestB = {id: 'b'};
// Моменты загрузки манифеста (state.moment)
const MOMENT_A = 1761120000000;
const MOMENT_B = 1761120005000;

let loadUserMenu: LoadUserMenu;
let getUserMenu: jest.Mock;

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}

beforeEach(async() => {
  jest.resetModules();
  const menu = await import('@front/helpers/menu.mjs');
  getUserMenu = menu.getUserMenu as jest.Mock;
  getUserMenu.mockReset();
  ({loadUserMenu} = await import('@front/components/ArchSwitcher/userMenuCache'));
});

describe('userMenuCache', () => {
  test('повторный вызов в ту же загрузку манифеста, пока запрос в полёте, не стартует второй', async() => {
    const pending = deferred<unknown>();
    getUserMenu.mockReturnValue(pending.promise);

    const first = loadUserMenu(manifestA, MOMENT_A);
    const second = loadUserMenu(manifestA, MOMENT_A);

    expect(second).toBe(first);
    expect(getUserMenu).toHaveBeenCalledTimes(1);
    expect(getUserMenu).toHaveBeenCalledWith(manifestA);

    pending.resolve(menuA);

    await expect(first).resolves.toEqual(menuA);
    await expect(second).resolves.toBe(menuA);
  });

  test('успешный ответ кэшируется до следующей загрузки манифеста', async() => {
    getUserMenu.mockResolvedValue(menuA);

    await expect(loadUserMenu(manifestA, MOMENT_A)).resolves.toEqual(menuA);
    await expect(loadUserMenu(manifestA, MOMENT_A)).resolves.toBe(menuA);

    expect(getUserMenu).toHaveBeenCalledTimes(1);
  });

  test('новая загрузка того же объекта манифеста (обновление на месте) — новый запрос', async() => {
    getUserMenu.mockResolvedValueOnce(menuA).mockResolvedValueOnce(menuB);

    await expect(loadUserMenu(manifestA, MOMENT_A)).resolves.toEqual(menuA);
    await expect(loadUserMenu(manifestA, MOMENT_B)).resolves.toEqual(menuB);

    expect(getUserMenu).toHaveBeenCalledTimes(2);
    expect(getUserMenu).toHaveBeenLastCalledWith(manifestA);
  });

  test('ошибка сбрасывает кэш, следующий вызов идёт заново', async() => {
    const error = new Error('menu failed');
    getUserMenu.mockRejectedValueOnce(error).mockResolvedValueOnce(menuA);

    await expect(loadUserMenu(manifestA, MOMENT_A)).rejects.toBe(error);
    await expect(loadUserMenu(manifestA, MOMENT_A)).resolves.toEqual(menuA);

    expect(getUserMenu).toHaveBeenCalledTimes(2);
  });

  test('ответ устаревшего запроса не затирает кэш новой загрузки манифеста', async() => {
    const pendingA = deferred<unknown>();
    const pendingB = deferred<unknown>();
    getUserMenu.mockReturnValueOnce(pendingA.promise).mockReturnValueOnce(pendingB.promise);

    const first = loadUserMenu(manifestA, MOMENT_A);
    const second = loadUserMenu(manifestB, MOMENT_B);

    pendingA.resolve(menuA);
    await expect(first).resolves.toEqual(menuA);

    pendingB.resolve(menuB);
    await expect(second).resolves.toEqual(menuB);

    await expect(loadUserMenu(manifestB, MOMENT_B)).resolves.toBe(menuB);
    expect(getUserMenu).toHaveBeenCalledTimes(2);

    getUserMenu.mockResolvedValueOnce(menuA);
    await expect(loadUserMenu(manifestA, MOMENT_A)).resolves.toEqual(menuA);
    expect(getUserMenu).toHaveBeenCalledTimes(3);
  });

  test('ошибка устаревшего запроса не сбрасывает кэш нового', async() => {
    const error = new Error('stale');
    const pendingA = deferred<unknown>();
    const pendingB = deferred<unknown>();
    getUserMenu.mockReturnValueOnce(pendingA.promise).mockReturnValueOnce(pendingB.promise);

    const first = loadUserMenu(manifestA, MOMENT_A);
    const second = loadUserMenu(manifestB, MOMENT_B);
    const firstFailed = expect(first).rejects.toBe(error);

    pendingA.reject(error);
    await firstFailed;

    pendingB.resolve(menuB);
    await expect(second).resolves.toEqual(menuB);
    await expect(loadUserMenu(manifestB, MOMENT_B)).resolves.toBe(menuB);

    expect(getUserMenu).toHaveBeenCalledTimes(2);
  });

  test('не-массив сохраняется как пустой список', async() => {
    getUserMenu.mockResolvedValue({title: 'не список'});

    await expect(loadUserMenu(manifestA, MOMENT_A)).resolves.toEqual([]);
    await expect(loadUserMenu(manifestA, MOMENT_A)).resolves.toEqual([]);

    expect(getUserMenu).toHaveBeenCalledTimes(1);
  });
});
