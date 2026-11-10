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

import {afterEach, beforeAll, beforeEach, describe, expect, it} from '@jest/globals';

const savedEnv = {...process.env};
let env: any;

beforeAll(async() => {
  // env.ts обращается к window при импорте
  (global as any).window = {origin: 'https://portal.example'};
  env = (await import('@front/helpers/env')).default;
});

beforeEach(() => {
  (global as any).window = {origin: 'https://portal.example'};
  process.env.VUE_APP_DOCHUB_MODE = 'backend';
  delete process.env.VUE_APP_DOCHUB_SMART_ANTS_MODE;
  env.setBackendEnv(undefined as any);
});

afterEach(() => {
  process.env = {...savedEnv};
});

describe('env.smartantsMode', () => {
  it('без настроек - front', () => {
    expect(env.smartantsMode).toBe('front');
  });

  it('берёт значение сборки, если backend не передал режим', () => {
    process.env.VUE_APP_DOCHUB_SMART_ANTS_MODE = 'Backend';
    env.setBackendEnv({});
    expect(env.smartantsMode).toBe('backend');
  });

  it('значение backend важнее значения сборки', () => {
    process.env.VUE_APP_DOCHUB_SMART_ANTS_MODE = 'front';
    env.setBackendEnv({smartantsMode: 'SERVICE'});
    expect(env.smartantsMode).toBe('service');
  });

  it('вне backend-режима всегда front', () => {
    process.env.VUE_APP_DOCHUB_MODE = 'frontend';
    env.setBackendEnv({smartantsMode: 'service'});
    expect(env.smartantsMode).toBe('front');
  });

  it('в плагине всегда front', () => {
    (global as any).window = {origin: 'https://portal.example', DocHubIDEACodeExt: {}};
    env.setBackendEnv({smartantsMode: 'service'});
    expect(env.smartantsMode).toBe('front');
  });
});
