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

// ERA-3562, TC-33 (test-cases.md): строка про схемы в комментарии к колонке link руководства step_0_base
// (источник страницы — template.md, пример — table.yaml). Отображение на странице — ручной/браузерный прогон.

import fs from 'fs';
import path from 'path';

const STEP_0 = path.resolve(__dirname, '../../../public/documentation/docs/manual/docs/editable_table/step_0_base');
const NOTE = 'Адреса со схемами javascript:, data:, vbscript: показываются текстом';

describe('TC-33: руководство step_0_base', () => {
  test.each(['table.yaml', 'template.md'])('%s: в комментарии к колонке link есть строка про схемы, строка одна', (file) => {
    const text = fs.readFileSync(path.join(STEP_0, file), 'utf8');
    const lines = text.split('\n').filter((line) => line.includes(NOTE));

    expect(lines).toHaveLength(1);
    // строка — комментарий с отступом блока примера, после описания колонки link
    expect(lines[0]).toMatch(/^\s+# Адреса со схемами/);
    expect(text.indexOf(NOTE)).toBeGreaterThan(text.indexOf('type: link'));
  });
});
