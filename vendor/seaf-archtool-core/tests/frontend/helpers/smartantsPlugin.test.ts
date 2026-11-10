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

import {afterEach, beforeAll, describe, expect, test} from '@jest/globals';

// Окно браузера в тестах: только поля, которые читает env
const win = (): any => (global as any).window;
let env: any;
beforeAll(async() => {
    (global as any).window = {location: {origin: 'https://portal.example', protocol: 'https:'}, origin: 'https://portal.example'};
    ({default: env} = await import('@front/helpers/env'));
});

// Расчёт SmartAnts в плагине (JetBrains, VS Code) включается, только если плагин объявил поддержку в настройках
describe('env.isSmartantsInPlugin', () => {
    afterEach(() => {
        delete win().DocHubIDEACodeExt;
        delete win().DochubVsCodeExt;
    });

    test('JetBrains plugin that declares smartants', () => {
        win().DocHubIDEACodeExt = {settings: {smartants: {version: '1.23.0'}}};
        expect(env.isSmartantsInPlugin).toBe(true);
    });

    test('older JetBrains plugin without the declaration', () => {
        win().DocHubIDEACodeExt = {settings: {api: '1.0.0'}};
        expect(env.isSmartantsInPlugin).toBe(false);
    });

    test('settings not received yet', () => {
        win().DocHubIDEACodeExt = {};
        expect(env.isSmartantsInPlugin).toBe(false);
    });

    test('VS Code extension that declares smartants', () => {
        win().DochubVsCodeExt = {settings: {smartants: {version: '1.22.0'}}};
        expect(env.isSmartantsInPlugin).toBe(true);
    });

    // Без Java расширение поддержку объявляет (ошибку отдаёт compute), не объявляет - только без JAR
    test('VS Code extension without the SmartAnts JAR', () => {
        win().DochubVsCodeExt = {settings: {isEnterprise: false}};
        expect(env.isSmartantsInPlugin).toBe(false);
    });

    test('portal', () => {
        expect(env.isSmartantsInPlugin).toBe(false);
    });
});
