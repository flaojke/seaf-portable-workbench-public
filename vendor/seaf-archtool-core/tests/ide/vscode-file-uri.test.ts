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
      Alexander Romashin <alexander.romashin@gmail.com>, Sber

  Contributors:
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {describe, expect, it} from '@jest/globals';
import {isSameFileUri, normalizeFileUri} from '@ide/vscode/fileUri';

const PREFIX = 'https://file+.vscode-resource.vscode-cdn.net';

describe('vscode fileUri', () => {
  it('путь из changeFile без кодирования совпадает с закодированным импортом', () => {
    const imported = `${PREFIX}/Users/arch/%D0%B0%D1%80%D1%85%D0%B8%D1%82%D0%B5%D0%BA%D1%82%D1%83%D1%80%D0%B0/my%20docs/root.yaml`;
    const changed = `${PREFIX}/Users/arch/архитектура/my docs/root.yaml`;

    expect(isSameFileUri(imported, changed)).toBe(true);
  });

  it('совпадающие без кодирования URI равны', () => {
    expect(isSameFileUri(`${PREFIX}/Users/arch/root.yaml`, `${PREFIX}/Users/arch/root.yaml`)).toBe(true);
  });

  it('другой файл не совпадает', () => {
    expect(isSameFileUri(`${PREFIX}/Users/arch/root.yaml`, `${PREFIX}/Users/arch/other.yaml`)).toBe(false);
  });

  it('импорт из bitbucket не совпадает с файлом проекта с тем же путем', () => {
    expect(isSameFileUri('bitbucket:P:repo:main@Users/arch/root.yaml', `${PREFIX}/Users/arch/root.yaml`)).toBe(false);
  });

  it('некорректный URI сравнивается как есть', () => {
    expect(normalizeFileUri('not a uri')).toBe('not a uri');
    expect(normalizeFileUri(`${PREFIX}/bad%E0%A4%A.yaml`)).toBe(`${PREFIX}/bad%E0%A4%A.yaml`);
  });
});
